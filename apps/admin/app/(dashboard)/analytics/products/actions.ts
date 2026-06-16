'use server';

import { connectDB, Order } from '@swago/database';

export interface ProductSalesRow {
  productId: string;
  name: string;
  orders: number;
  qtySold: number;
  paidOrders: number;
  codOrders: number;
  revenue: number;
  refunds: number;
  netRevenue: number;
}

export interface ProductAnalyticsData {
  products: ProductSalesRow[];
  totals: {
    totalOrders: number;
    totalQty: number;
    paidOrders: number;
    codOrders: number;
    totalRevenue: number;
    totalRefunds: number;
    netRevenue: number;
  };
}

export async function getProductAnalytics(
  from: string,
  to: string,
  filters?: {
    paymentMethod?: string;
    status?: string;
  }
): Promise<ProductAnalyticsData> {
  await connectDB();

  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  // Build query
  const query: any = {
    createdAt: { $gte: fromDate, $lte: toDate },
  };

  // Apply optional filters
  if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
    query.paymentMethod = filters.paymentMethod;
  }
  if (filters?.status && filters.status !== 'all') {
    query.status = filters.status;
  }

  const orders = await Order.find(query)
    .select('items total status paymentMethod refundAmount')
    .lean();

  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  // ── Aggregate by product ──
  const productMap: Record<string, ProductSalesRow> = {};

  for (const order of orders) {
    if (!order.items || !Array.isArray(order.items)) continue;

    const isConfirmed = confirmedStatuses.includes(order.status);
    const isPaid = order.paymentMethod === 'razorpay';
    const isCod = order.paymentMethod === 'cod';

    // Distribute refund proportionally across items
    const orderTotal = order.total || 0;
    const orderRefund = order.refundAmount || 0;
    const refundRatio = orderTotal > 0 ? orderRefund / orderTotal : 0;

    for (const item of order.items as any[]) {
      const pid = item.productId?.toString() || 'unknown';
      const qty = item.quantity || 1;
      const itemRevenue = (item.price || 0) * qty;
      const itemRefund = itemRevenue * refundRatio;

      if (!productMap[pid]) {
        productMap[pid] = {
          productId: pid,
          name: item.name || `Product #${pid}`,
          orders: 0,
          qtySold: 0,
          paidOrders: 0,
          codOrders: 0,
          revenue: 0,
          refunds: 0,
          netRevenue: 0,
        };
      }

      const p = productMap[pid];
      p.orders++;
      p.qtySold += qty;

      if (isPaid) p.paidOrders++;
      if (isCod) p.codOrders++;

      if (isConfirmed) {
        p.revenue += itemRevenue;
        p.refunds += itemRefund;
        p.netRevenue += itemRevenue - itemRefund;
      }
    }
  }

  // ── Sort by qty sold descending ──
  const products = Object.values(productMap).sort((a, b) => b.qtySold - a.qtySold);

  // ── Totals ──
  const totals = products.reduce(
    (acc, p) => ({
      totalOrders: acc.totalOrders + p.orders,
      totalQty: acc.totalQty + p.qtySold,
      paidOrders: acc.paidOrders + p.paidOrders,
      codOrders: acc.codOrders + p.codOrders,
      totalRevenue: acc.totalRevenue + p.revenue,
      totalRefunds: acc.totalRefunds + p.refunds,
      netRevenue: acc.netRevenue + p.netRevenue,
    }),
    { totalOrders: 0, totalQty: 0, paidOrders: 0, codOrders: 0, totalRevenue: 0, totalRefunds: 0, netRevenue: 0 }
  );

  return JSON.parse(JSON.stringify({ products, totals }));
}
