import { connectDB, Order, ChannelOrder, ensureChannelOrdersBackfilled } from "@swago/database";

export type { SalesChannel } from "./sales-channel";
export { parseSalesChannel } from "./sales-channel";
import type { SalesChannel } from "./sales-channel";

export type UnifiedSale = {
  total: number;
  status: string;
  paymentMethod: string;
  channel: "website" | "amazon" | "flipkart";
  createdAt: Date;
  itemCount?: number;
};

const WEBSITE_EXCLUDED = ["Abandoned", "Failed", "Pending", "abandoned", "failed", "pending"];

/** Calendar day key in IST (YYYY-MM-DD) — stable across server timezones. */
export function istDayKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

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

/**
 * Marketplace sale-date window (IST day bounds passed as Date).
 * Prefer receivedAt; fall back to createdAt only when receivedAt is missing.
 */
export function channelDateQuery(fromDate: Date, toDate: Date) {
  return {
    $or: [
      { receivedAt: { $gte: fromDate, $lte: toDate } },
      {
        $and: [
          {
            $or: [
              { receivedAt: null },
              { receivedAt: { $exists: false } },
            ],
          },
          { createdAt: { $gte: fromDate, $lte: toDate } },
        ],
      },
    ],
  };
}

/** @deprecated Use channelDateQuery */
export const amazonDateQuery = channelDateQuery;

/** Mongo filter for a marketplace channel (legacy rows without channel count as amazon). */
export function marketplaceChannelFilter(marketplace: "amazon" | "flipkart") {
  if (marketplace === "flipkart") {
    return { channel: "flipkart" as const };
  }
  // Amazon email-era rows set channel:"amazon"; missing/empty = legacy Amazon only.
  // Never include flipkart rows even if channel field is wrong/missing edge cases.
  return {
    $and: [
      {
        $or: [
          { channel: "amazon" },
          { channel: { $exists: false } },
          { channel: null },
          { channel: "" },
        ],
      },
      { channel: { $ne: "flipkart" } },
    ],
  };
}

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

  // Website storefront orders only — never mix into amazon/flipkart filters
  if (channel === "website" || channel === "all") {
    const websiteOrders = await Order.find({
      createdAt: { $gte: fromDate, $lte: toDate },
      status: { $nin: WEBSITE_EXCLUDED },
    })
      .select("total status paymentMethod createdAt items")
      .lean();

    for (const order of websiteOrders) {
      const method = String(order.paymentMethod || "razorpay").toLowerCase();
      sales.push({
        total: order.total || 0,
        status: order.status,
        paymentMethod: method === "cod" ? "cod" : "razorpay",
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
      ...marketplaceChannelFilter(marketplace),
      ...channelDateQuery(fromDate, toDate),
    })
      .select("total status createdAt receivedAt confirmedAt itemCount channel")
      .lean();

    for (const order of marketOrders) {
      // Hard guard — never label a flipkart row as amazon (or vice versa)
      const rowChannel =
        order.channel === "flipkart" ? "flipkart" : marketplace === "flipkart" ? "flipkart" : "amazon";
      if (rowChannel !== marketplace) continue;

      sales.push({
        total: Number(order.total) || 0,
        status: order.status === "Cancelled" ? "Cancelled" : "Confirmed",
        paymentMethod: rowChannel,
        channel: rowChannel,
        createdAt: channelSaleDate(order),
        itemCount: order.itemCount || 0,
      });
    }
  }

  return sales;
}
