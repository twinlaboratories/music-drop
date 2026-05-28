import { kv } from "@vercel/kv";
import { promises as fs } from "fs";
import path from "path";
import { PRODUCTS } from "@/config/products";

export type ShirtSize = "S" | "M" | "L" | "XL";
export type TshirtInventory = Record<string, Record<ShirtSize, number>>;
export type StockReservation = { productId: string; size: ShirtSize; quantity: number };

const SIZES: ShirtSize[] = ["S", "M", "L", "XL"];
const DATA_FILE = path.join(process.cwd(), "data", "tshirt-inventory.json");

function useKv(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function inventoryKey(productId: string, size: ShirtSize): string {
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
    await writeFileInventory(initial);
    return initial;
  }
}

async function writeFileInventory(inventory: TshirtInventory): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(inventory, null, 2));
}

async function ensureKvStock(productId: string, size: ShirtSize): Promise<void> {
  const key = inventoryKey(productId, size);
  const current = await kv.get<number>(key);
  if (current === null) {
    await kv.set(key, initialStockFor(productId, size));
  }
}

export async function getTshirtInventory(): Promise<TshirtInventory> {
  if (useKv()) {
    const inventory: TshirtInventory = {};
    for (const product of PRODUCTS) {
      if (product.type !== "tshirt") continue;
      const sizeMap: Record<ShirtSize, number> = { S: 0, M: 0, L: 0, XL: 0 };
      for (const size of SIZES) {
        await ensureKvStock(product.id, size);
        sizeMap[size] = (await kv.get<number>(inventoryKey(product.id, size))) ?? 0;
      }
      inventory[product.id] = sizeMap;
    }
    return inventory;
  }

  return readFileInventory();
}

export async function reserveTshirtStock(
  productId: string,
  size: ShirtSize,
  quantity: number
): Promise<boolean> {
  if (quantity <= 0) return false;

  if (useKv()) {
    const key = inventoryKey(productId, size);
    await ensureKvStock(productId, size);
    const remaining = await kv.decrby(key, quantity);
    if (remaining < 0) {
      await kv.incrby(key, quantity);
      return false;
    }
    return true;
  }

  const inventory = await readFileInventory();
  const available = inventory[productId]?.[size] ?? 0;
  if (available < quantity) return false;
  inventory[productId][size] = available - quantity;
  await writeFileInventory(inventory);
  return true;
}

export async function releaseTshirtStock(
  productId: string,
  size: ShirtSize,
  quantity: number
): Promise<void> {
  if (quantity <= 0) return;

  if (useKv()) {
    const key = inventoryKey(productId, size);
    await ensureKvStock(productId, size);
    await kv.incrby(key, quantity);
    return;
  }

  const inventory = await readFileInventory();
  inventory[productId][size] = (inventory[productId]?.[size] ?? 0) + quantity;
  await writeFileInventory(inventory);
}

export async function saveReservation(sessionId: string, items: StockReservation[]): Promise<void> {
  if (!useKv()) return;
  await kv.set(reservationKey(sessionId), items, { ex: 60 * 60 * 24 });
}

export async function loadReservation(sessionId: string): Promise<StockReservation[] | null> {
  if (!useKv()) return null;
  return (await kv.get<StockReservation[]>(reservationKey(sessionId))) ?? null;
}

export async function clearReservation(sessionId: string): Promise<void> {
  if (!useKv()) return;
  await kv.del(reservationKey(sessionId));
}

export async function markEventProcessed(sessionId: string, event: string): Promise<boolean> {
  if (!useKv()) return false;
  const key = processedKey(sessionId, event);
  const existing = await kv.get(key);
  if (existing) return true;
  await kv.set(key, 1, { ex: 60 * 60 * 24 * 30 });
  return false;
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
