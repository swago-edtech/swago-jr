'use server';

import { connectDB, Order } from '@swago/database';

export interface PaymentMethodRow {
  method: string;
  label: string;
  orders: number;
  revenue: number;
  delivered: number;
  cancelled: number;
  rto: number;
  successRate: number;
  aov: number;
}

export interface PaymentDailyTrend {
  date: string;
  razorpayOrders: number;
  codOrders: number;
}

export interface CodFunnelData {
  placed: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  collected: number;
  rto: number;
  loss: number;
}

export interface PaymentAnalyticsData {
  methods: PaymentMethodRow[];
  codFunnel: CodFunnelData;
  dailyTrends: PaymentDailyTrend[];
  totals: {
    totalOrders: number;
    totalRevenue: number;
  };
}

export async function getPaymentAnalytics(from: string, to: string): Promise<PaymentAnalyticsData> {
  await connectDB();

  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const orders = await Order.find({
    createdAt: { $gte: fromDate, $lte: toDate },
  })
    .select('total status paymentMethod codCollected')
    .lean();

  // ── Payment method aggregation ──
  const methodMap: Record<string, { orders: number; revenue: number; delivered: number; cancelled: number; rto: number }> = {
    razorpay: { orders: 0, revenue: 0, delivered: 0, cancelled: 0, rto: 0 },
    cod: { orders: 0, revenue: 0, delivered: 0, cancelled: 0, rto: 0 },
  };

  // ── COD funnel ──
  const codFunnel: CodFunnelData = {
    placed: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    collected: 0,
    rto: 0,
    loss: 0,
  };

  const dayMap: Record<string, PaymentDailyTrend> = {};
  
  const current = new Date(fromDate);
  while (current <= toDate) {
    const key = current.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    dayMap[key] = { date: key, razorpayOrders: 0, codOrders: 0 };
    current.setDate(current.getDate() + 1);
  }

  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  for (const order of orders) {
    const method = order.paymentMethod || 'razorpay';
    const total = order.total || 0;

    if (!methodMap[method]) {
      methodMap[method] = { orders: 0, revenue: 0, delivered: 0, cancelled: 0, rto: 0 };
    }

    const m = methodMap[method];
    m.orders++;

    if (confirmedStatuses.includes(order.status)) {
      m.revenue += total;
    }

    switch (order.status) {
      case 'Delivered':
        m.delivered++;
        m.revenue += total;
        break;
      case 'Cancelled':
        m.cancelled++;
        break;
      case 'RTO':
        m.rto++;
        break;
    }

    // ── COD funnel tracking ──
    if (method === 'cod') {
      codFunnel.placed++;

      if (['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'].includes(order.status)) {
        codFunnel.confirmed++;
      }
      if (['Shipped', 'Out for Delivery', 'Delivered'].includes(order.status)) {
        codFunnel.shipped++;
      }
      if (order.status === 'Delivered') {
        codFunnel.delivered++;
        if (order.codCollected) {
          codFunnel.collected++;
        }
      }
      if (order.status === 'RTO') {
        codFunnel.rto++;
        codFunnel.loss += total;
      }
    }

    const orderDate = new Date(order.createdAt);
    const dayKey = orderDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    if (dayMap[dayKey]) {
      if (method === 'cod') {
        dayMap[dayKey].codOrders++;
      } else {
        dayMap[dayKey].razorpayOrders++;
      }
    }
  }

  // ── Build output ──
  const methods: PaymentMethodRow[] = Object.entries(methodMap).map(([method, data]) => {
    const deliveredPlusCancelled = data.delivered + data.cancelled + data.rto;
    const successRate = deliveredPlusCancelled > 0
      ? Math.round((data.delivered / deliveredPlusCancelled) * 100)
      : 0;

    return {
      method,
      label: method === 'cod' ? 'Cash on Delivery' : 'Razorpay (UPI/Card)',
      orders: data.orders,
      revenue: data.revenue,
      delivered: data.delivered,
      cancelled: data.cancelled,
      rto: data.rto,
      successRate,
      aov: data.orders > 0 ? Math.round(data.revenue / data.orders) : 0,
    };
  });

  const dailyTrends = Object.values(dayMap);

  const totals = {
    totalOrders: orders.length,
    totalRevenue: methods.reduce((sum, m) => sum + m.revenue, 0),
  };

  return JSON.parse(JSON.stringify({ methods, codFunnel, dailyTrends, totals }));
}
