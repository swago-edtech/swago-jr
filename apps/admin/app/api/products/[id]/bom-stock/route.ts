import { NextResponse } from "next/server";
import { connectDB, ProductConfig, InventoryItem, calculateBomStock } from "@swago/database";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!ProductConfig || !InventoryItem) {
      throw new Error("Models not loaded");
    }

    const config = await ProductConfig.findOne({ productId: id, isActive: true }).populate({
      path: "components.inventoryItemId",
      model: InventoryItem,
    });

    if (!config?.components?.length) {
      return NextResponse.json({
        configured: false,
        stock: 0,
        error: "Product is not configured with an Inventory BOM.",
      });
    }

    const { stock, limitingComponent } = calculateBomStock(config.components);

    return NextResponse.json({
      configured: true,
      stock,
      limitingComponent,
      componentsCount: config.components.length,
    });
  } catch (error: any) {
    console.error("BOM Stock Error:", error);
    return NextResponse.json(
      { configured: false, error: error.message },
      { status: 500 }
    );
  }
}
