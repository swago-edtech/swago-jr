'use server';

import { connectDB, Order, ChannelOrder, ensureChannelOrdersBackfilled } from '@swago/database';
import { amazonDateQuery, type SalesChannel } from '@/lib/sales-query';

export interface DailyRevenue {
  date: string;
  gross: number;
  net: number;
  website?: number;
  amazon?: number;
}

export interface RevenueBreakdown {
  grossRevenue: number;
  paidRevenue: number;
  codRevenuePlaced: number;
  codRevenueCollected: number;
  pendingCod: number;
  amazonRevenue: number;
  refunds: number;
  discountsGiven: number;
  shippingCollected: number;
  swagoMoneyRedeemed: number;
  gstCollected: number;
  netRevenue: number;
  deliveredRevenue: number;
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

  if (channel === 'amazon' || channel === 'all') {
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
  let refunds = 0;
  let discountsGiven = 0;
  let shippingCollected = 0;
  let swagoMoneyRedeemed = 0;
  let deliveredRevenue = 0;
  let cancelledRevenue = 0;
  let rtoLoss = 0;
  let gstCollected = 0;

  const dayMap: Record<string, DailyRevenue> = {};

  const current = new Date(fromDate);
  while (current <= toDate) {
    const key = current.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    dayMap[key] = { date: key, gross: 0, net: 0, website: 0, amazon: 0 };
    current.setDate(current.getDate() + 1);
  }

  if (channel === 'website' || channel === 'all') {
    const orders = await Order.find({
      createdAt: { $gte: fromDate, $lte: toDate },
      status: { $nin: EXCLUDED_STATUSES },
    })
      .select(
        'total subtotal discount shippingFee status paymentMethod refundAmount codCollected swagoMoneyRedeemed taxCollected createdAt'
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

  if (channel === 'amazon' || channel === 'all') {
    const amazonOrders = await ChannelOrder.find(amazonDateQuery(fromDate, toDate))
      .select('total status createdAt receivedAt confirmedAt')
      .lean();

    for (const order of amazonOrders) {
      const total = order.total || 0;
      grossRevenue += total;

      if (order.status === 'Cancelled') {
        cancelledRevenue += total;
      } else {
        amazonRevenue += total;
        deliveredRevenue += total;
      }

      const orderDate = new Date(
        (order.receivedAt || order.confirmedAt || order.createdAt) as Date
      );
      const dayKey = orderDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      const day = dayMap[dayKey];
      if (day) {
        day.gross += total;
        day.amazon = (day.amazon || 0) + total;
        if (order.status !== 'Cancelled') {
          day.net += total;
        }
      }
    }
  }

  const netRevenue = deliveredRevenue - refunds - rtoLoss;
  const dailyTrends = Object.values(dayMap);

  return JSON.parse(
    JSON.stringify({
      grossRevenue,
      paidRevenue,
      codRevenuePlaced,
      codRevenueCollected,
      pendingCod,
      amazonRevenue,
      refunds,
      discountsGiven,
      shippingCollected,
      swagoMoneyRedeemed,
      netRevenue,
      deliveredRevenue,
      cancelledRevenue,
      rtoLoss,
      gstCollected,
      dailyTrends,
      channel,
    })
  );
}
