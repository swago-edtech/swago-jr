import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { requireAdmin } from "@/lib/auth";
import { connectDB, InventoryItem, InventoryTransaction, syncAffectedProducts, checkAndNotifyLowStock } from "@swago/database";

// POST body: { quantity, reason?, mode?: "restock" | "discard" }
// "discard" writes off faulty/damaged units (logged as type "discard", not a sale).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const quantity = Number(body.quantity);
    const reason = String(body.reason || "").trim();
    const discard = body.mode === "discard";

    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Quantity must be a whole number of at least 1" }, { status: 400 });
    }

    // Atomic update; a discard only matches if enough stock exists.
    const item = await InventoryItem.findOneAndUpdate(
      discard ? { _id: id, currentStock: { $gte: quantity } } : { _id: id },
      { $inc: { currentStock: discard ? -quantity : quantity } },
      { new: true }
    );
    if (!item) {
      const existing = await InventoryItem.findById(id).select("currentStock unit");
      if (!existing) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      const available = Math.max(0, existing.currentStock || 0);
      return NextResponse.json(
        { error: `Only ${available} ${existing.unit || "pcs"} in stock — can't discard ${quantity}` },
        { status: 400 }
      );
    }

    const previousStock = item.currentStock + (discard ? quantity : -quantity);
    const transaction = await InventoryTransaction.create({
      inventoryItemId: item._id,
      inventoryItemName: item.name,
      type: discard ? "discard" : "addition",
      quantity,
      previousStock,
      newStock: item.currentStock,
      reason: reason || (discard ? "Discarded (faulty / damaged)" : "Manual addition"),
      performedBy: session.name || "Admin",
    });

    // Background sync all affected products
    await syncAffectedProducts([id]);
    // Fire-and-forget: check low-stock thresholds (item may still be below threshold after restock)
    checkAndNotifyLowStock().catch(() => {});

    return NextResponse.json({ success: true, item, transaction });
  } catch (error: any) {
    const message = error?.message || "Failed to update stock";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
