import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  connectDB,
  Product,
  ProductConfig,
  InventoryItem,
  getConfiguredProductIds,
  applyEffectiveProductStock,
  calculateBomStock,
} from "@swago/database";

type ItemSnap = {
  name: string;
  currentStock: number;
  lowStockThreshold: number;
  targetQuantity: number;
};

function buildItemInsight(components: any[]): {
  lowStockItems: ItemSnap[];
  belowTargetItems: ItemSnap[];
  belowOptimalItems: ItemSnap[];
  limitingComponent: string | null;
  boxesPossible: number;
} {
  const lowStockItems: ItemSnap[] = [];
  const belowTargetItems: ItemSnap[] = [];
  const belowOptimalItems: ItemSnap[] = [];

  for (const comp of components || []) {
    const item = comp.inventoryItemId;
    if (!item || typeof item !== "object") continue;

    const snap: ItemSnap = {
      name: item.name || comp.inventoryItemName || "Item",
      currentStock: Number(item.currentStock) || 0,
      lowStockThreshold: Number(item.lowStockThreshold) || 0,
      targetQuantity: Number(item.targetQuantity) || 0,
    };

    if (snap.currentStock <= snap.lowStockThreshold) {
      lowStockItems.push(snap);
    }
    if (snap.targetQuantity > 0 && snap.currentStock < snap.targetQuantity) {
      belowTargetItems.push(snap);
    }
    // Not yet optimal: above low threshold but still under target (planning restock)
    if (
      snap.targetQuantity > 0 &&
      snap.currentStock > snap.lowStockThreshold &&
      snap.currentStock < snap.targetQuantity
    ) {
      belowOptimalItems.push(snap);
    }
  }

  const { stock, limitingComponent } = calculateBomStock(components || []);
  return {
    lowStockItems,
    belowTargetItems,
    belowOptimalItems,
    limitingComponent,
    boxesPossible: stock,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const products = await Product.find({ isActive: true })
      .select("name price images stock lowStockThreshold")
      .sort({ name: 1 })
      .lean();

    const configs = await ProductConfig.find()
      .populate({
        path: "components.inventoryItemId",
        model: InventoryItem,
        select: "name currentStock lowStockThreshold targetQuantity isActive",
      })
      .lean();

    const configMap = new Map(
      configs.map((config: any) => [config.productId.toString(), config])
    );

    const configuredIds = await getConfiguredProductIds();

    const staleUnconfiguredIds = products
      .filter((p: any) => !configuredIds.has(p._id.toString()) && (p.stock ?? 0) > 0)
      .map((p: any) => p._id);

    if (staleUnconfiguredIds.length > 0) {
      await Product.updateMany({ _id: { $in: staleUnconfiguredIds } }, { stock: 0 });
    }

    const productsWithConfig = products.map((product: any) => {
      const hasConfig = configuredIds.has(product._id.toString());
      const config = configMap.get(product._id.toString());
      const effective = applyEffectiveProductStock(product, configuredIds);
      const insight = hasConfig
        ? buildItemInsight(config?.components || [])
        : {
            lowStockItems: [],
            belowTargetItems: [],
            belowOptimalItems: [],
            limitingComponent: null,
            boxesPossible: 0,
          };

      const lowThreshold = Number(product.lowStockThreshold) || 0;
      const boxes = insight.boxesPossible;
      let productHealth: "out" | "low" | "ok" = "ok";
      if (boxes <= 0) productHealth = "out";
      else if (boxes <= lowThreshold) productHealth = "low";

      return {
        ...effective,
        hasConfig,
        componentCount: config?.components?.length ?? 0,
        boxesPossible: boxes,
        limitingComponent: insight.limitingComponent,
        lowStockItems: insight.lowStockItems,
        belowTargetItems: insight.belowTargetItems,
        belowOptimalItems: insight.belowOptimalItems,
        productHealth,
        lowStockThreshold: lowThreshold,
      };
    });

    return NextResponse.json({ success: true, products: productsWithConfig });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
