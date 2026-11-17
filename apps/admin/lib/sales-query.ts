import { connectDB, Order, ChannelOrder, ensureChannelOrdersBackfilled } from "@swago/database";

export type SalesChannel = "website" | "amazon" | "flipkart" | "all";

export type UnifiedSale = {
  total: number;
  status: string;
  paymentMethod: string;
  channel: "website" | "amazon" | "flipkart";
  createdAt: Date;
  itemCount?: number;
};

const WEBSITE_EXCLUDED = ["Abandoned", "Failed", "Pending"];

/** Prefer marketplace received/confirmed time for channel sales dating. */
export function channelSaleDate(order: {
  receivedAt?: Date | string | null;
  confirmedAt?: Date | string | null;
  createdAt?: Date | string | null;
  [key: string]: unknown;
}): Date {
  const raw = order.receivedAt || order.confirmedAt || order.createdAt;
  return raw ? new Date(raw as Date | string) : new Date();
}

/** @deprecated Use channelSaleDate */
export const amazonSaleDate = channelSaleDate;

export function channelDateQuery(fromDate: Date, toDate: Date) {
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

/** @deprecated Use channelDateQuery */
export const amazonDateQuery = channelDateQuery;

export async function fetchUnifiedSales(
  fromDate: Date,
  toDate: Date,
  channel: SalesChannel = "all"
): Promise<UnifiedSale[]> {
  await connectDB();
  if (channel === "amazon" || channel === "flipkart" || channel === "all") {
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

  const marketplaceChannels: Array<"amazon" | "flipkart"> =
    channel === "all"
      ? ["amazon", "flipkart"]
      : channel === "amazon" || channel === "flipkart"
        ? [channel]
        : [];

  for (const marketplace of marketplaceChannels) {
    const marketOrders = await ChannelOrder.find({
      channel: marketplace,
      ...channelDateQuery(fromDate, toDate),
    })
      .select("total status createdAt receivedAt confirmedAt itemCount channel")
      .lean();

    for (const order of marketOrders) {
      sales.push({
        total: order.total || 0,
        // Keep Confirmed — do not inflate Delivered KPIs
        status: order.status === "Cancelled" ? "Cancelled" : "Confirmed",
        paymentMethod: marketplace,
        channel: marketplace,
        createdAt: channelSaleDate(order),
        itemCount: order.itemCount || 0,
      });
    }
  }

  return sales;
}
