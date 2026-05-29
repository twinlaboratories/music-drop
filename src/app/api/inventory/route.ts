import { NextRequest, NextResponse } from "next/server";
import {
  buildInitialInventoryFromProducts,
  catalogInventoryForClient,
  getInventoryWithMeta,
  redisEnvDiagnostics,
  syncInventoryFromProducts,
} from "@/lib/inventory";

export async function GET(req: NextRequest) {
  const debug = req.nextUrl.searchParams.get("debug") === "1";
  try {
    const { inventory, source } = await getInventoryWithMeta();
    return NextResponse.json({
      inventory,
      source,
      ...(debug ? { diagnostics: redisEnvDiagnostics() } : {}),
    });
  } catch (error) {
    console.error("Inventory read error:", error);
    return NextResponse.json({
      inventory: catalogInventoryForClient(),
      source: "catalog-fallback",
      ...(debug ? { diagnostics: redisEnvDiagnostics() } : {}),
    });
  }
}

/** Reset live stock to match src/config/products.ts */
export async function POST(req: NextRequest) {
  const secret = process.env.INVENTORY_SYNC_SECRET;
  const provided = req.headers.get("x-inventory-secret");

  if (process.env.NODE_ENV === "production") {
    if (!secret || provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const inventory = await syncInventoryFromProducts();
    return NextResponse.json({
      ok: true,
      inventory,
      catalog: buildInitialInventoryFromProducts(),
    });
  } catch (error) {
    console.error("Inventory sync error:", error);
    return NextResponse.json({ error: "Failed to sync inventory" }, { status: 500 });
  }
}
