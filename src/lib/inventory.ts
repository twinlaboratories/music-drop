import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { PRODUCTS } from "@/config/products";

export type ShirtSize = "S" | "M" | "L" | "XL";
export type TshirtInventory = Record<string, Record<ShirtSize, number>>;
export type StockReservation = { productId: string; size: ShirtSize; quantity: number };
export type ReserveResult =
  | { ok: true }
  | { ok: false; reason: "insufficient" | "storage"; message: string };

const SIZES: ShirtSize[] = ["S", "M", "L", "XL"];
const DATA_FILE = path.join(process.cwd(), "data", "tshirt-inventory.json");
const LEGACY_INVENTORY_KEY = "tshirt-inventory:v1";

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function canUseFileStorage(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.VERCEL;
}

function skuKey(productId: string, size: ShirtSize): string {
  return `inv:${productId}:${size}`;
}

function reservationKey(sessionId: string): string {
  return `res:${sessionId}`;
}

function processedKey(sessionId: string, event: string): string {
  return `done:${event}:${sessionId}`;
}

export function buildInitialInventoryFromProducts(): TshirtInventory {
  const inventory: TshirtInventory = {};
  for (const product of PRODUCTS) {
    if (product.type !== "tshirt") continue;
    const sizeMap: Record<ShirtSize, number> = { S: 0, M: 0, L: 0, XL: 0 };
    for (const size of product.sizes ?? []) {
      sizeMap[size.label] = size.stock;
    }
    inventory[product.id] = sizeMap;
  }
  return inventory;
}

function initialStockFor(productId: string, size: ShirtSize): number {
  const product = PRODUCTS.find((p) => p.id === productId);
  const entry = product?.sizes?.find((s) => s.label === size);
  return entry?.stock ?? 0;
}

async function readFileInventory(): Promise<TshirtInventory> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as TshirtInventory;
  } catch {
    const initial = buildInitialInventoryFromProducts();
    if (canUseFileStorage()) {
      await writeFileInventory(initial);
    }
    return initial;
  }
}

async function writeFileInventory(inventory: TshirtInventory): Promise<void> {
  if (!canUseFileStorage()) return;
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(inventory, null, 2));
}

/** One-time: replace depleted legacy JSON blob with per-SKU keys from catalog */
async function migrateLegacyBlob(redis: Redis): Promise<void> {
  const legacy = await redis.get(LEGACY_INVENTORY_KEY);
  if (legacy === null || legacy === undefined) return;

  const catalog = buildInitialInventoryFromProducts();
  for (const [productId, sizes] of Object.entries(catalog)) {
    for (const size of SIZES) {
      await redis.set(skuKey(productId, size), sizes[size]);
    }
  }
  await redis.del(LEGACY_INVENTORY_KEY);
}

async function ensureSkuStock(redis: Redis, productId: string, size: ShirtSize): Promise<number> {
  const key = skuKey(productId, size);
  const current = await redis.get<number>(key);
  if (current !== null && current !== undefined) {
    return Number(current);
  }
  const initial = initialStockFor(productId, size);
  await redis.set(key, initial);
  return initial;
}

async function loadRedisInventory(redis: Redis): Promise<TshirtInventory> {
  await migrateLegacyBlob(redis);

  const inventory: TshirtInventory = {};
  for (const product of PRODUCTS) {
    if (product.type !== "tshirt") continue;
    const sizeMap: Record<ShirtSize, number> = { S: 0, M: 0, L: 0, XL: 0 };
    for (const size of SIZES) {
      sizeMap[size] = await ensureSkuStock(redis, product.id, size);
    }
    inventory[product.id] = sizeMap;
  }
  return inventory;
}

async function loadInventory(): Promise<{ inventory: TshirtInventory; source: "redis" | "file" | "catalog" }> {
  const redis = getRedis();
  if (redis) {
    try {
      const inventory = await loadRedisInventory(redis);
      return { inventory, source: "redis" };
    } catch (error) {
      console.error("Redis inventory read failed:", error);
      return { inventory: buildInitialInventoryFromProducts(), source: "catalog" };
    }
  }

  if (canUseFileStorage()) {
    return { inventory: await readFileInventory(), source: "file" };
  }

  return { inventory: buildInitialInventoryFromProducts(), source: "catalog" };
}

export async function getTshirtInventory(): Promise<TshirtInventory> {
  const { inventory } = await loadInventory();
  return inventory;
}

