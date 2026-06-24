'use server';

import { connectDB, Order } from '@swago/database';

export interface MarketingRow {
  source: string;
  medium: string;
  campaign: string;
  orders: number;
  revenue: number;
  aov: number;
}

export interface MarketingAnalyticsData {
  campaigns: MarketingRow[];
  totals: {
    totalOrders: number;
    totalRevenue: number;
  };
}

export async function getMarketingAnalytics(from: string, to: string): Promise<MarketingAnalyticsData> {
  await connectDB();

  const fromDate = new Date(`${from}T00:00:00+05:30`);
  const toDate = new Date(`${to}T23:59:59.999+05:30`);

  // We only track confirmed orders for marketing revenue
  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  const orders = await Order.find({
    createdAt: { $gte: fromDate, $lte: toDate },
    status: { $in: confirmedStatuses },
  })
    .select('total utm_source utm_medium utm_campaign')
    .lean();

  const campaignMap: Record<string, MarketingRow> = {};
  
  let totalOrders = 0;
  let totalRevenue = 0;

  for (const order of orders) {
    const source = order.utm_source || 'Direct/Unknown';
    const medium = order.utm_medium || '-';
    const campaign = order.utm_campaign || '-';
    const total = order.total || 0;

    const key = `${source}_${medium}_${campaign}`;

    if (!campaignMap[key]) {
      campaignMap[key] = {
        source,
        medium,
        campaign,
        orders: 0,
        revenue: 0,
        aov: 0,
      };
    }

    const c = campaignMap[key];
    c.orders++;
    c.revenue += total;

    totalOrders++;
    totalRevenue += total;
  }

  const campaigns = Object.values(campaignMap)
    .map(c => ({
      ...c,
      aov: c.orders > 0 ? Math.round(c.revenue / c.orders) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return JSON.parse(JSON.stringify({
    campaigns,
    totals: {
      totalOrders,
      totalRevenue,
    }
  }));
}
