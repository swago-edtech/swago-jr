import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB, InventoryItem, InventoryTransaction } from "@swago/database";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const stockStatus = searchParams.get("stockStatus");
    const isActive = searchParams.get("isActive");

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    if (isActive !== null && isActive !== undefined && isActive !== "") {
      query.isActive = isActive === "true";
    }

    if (stockStatus) {
      if (stockStatus === "in-stock") {
        query.currentStock = { $gt: 0 };
      } else if (stockStatus === "out-of-stock") {
        query.currentStock = { $lte: 0 };
      } else if (stockStatus === "low-stock") {
        query.$expr = {
          $and: [
            { $gt: ["$currentStock", 0] },
            { $lte: ["$currentStock", "$lowStockThreshold"] },
          ],
        };
      } else if (stockStatus === "below-target") {
        query.$expr = { $lt: ["$currentStock", "$targetQuantity"] };
      }
    }

    const items = await InventoryItem.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { name, sku, description, unit, currentStock, lowStockThreshold, targetQuantity } = body;

    const normalizedSku = typeof sku === "string" ? sku.trim() : "";
    const hasSku = Boolean(normalizedSku);

    const duplicateQuery: Record<string, unknown>[] = [{ name }];
    if (hasSku) {
      duplicateQuery.push({ sku: normalizedSku });
    }

    const existingItem = await InventoryItem.findOne({ $or: duplicateQuery });
    if (existingItem) {
      return NextResponse.json(
        { error: "Item with this name or SKU already exists" },
        { status: 400 }
      );
    }

    const item = await InventoryItem.create({
      name,
      ...(hasSku ? { sku: normalizedSku } : {}),
      description,
      unit,
      currentStock: Math.max(0, Number(currentStock) || 0),
      lowStockThreshold: lowStockThreshold || 0,
      targetQuantity: targetQuantity || 0,
      isActive: true,
    });

    if (item.currentStock > 0) {
      await InventoryTransaction.create({
        inventoryItemId: item._id,
        inventoryItemName: item.name,
        type: "addition",
        quantity: item.currentStock,
        previousStock: 0,
        newStock: item.currentStock,
        reason: "Initial stock",
        performedBy: session.name || "Admin",
      });
    }

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
