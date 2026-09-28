'use server';

import { connectDB, Order } from '@swago/database';

export interface DailyRevenue {
  date: string;
  gross: number;
  net: number;
}

export interface RevenueBreakdown {
  grossRevenue: number;
  paidRevenue: number;
  codRevenuePlaced: number;
  codRevenueCollected: number;
  pendingCod: number;
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
}

export async function getRevenueAnalytics(from: string, to: string): Promise<RevenueBreakdown> {
  await connectDB();

  const fromDate = new Date(`${from}T00:00:00+05:30`);
  const toDate = new Date(`${to}T23:59:59.999+05:30`);

  // Exclude non-business orders (Abandoned/Failed/Pending) from all analytics
  const EXCLUDED_STATUSES = ['Abandoned', 'Failed', 'Pending'];

  const orders = await Order.find({
    createdAt: { $gte: fromDate, $lte: toDate },
    status: { $nin: EXCLUDED_STATUSES },
  })
    .select('total subtotal discount shippingFee internationalShippingFee status paymentMethod refundAmount codCollected swagoMoneyRedeemed taxCollected createdAt')
    .lean();

  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  let grossRevenue = 0;
  let paidRevenue = 0;
  let codRevenuePlaced = 0;
  let codRevenueCollected = 0;
  let pendingCod = 0;
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
    dayMap[key] = { date: key, gross: 0, net: 0 };
    current.setDate(current.getDate() + 1);
  }

  for (const order of orders) {
    const total = order.total || 0;
    const isConfirmed = confirmedStatuses.includes(order.status);
    const isPaid = order.paymentMethod === 'razorpay';
    const isCod = order.paymentMethod === 'cod';

    // Gross = all order value (before cancellations/refunds)
    grossRevenue += total;
    discountsGiven += order.discount || 0;
    swagoMoneyRedeemed += order.swagoMoneyRedeemed || 0;
    refunds += order.refundAmount || 0;

    if (isConfirmed || order.status === 'Delivered') {
      shippingCollected += order.shippingFee || 0;
      // International orders keep their (INR ledger) shipping in internationalShippingFee; 0 for India
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
        // Note: paidRevenue for delivered prepaid is already counted in the
        // confirmedStatuses block above (Delivered is in confirmedStatuses).
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
      if (order.status === 'Delivered') {
        day.net += total;
      }
      if (order.refundAmount) {
        day.net -= order.refundAmount;
      }
    }
  }

  const netRevenue = deliveredRevenue - refunds - rtoLoss;
  const dailyTrends = Object.values(dayMap);

  return JSON.parse(JSON.stringify({
    grossRevenue,
    paidRevenue,
    codRevenuePlaced,
    codRevenueCollected,
    pendingCod,
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
  }));
}
