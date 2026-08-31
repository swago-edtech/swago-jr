import { NextResponse } from "next/server";
import { connectDB } from "@swago/database";
import { ProductConfig, InventoryItem } from "@swago/database";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Ensure models are registered (Mongoose sometimes drops them in HMR)
    if (!ProductConfig || !InventoryItem) {
      throw new Error("Models not loaded");
    }

    const config = await ProductConfig.findOne({ productId: id }).populate({
      path: "components.inventoryItemId",
      model: InventoryItem,
    });

    if (!config || !config.components || config.components.length === 0) {
      return NextResponse.json({
        configured: false,
        stock: 0,
        error: "Product is not configured with an Inventory BOM.",
      });
    }

    let maxPossible = Infinity;
    let limitingComponent = null;

    for (const comp of config.components) {
      const item = comp.inventoryItemId;
      if (!item) continue; // Item deleted?
      
      const requiredQty = comp.quantity;
      if (requiredQty <= 0) continue;

      const available = item.currentStock || 0;
      const possibleWithThis = Math.floor(available / requiredQty);

      if (possibleWithThis < maxPossible) {
        maxPossible = possibleWithThis;
        limitingComponent = item.name;
      }
    }

    if (maxPossible === Infinity) maxPossible = 0;

    return NextResponse.json({
      configured: true,
      stock: maxPossible,
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
