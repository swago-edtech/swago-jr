import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  connectDB,
  InventoryItem,
  InventoryTransaction,
  ProductConfig,
  syncAffectedProducts,
  checkAndNotifyLowStock,
} from "@swago/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    const item = await InventoryItem.findById(id);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    const { name, sku, description, unit, lowStockThreshold, targetQuantity, isActive } = body;

    const normalizedSku = typeof sku === "string" ? sku.trim() : "";
    const fields = {
      name,
      description,
      unit,
      lowStockThreshold,
      targetQuantity,
      isActive,
    };

    const item = await InventoryItem.findByIdAndUpdate(
      id,
      normalizedSku
        ? { ...fields, sku: normalizedSku }
        : { $set: fields, $unset: { sku: 1 } },
      { new: true, runValidators: true }
    );

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await syncAffectedProducts([id]);
    // Fire-and-forget: threshold may have been raised, making existing stock critical
    checkAndNotifyLowStock().catch(() => {});

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Permanently remove a stock item. Requires zero stock and no product-config usage. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params;
    const item = await InventoryItem.findById(id);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if ((item.currentStock ?? 0) > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete while stock is ${item.currentStock}. Reduce stock to 0 first (or keep the item deactivated).`,
        },
        { status: 400 }
      );
    }

    const configs = await ProductConfig.find({
      "components.inventoryItemId": id,
    })
      .select("productName productId")
      .lean();

    if (configs.length > 0) {
      const names = configs
        .map((c: any) => c.productName || String(c.productId))
        .filter(Boolean);
      const list = names.slice(0, 5).join(", ");
      const extra = names.length > 5 ? ` (+${names.length - 5} more)` : "";
      return NextResponse.json(
        {
          error: `Cannot delete: this item is still used in product configuration${names.length === 1 ? "" : "s"}: ${list}${extra}. Remove it from those configs first.`,
        },
        { status: 400 }
      );
    }

    await InventoryTransaction.deleteMany({ inventoryItemId: id });
    await InventoryItem.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
