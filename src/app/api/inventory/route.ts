import { NextResponse } from "next/server";
import { getTshirtInventory } from "@/lib/inventory";

export async function GET() {
  try {
    const inventory = await getTshirtInventory();
    return NextResponse.json({ inventory });
  } catch (error) {
    console.error("Inventory read error:", error);
    return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
  }
}
