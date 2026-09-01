import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB, Product, ProductConfig, InventoryItem, syncProductStock } from "@swago/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    await requireAdmin();
    await connectDB();

    const { productId } = await params;
    const product = await Product.findById(productId);
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const config = await ProductConfig.findOne({ productId });

    return NextResponse.json({ success: true, product, config });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    await requireAdmin();
    await connectDB();

    const { productId } = await params;
    const { components } = await request.json();

    if (!Array.isArray(components)) {
      return NextResponse.json({ error: "Components must be an array" }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const inventoryItemIds = components.map((c) => c.inventoryItemId);
    const inventoryItems = await InventoryItem.find({ _id: { $in: inventoryItemIds } });
    
    if (inventoryItems.length !== new Set(inventoryItemIds).size) {
      return NextResponse.json({ error: "One or more inventory items not found" }, { status: 400 });
    }

    const inventoryItemMap = new Map(
      inventoryItems.map((item) => [item._id.toString(), item.name])
    );

    const componentsWithNames = components.map((c) => ({
      inventoryItemId: c.inventoryItemId,
      inventoryItemName: inventoryItemMap.get(c.inventoryItemId.toString()),
      quantity: c.quantity,
    }));

    const config = await ProductConfig.findOneAndUpdate(
      { productId },
      { 
        productId,
        productName: product.name,
        components: componentsWithNames 
      },
      { upsert: true, new: true, runValidators: true }
    );

    await syncProductStock(productId);

    const updatedProduct = await Product.findById(productId).select("stock").lean();

    return NextResponse.json({
      success: true,
      config,
      product: updatedProduct,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
