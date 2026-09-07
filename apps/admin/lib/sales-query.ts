import { connectDB, Order, ChannelOrder, ensureChannelOrdersBackfilled } from "@swago/database";

export type SalesChannel = "website" | "amazon" | "all";

export type UnifiedSale = {
  total: number;
  status: string;
  paymentMethod: string;
  channel: "website" | "amazon";
  createdAt: Date;
  itemCount?: number;
};

const WEBSITE_EXCLUDED = ["Abandoned", "Failed", "Pending"];

/** Prefer marketplace email time for Amazon sales dating. */
export function amazonSaleDate(order: {
  receivedAt?: Date | string | null;
  confirmedAt?: Date | string | null;
  createdAt?: Date | string | null;
  [key: string]: unknown;
}): Date {
  const raw = order.receivedAt || order.confirmedAt || order.createdAt;
  return raw ? new Date(raw as Date | string) : new Date();
}

export function amazonDateQuery(fromDate: Date, toDate: Date) {
  return {
    $or: [
      { receivedAt: { $gte: fromDate, $lte: toDate } },
      {
        $and: [
          { $or: [{ receivedAt: null }, { receivedAt: { $exists: false } }] },
          { createdAt: { $gte: fromDate, $lte: toDate } },
        ],
      },
    ],
  };
}

export async function fetchUnifiedSales(
  fromDate: Date,
  toDate: Date,
  channel: SalesChannel = "all"
): Promise<UnifiedSale[]> {
  await connectDB();
  if (channel === "amazon" || channel === "all") {
    await ensureChannelOrdersBackfilled(2000);
  }

  const sales: UnifiedSale[] = [];

  if (channel === "website" || channel === "all") {
    const websiteOrders = await Order.find({
      createdAt: { $gte: fromDate, $lte: toDate },
      status: { $nin: WEBSITE_EXCLUDED },
    })
      .select("total status paymentMethod createdAt items")
      .lean();

    for (const order of websiteOrders) {
      sales.push({
        total: order.total || 0,
        status: order.status,
        paymentMethod: order.paymentMethod || "razorpay",
        channel: "website",
        createdAt: order.createdAt as Date,
        itemCount: (order.items || []).reduce(
          (sum: number, item: any) => sum + (item.quantity || 0),
          0
        ),
      });
    }
  }

  if (channel === "amazon" || channel === "all") {
    const amazonOrders = await ChannelOrder.find(amazonDateQuery(fromDate, toDate))
      .select("total status createdAt receivedAt confirmedAt itemCount")
      .lean();

    for (const order of amazonOrders) {
      sales.push({
        total: order.total || 0,
        // Keep Confirmed — do not inflate Delivered KPIs
        status: order.status === "Cancelled" ? "Cancelled" : "Confirmed",
        paymentMethod: "amazon",
        channel: "amazon",
        createdAt: amazonSaleDate(order),
        itemCount: order.itemCount || 0,
      });
    }
  }

  return sales;
}
