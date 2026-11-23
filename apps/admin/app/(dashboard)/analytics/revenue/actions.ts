'use server';

import { connectDB, Order, ChannelOrder, ensureChannelOrdersBackfilled } from '@swago/database';
import {
  channelDateQuery,
  marketplaceChannelFilter,
  type SalesChannel,
} from '@/lib/sales-query';

export interface DailyRevenue {
  date: string;
  gross: number;
  net: number;
  website?: number;
  amazon?: number;
  flipkart?: number;
}

export interface RevenueBreakdown {
  grossRevenue: number;
  paidRevenue: number;
  codRevenuePlaced: number;
  codRevenueCollected: number;
  pendingCod: number;
  amazonRevenue: number;
  flipkartRevenue: number;
  refunds: number;
  discountsGiven: number;
  shippingCollected: number;
  swagoMoneyRedeemed: number;
  gstCollected: number;
  netRevenue: number;
  /** Website Delivered only — marketplace Confirmed is tracked separately */
  deliveredRevenue: number;
  /** Non-cancelled marketplace catalog estimate (Confirmed, not physical delivery) */
  channelConfirmedRevenue: number;
  cancelledRevenue: number;
  rtoLoss: number;
  dailyTrends: DailyRevenue[];
  channel: SalesChannel;
}

export async function getRevenueAnalytics(
  from: string,
  to: string,
  channel: SalesChannel = 'all'
): Promise<RevenueBreakdown> {
  await connectDB();

  const fromDate = new Date(`${from}T00:00:00+05:30`);
  const toDate = new Date(`${to}T23:59:59.999+05:30`);

  if (channel === 'amazon' || channel === 'flipkart' || channel === 'all') {
    await ensureChannelOrdersBackfilled(2000);
  }

  const EXCLUDED_STATUSES = ['Abandoned', 'Failed', 'Pending'];
  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  let grossRevenue = 0;
  let paidRevenue = 0;
  let codRevenuePlaced = 0;
  let codRevenueCollected = 0;
  let pendingCod = 0;
  let amazonRevenue = 0;
  let flipkartRevenue = 0;
  let refunds = 0;
  let discountsGiven = 0;
  let shippingCollected = 0;
  let swagoMoneyRedeemed = 0;
  let deliveredRevenue = 0;
  let channelConfirmedRevenue = 0;
  let cancelledRevenue = 0;
  let rtoLoss = 0;
  let gstCollected = 0;

  const dayMap: Record<string, DailyRevenue> = {};

  const current = new Date(fromDate);
  while (current <= toDate) {
    const key = current.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    dayMap[key] = { date: key, gross: 0, net: 0, website: 0, amazon: 0, flipkart: 0 };
    current.setDate(current.getDate() + 1);
  }

  if (channel === 'website' || channel === 'all') {
    const orders = await Order.find({
      createdAt: { $gte: fromDate, $lte: toDate },
      status: { $nin: EXCLUDED_STATUSES },
    })
      .select(
        'total subtotal discount shippingFee internationalShippingFee status paymentMethod refundAmount codCollected swagoMoneyRedeemed taxCollected createdAt'
      )
      .lean();

    for (const order of orders) {
      const total = order.total || 0;
      const isConfirmed = confirmedStatuses.includes(order.status);
      const isPaid = order.paymentMethod === 'razorpay';
      const isCod = order.paymentMethod === 'cod';

      grossRevenue += total;
      discountsGiven += order.discount || 0;
      swagoMoneyRedeemed += order.swagoMoneyRedeemed || 0;
      refunds += order.refundAmount || 0;

      if (isConfirmed || order.status === 'Delivered') {
        shippingCollected += order.shippingFee || 0;
        shippingCollected += order.internationalShippingFee || 0;
        gstCollected += order.taxCollected || 0;
      }

      if (isPaid && isConfirmed) {
        paidRevenue += total;
      }

      if (isCod) {
        if (isConfirmed || order.status === 'Delivered') {
          codRevenuePlaced += total;

          if (order.codCollected) {
            codRevenueCollected += total;
          } else if (order.status !== 'Delivered') {
            pendingCod += total;
          }
        }

        if (order.status === 'Delivered' && !order.codCollected) {
          pendingCod += total;
        }
      }

      switch (order.status) {
        case 'Delivered':
          deliveredRevenue += total;
          break;
        case 'Cancelled':
          cancelledRevenue += total;
          break;
        case 'RTO':
          rtoLoss += total;
          break;
      }

      const orderDate = new Date(order.createdAt);
      const dayKey = orderDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      const day = dayMap[dayKey];
      if (day) {
        day.gross += total;
        day.website = (day.website || 0) + total;
        if (order.status === 'Delivered') {
          day.net += total;
        }
        if (order.refundAmount) {
          day.net -= order.refundAmount;
        }
      }
    }
  }

  async function accumulateMarketplace(marketplace: 'amazon' | 'flipkart') {
    const marketOrders = await ChannelOrder.find({
      ...marketplaceChannelFilter(marketplace),
      ...channelDateQuery(fromDate, toDate),
    })
      .select('total status createdAt receivedAt confirmedAt channel')
      .lean();

    for (const order of marketOrders) {
      const rowChannel =
        order.channel === 'flipkart' ? 'flipkart' : marketplace === 'flipkart' ? 'flipkart' : 'amazon';
      if (rowChannel !== marketplace) continue;

      const total = order.total || 0;
      grossRevenue += total;

      if (order.status === 'Cancelled') {
        cancelledRevenue += total;
      } else {
        channelConfirmedRevenue += total;
        if (marketplace === 'amazon') amazonRevenue += total;
        else flipkartRevenue += total;
      }

      const orderDate = new Date(
        (order.receivedAt || order.confirmedAt || order.createdAt) as Date
      );
      const dayKey = orderDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      const day = dayMap[dayKey];
      if (day) {
        day.gross += total;
        if (marketplace === 'amazon') day.amazon = (day.amazon || 0) + total;
        else day.flipkart = (day.flipkart || 0) + total;
        if (order.status !== 'Cancelled') {
          day.net += total;
        }
      }
    }
  }

  if (channel === 'amazon' || channel === 'all') {
    await accumulateMarketplace('amazon');
  }
  if (channel === 'flipkart' || channel === 'all') {
    await accumulateMarketplace('flipkart');
  }

  // Net = website delivered + marketplace confirmed − refunds − RTO
  const netRevenue = deliveredRevenue + channelConfirmedRevenue - refunds - rtoLoss;
  const dailyTrends = Object.values(dayMap);

  return JSON.parse(
    JSON.stringify({
      grossRevenue,
      paidRevenue,
      codRevenuePlaced,
      codRevenueCollected,
      pendingCod,
      amazonRevenue,
      flipkartRevenue,
      refunds,
      discountsGiven,
      shippingCollected,
      swagoMoneyRedeemed,
      netRevenue,
      deliveredRevenue,
      channelConfirmedRevenue,
      cancelledRevenue,
      rtoLoss,
      gstCollected,
      dailyTrends,
      channel,
    })
  );
}
