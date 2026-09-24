import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  connectDB,
  Product,
  ProductConfig,
  InventoryItem,
  Order,
  ChannelOrderEvent,
  getConfiguredProductIds,
  applyEffectiveProductStock,
  calculateBomStock,
} from "@swago/database";

const LOOKBACK_DAYS = 30;
const STOCK_BUFFER_DAYS = 3;
/** Soft ceiling for the card — sparse sales otherwise look like years of runway. */
const DAYS_OF_STOCK_CAP = 90;
const CONFIRMED_STATUSES = ["Paid", "Packed", "Shipped", "Out for Delivery", "Delivered"];

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

function daysOfStockLeft(boxesPossible: number, avgDailyUnits: number) {
  if (!(avgDailyUnits > 0)) {
    return {
      avgDailyUnits: 0,
      daysRaw: null as number | null,
      daysLeft: null as number | null,
      capped: false,
    };
  }
  const daysRaw = boxesPossible / avgDailyUnits;
  const uncapped = Math.max(0, Math.floor(daysRaw - STOCK_BUFFER_DAYS));
  const capped = uncapped > DAYS_OF_STOCK_CAP;
  const daysLeft = capped ? DAYS_OF_STOCK_CAP : uncapped;
  return { avgDailyUnits, daysRaw, daysLeft, capped };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const [products, configs, salesRows, channelSalesRows] = await Promise.all([
      Product.find({ isActive: true })
        .select("name price images stock lowStockThreshold")
        .sort({ name: 1 })
        .lean(),
      ProductConfig.find()
        .populate({
          path: "components.inventoryItemId",
          model: InventoryItem,
          select: "name currentStock lowStockThreshold targetQuantity isActive",
        })
        .lean(),
      Order.aggregate([
        {
          $match: {
            status: { $in: CONFIRMED_STATUSES },
            createdAt: { $gte: since },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: { $toString: "$items.productId" },
            units: { $sum: { $ifNull: ["$items.quantity", 0] } },
          },
        },
      ]),
      // Amazon / channel-email orders already applied to inventory
      ChannelOrderEvent.aggregate([
        {
          $match: {
            status: "applied",
            eventType: "order",
            $or: [{ receivedAt: { $gte: since } }, { createdAt: { $gte: since } }],
          },
        },
        { $unwind: "$matchedItems" },
        {
          $group: {
            _id: { $toString: "$matchedItems.productId" },
            units: { $sum: { $ifNull: ["$matchedItems.quantity", 0] } },
          },
        },
      ]),
    ]);

    const unitsByProduct = new Map<string, number>();
    for (const row of salesRows as { _id: string; units: number }[]) {
      if (!row?._id) continue;
      unitsByProduct.set(String(row._id), Number(row.units) || 0);
    }
    for (const row of channelSalesRows as { _id: string; units: number }[]) {
      if (!row?._id) continue;
      const id = String(row._id);
      unitsByProduct.set(id, (unitsByProduct.get(id) || 0) + (Number(row.units) || 0));
    }

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
      const id = product._id.toString();
      const hasConfig = configuredIds.has(id);
      const config = configMap.get(id);
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

      const unitsSold = unitsByProduct.get(id) || 0;
      const avgDailyUnits = unitsSold / LOOKBACK_DAYS;
      const pace = daysOfStockLeft(boxes, avgDailyUnits);

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
        avgDailyUnits: Number(pace.avgDailyUnits.toFixed(2)),
        daysOfStockRaw: pace.daysRaw === null ? null : Number(pace.daysRaw.toFixed(1)),
        daysOfStockLeft: pace.daysLeft,
        daysOfStockCapped: pace.capped,
        daysOfStockCap: DAYS_OF_STOCK_CAP,
        stockLookbackDays: LOOKBACK_DAYS,
        stockBufferDays: STOCK_BUFFER_DAYS,
      };
    });

    return NextResponse.json({ success: true, products: productsWithConfig });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