export async function getInventoryWithMeta(): Promise<{
  inventory: TshirtInventory;
  source: "redis" | "file" | "catalog";
}> {
  return loadInventory();
}

export async function syncInventoryFromProducts(): Promise<TshirtInventory> {
  const catalog = buildInitialInventoryFromProducts();
  const redis = getRedis();

  if (redis) {
    for (const [productId, sizes] of Object.entries(catalog)) {
      for (const size of SIZES) {
        await redis.set(skuKey(productId, size), sizes[size]);
      }
    }
    await redis.del(LEGACY_INVENTORY_KEY);
    return catalog;
  }

  if (canUseFileStorage()) {
    await writeFileInventory(catalog);
  }

  return catalog;
}

export async function reserveTshirtStock(
  productId: string,
  size: ShirtSize,
  quantity: number
): Promise<ReserveResult> {
  if (quantity <= 0) {
    return { ok: false, reason: "insufficient", message: "Invalid quantity" };
  }

  const redis = getRedis();
  if (!redis) {
    if (canUseFileStorage()) {
      const inventory = await readFileInventory();
      const available = inventory[productId]?.[size] ?? 0;
      if (available < quantity) {
        return { ok: false, reason: "insufficient", message: "Not enough stock" };
      }
      inventory[productId][size] = available - quantity;
      await writeFileInventory(inventory);
      return { ok: true };
    }
    return {
      ok: false,
      reason: "storage",
      message: "Inventory storage is not available. Connect Redis in Vercel and redeploy.",
    };
  }

  try {
    await migrateLegacyBlob(redis);
    await ensureSkuStock(redis, productId, size);
    const key = skuKey(productId, size);
    const remaining = await redis.decrby(key, quantity);

    if (remaining < 0) {
      await redis.incrby(key, quantity);
      return { ok: false, reason: "insufficient", message: "Not enough stock" };
    }

    return { ok: true };
  } catch (error) {
    console.error("reserveTshirtStock error:", error);
    return {
      ok: false,
      reason: "storage",
      message: error instanceof Error ? error.message : "Could not update inventory",
    };
  }
}

export async function releaseTshirtStock(
  productId: string,
  size: ShirtSize,
  quantity: number
): Promise<void> {
  if (quantity <= 0) return;

  const redis = getRedis();
  if (redis) {
    try {
      await redis.incrby(skuKey(productId, size), quantity);
      return;
    } catch (error) {
      console.error("releaseTshirtStock redis error:", error);
    }
  }

  if (!canUseFileStorage()) return;

  const inventory = await readFileInventory();
  inventory[productId][size] = (inventory[productId]?.[size] ?? 0) + quantity;
  await writeFileInventory(inventory);
}

export async function saveReservation(sessionId: string, items: StockReservation[]): Promise<void> {
  const redis = getRedis();
  if (!redis || items.length === 0) return;
  try {
    await redis.set(reservationKey(sessionId), items, { ex: 60 * 60 * 24 });
  } catch (error) {
    console.error("Failed to save reservation:", error);
  }
}

export async function loadReservation(sessionId: string): Promise<StockReservation[] | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return (await redis.get<StockReservation[]>(reservationKey(sessionId))) ?? null;
  } catch {
    return null;
  }
}

export async function clearReservation(sessionId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(reservationKey(sessionId));
  } catch {
    /* ignore */
  }
}

export async function markEventProcessed(sessionId: string, event: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    const key = processedKey(sessionId, event);
    const existing = await redis.get(key);
    if (existing) return true;
    await redis.set(key, 1, { ex: 60 * 60 * 24 * 30 });
    return false;
  } catch {
    return false;
  }
}

export async function releaseReservations(items: StockReservation[]): Promise<void> {
  for (const item of items) {
    await releaseTshirtStock(item.productId, item.size, item.quantity);
  }
}

export function encodeReservations(items: StockReservation[]): string {
  return items.map((r) => `${r.productId}:${r.size}:${r.quantity}`).join(",");
}

export function decodeReservations(raw: string | undefined | null): StockReservation[] {
  if (!raw) return [];
  return raw
    .split(",")
    .filter(Boolean)
    .map((part) => {
      const [productId, size, quantity] = part.split(":");
      return {
        productId,
        size: size as ShirtSize,
        quantity: Number(quantity),
      };
    })
    .filter((r) => r.productId && r.size && r.quantity > 0);
}

export function catalogInventoryForClient(): TshirtInventory {
  return buildInitialInventoryFromProducts();
}
