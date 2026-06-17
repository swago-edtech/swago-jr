'use server';

import { connectDB, Order } from '@swago/database';

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
}

export async function getRevenueAnalytics(from: string, to: string): Promise<RevenueBreakdown> {
  await connectDB();

  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const orders = await Order.find({
    createdAt: { $gte: fromDate, $lte: toDate },
  })
    .select('total subtotal discount shippingFee status paymentMethod refundAmount codCollected swagoMoneyRedeemed taxCollected')
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
        if (isPaid) paidRevenue += total;
        break;
      case 'Cancelled':
        cancelledRevenue += total;
        break;
      case 'RTO':
        rtoLoss += total;
        break;
    }
  }

  const netRevenue = deliveredRevenue - refunds - rtoLoss;

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
  }));
}
