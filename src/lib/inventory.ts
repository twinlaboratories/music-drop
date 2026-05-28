import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { PRODUCTS } from "@/config/products";

export type ShirtSize = "S" | "M" | "L" | "XL";
export type TshirtInventory = Record<string, Record<ShirtSize, number>>;
export type StockReservation = { productId: string; size: ShirtSize; quantity: number };

const SIZES: ShirtSize[] = ["S", "M", "L", "XL"];
const DATA_FILE = path.join(process.cwd(), "data", "tshirt-inventory.json");
const INVENTORY_KEY = "tshirt-inventory:v1";

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
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

async function readFileInventory(): Promise<TshirtInventory> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as TshirtInventory;
  } catch {
    const initial = buildInitialInventoryFromProducts();
    await writeFileInventory(initial);
    return initial;
  }
}

async function writeFileInventory(inventory: TshirtInventory): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(inventory, null, 2));
}

async function readRedisInventory(redis: Redis): Promise<TshirtInventory | null> {
  return (await redis.get<TshirtInventory>(INVENTORY_KEY)) ?? null;
}

async function writeRedisInventory(redis: Redis, inventory: TshirtInventory): Promise<void> {
  await redis.set(INVENTORY_KEY, inventory);
}

async function loadInventory(): Promise<TshirtInventory> {
  const redis = getRedis();
  if (redis) {
    try {
      const stored = await readRedisInventory(redis);
      if (stored) return stored;
      const initial = buildInitialInventoryFromProducts();
      await writeRedisInventory(redis, initial);
      return initial;
    } catch (error) {
      console.error("Redis inventory read failed, using catalog:", error);
      return buildInitialInventoryFromProducts();
    }
  }
  return readFileInventory();
}

async function saveInventory(inventory: TshirtInventory): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      await writeRedisInventory(redis, inventory);
      return;
    } catch (error) {
      console.error("Redis inventory write failed, using file:", error);
    }
  }
  await writeFileInventory(inventory);
}

export async function syncInventoryFromProducts(): Promise<TshirtInventory> {
  const inventory = buildInitialInventoryFromProducts();
  await saveInventory(inventory);
  return inventory;
}

export async function getTshirtInventory(): Promise<TshirtInventory> {
  return loadInventory();
}

export async function reserveTshirtStock(
  productId: string,
  size: ShirtSize,
  quantity: number
): Promise<boolean> {
  if (quantity <= 0) return false;

  const inventory = await loadInventory();
  const available = inventory[productId]?.[size] ?? 0;
  if (available < quantity) return false;

  inventory[productId][size] = available - quantity;
  await saveInventory(inventory);
  return true;
}

export async function releaseTshirtStock(
  productId: string,
  size: ShirtSize,
  quantity: number
): Promise<void> {
  if (quantity <= 0) return;

  const inventory = await loadInventory();
  inventory[productId][size] = (inventory[productId]?.[size] ?? 0) + quantity;
  await saveInventory(inventory);
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

/** Client-safe fallback when /api/inventory is unavailable */
export function catalogInventoryForClient(): TshirtInventory {
  return buildInitialInventoryFromProducts();
}
