'use server';

import { connectDB, Order, ChannelOrder, ensureChannelOrdersBackfilled } from '@swago/database';
import {
  channelDateQuery,
  channelSaleDate,
  marketplaceChannelFilter,
  parseSalesChannel,
  type SalesChannel,
} from '@/lib/sales-query';

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
  amazonOrders: number;
  flipkartOrders: number;
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
  channel: SalesChannel;
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
  });
}

export async function getPaymentAnalytics(
  from: string,
  to: string,
  channelInput: SalesChannel = 'all'
): Promise<PaymentAnalyticsData> {
  await connectDB();

  const channel = parseSalesChannel(channelInput);
  const fromDate = new Date(`${from}T00:00:00+05:30`);
  const toDate = new Date(`${to}T23:59:59.999+05:30`);

  const EXCLUDED_STATUSES = ['Abandoned', 'Failed', 'Pending'];
  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  const includeWebsite = channel === 'website' || channel === 'all';
  const includeAmazon = channel === 'amazon' || channel === 'all';
  const includeFlipkart = channel === 'flipkart' || channel === 'all';

  if (includeAmazon || includeFlipkart) {
    await ensureChannelOrdersBackfilled(2000);
  }

  const methodMap: Record<
    string,
    { orders: number; revenue: number; delivered: number; cancelled: number; rto: number }
  > = {
    razorpay: { orders: 0, revenue: 0, delivered: 0, cancelled: 0, rto: 0 },
    cod: { orders: 0, revenue: 0, delivered: 0, cancelled: 0, rto: 0 },
    amazon: { orders: 0, revenue: 0, delivered: 0, cancelled: 0, rto: 0 },
    flipkart: { orders: 0, revenue: 0, delivered: 0, cancelled: 0, rto: 0 },
  };

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
  let cursor = new Date(fromDate);
  while (cursor <= toDate) {
    const key = dayLabel(cursor);
    dayMap[key] = {
      date: key,
      razorpayOrders: 0,
      codOrders: 0,
      amazonOrders: 0,
      flipkartOrders: 0,
    };
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  let totalOrders = 0;

  if (includeWebsite) {
    const orders = await Order.find({
      createdAt: { $gte: fromDate, $lte: toDate },
      status: { $nin: EXCLUDED_STATUSES },
    })
      .select('total status paymentMethod codCollected createdAt')
      .lean();

    for (const order of orders) {
      const method = order.paymentMethod === 'cod' ? 'cod' : 'razorpay';
      const total = order.total || 0;
      totalOrders++;

      const m = methodMap[method];
      m.orders++;
      if (confirmedStatuses.includes(order.status)) {
        m.revenue += total;
      }
      switch (order.status) {
        case 'Delivered':
          m.delivered++;
          break;
        case 'Cancelled':
          m.cancelled++;
          break;
        case 'RTO':
          m.rto++;
          break;
      }

      if (method === 'cod') {
        codFunnel.placed++;
        if (confirmedStatuses.includes(order.status)) codFunnel.confirmed++;
        if (['Shipped', 'Out for Delivery', 'Delivered'].includes(order.status)) {
          codFunnel.shipped++;
        }
        if (order.status === 'Delivered') {
          codFunnel.delivered++;
          if (order.codCollected) codFunnel.collected++;
        }
        if (order.status === 'RTO') {
          codFunnel.rto++;
          codFunnel.loss += total;
        }
      }

      const dayKey = dayLabel(new Date(order.createdAt));
      if (dayMap[dayKey]) {
        if (method === 'cod') dayMap[dayKey].codOrders++;
        else dayMap[dayKey].razorpayOrders++;
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

      const total = Number(order.total) || 0;
      totalOrders++;
      const m = methodMap[marketplace];
      m.orders++;
      if (order.status === 'Cancelled') {
        m.cancelled++;
      } else {
        m.revenue += total;
        m.delivered++; // Confirmed ≈ fulfilled for marketplace success rate
      }

      const dayKey = dayLabel(channelSaleDate(order));
      if (dayMap[dayKey]) {
        if (marketplace === 'amazon') dayMap[dayKey].amazonOrders++;
        else dayMap[dayKey].flipkartOrders++;
      }
    }
  }

  if (includeAmazon) await accumulateMarketplace('amazon');
  if (includeFlipkart) await accumulateMarketplace('flipkart');

  const labels: Record<string, string> = {
    razorpay: 'Razorpay (UPI/Card)',
    cod: 'Cash on Delivery',
    amazon: 'Amazon Marketplace',
    flipkart: 'Flipkart Marketplace',
  };

  const methods: PaymentMethodRow[] = Object.entries(methodMap)
    .filter(([method, data]) => {
      if (data.orders === 0) return false;
      if (method === 'razorpay' || method === 'cod') return includeWebsite;
      if (method === 'amazon') return includeAmazon;
      if (method === 'flipkart') return includeFlipkart;
      return true;
    })
    .map(([method, data]) => {
      const finished = data.delivered + data.cancelled + data.rto;
      const successRate =
        finished > 0 ? Math.round((data.delivered / finished) * 100) : data.orders > 0 ? 100 : 0;
      return {
        method,
        label: labels[method] || method,
        orders: data.orders,
        revenue: data.revenue,
        delivered: data.delivered,
        cancelled: data.cancelled,
        rto: data.rto,
        successRate,
        aov: data.orders > 0 ? Math.round(data.revenue / data.orders) : 0,
      };
    });

  const totals = {
    totalOrders,
    totalRevenue: methods.reduce((sum, m) => sum + m.revenue, 0),
  };

  return JSON.parse(
    JSON.stringify({
      methods,
      codFunnel,
      dailyTrends: Object.values(dayMap),
      totals,
      channel,
    })
  );
}
