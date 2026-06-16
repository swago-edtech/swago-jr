'use server';

import { connectDB, Order } from '@swago/database';

export interface DaySummary {
  date: string;
  totalOrders: number;
  paidOrders: number;
  codOrders: number;
  cancelled: number;
  shipped: number;
  delivered: number;
  rto: number;
  revenue: number;
}

export interface OrderAnalyticsData {
  dailyData: DaySummary[];
  totals: {
    totalOrders: number;
    paidOrders: number;
    codOrders: number;
    delivered: number;
    cancelled: number;
    rto: number;
    shipped: number;
    totalRevenue: number;
    paidRevenue: number;
    codRevenue: number;
    deliveredRevenue: number;
  };
}

export async function getOrderAnalytics(from: string, to: string): Promise<OrderAnalyticsData> {
  await connectDB();

  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const orders = await Order.find({
    createdAt: { $gte: fromDate, $lte: toDate },
  })
    .select('total status paymentMethod createdAt')
    .lean();

  // ── Build day-wise map ──
  const dayMap: Record<string, DaySummary> = {};

  // Pre-fill all days in range
  const current = new Date(fromDate);
  while (current <= toDate) {
    const key = current.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    dayMap[key] = {
      date: key,
      totalOrders: 0,
      paidOrders: 0,
      codOrders: 0,
      cancelled: 0,
      shipped: 0,
      delivered: 0,
      rto: 0,
      revenue: 0,
    };
    current.setDate(current.getDate() + 1);
  }

  // ── Totals accumulators ──
  const totals = {
    totalOrders: 0,
    paidOrders: 0,
    codOrders: 0,
    delivered: 0,
    cancelled: 0,
    rto: 0,
    shipped: 0,
    totalRevenue: 0,
    paidRevenue: 0,
    codRevenue: 0,
    deliveredRevenue: 0,
  };

  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  // ── Aggregate ──
  for (const order of orders) {
    const orderDate = new Date(order.createdAt);
    const dayKey = orderDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const day = dayMap[dayKey];
    if (!day) continue;

    const total = order.total || 0;
    const isPaid = order.paymentMethod === 'razorpay';
    const isCod = order.paymentMethod === 'cod';
    const isConfirmed = confirmedStatuses.includes(order.status);

    day.totalOrders++;
    totals.totalOrders++;

    if (isPaid) {
      day.paidOrders++;
      totals.paidOrders++;
      if (isConfirmed) {
        totals.paidRevenue += total;
      }
    }
    if (isCod) {
      day.codOrders++;
      totals.codOrders++;
      if (isConfirmed) {
        totals.codRevenue += total;
      }
    }

    if (isConfirmed) {
      day.revenue += total;
      totals.totalRevenue += total;
    }

    switch (order.status) {
      case 'Cancelled':
        day.cancelled++;
        totals.cancelled++;
        break;
      case 'Shipped':
      case 'Out for Delivery':
      case 'Packed':
        day.shipped++;
        totals.shipped++;
        break;
      case 'Delivered':
        day.delivered++;
        totals.delivered++;
        totals.deliveredRevenue += total;
        break;
      case 'RTO':
        day.rto++;
        totals.rto++;
        break;
    }
  }

  const dailyData = Object.values(dayMap);

  return JSON.parse(JSON.stringify({ dailyData, totals }));
}
