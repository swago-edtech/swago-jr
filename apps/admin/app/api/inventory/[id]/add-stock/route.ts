import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB, InventoryItem, InventoryTransaction, syncAffectedProducts, checkAndNotifyLowStock } from "@swago/database";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    await connectDB();

    const { id } = await params;
    const { quantity, reason } = await request.json();

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: "Quantity must be greater than 0" }, { status: 400 });
    }

    const item = await InventoryItem.findById(id);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const previousStock = item.currentStock;
    item.currentStock += quantity;
    await item.save();

    const transaction = await InventoryTransaction.create({
      inventoryItemId: item._id,
      inventoryItemName: item.name,
      type: "addition",
      quantity,
      previousStock,
      newStock: item.currentStock,
      reason: reason || "Manual addition",
      performedBy: session.name || "Admin",
    });

    // Background sync all affected products
    await syncAffectedProducts([id]);
    // Fire-and-forget: check low-stock thresholds (item may still be below threshold after restock)
    checkAndNotifyLowStock().catch(() => {});

    return NextResponse.json({ success: true, item, transaction });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
