'use server';

import { connectDB, Order, User, ChannelOrder, ensureChannelOrdersBackfilled } from '@swago/database';
import {
  channelDateQuery,
  marketplaceChannelFilter,
  parseSalesChannel,
  type SalesChannel,
} from '@/lib/sales-query';

export interface TopCustomer {
  userId: string;
  name: string;
  phone: string;
  email: string;
  orderCount: number;
  totalSpend: number;
  lastOrderDate: string;
  paymentPreference: string; // 'razorpay' | 'cod' | 'mixed' | 'amazon' | 'flipkart'
}

export interface CityCustomerRow {
  city: string;
  state: string;
  customers: number;
  orders: number;
  revenue: number;
}

export interface CustomerAnalyticsData {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  repeatRate: number;
  totalRevenue: number;
  aov: number;
  ltv: number;
  topCustomers: TopCustomer[];
  cityBreakdown: CityCustomerRow[];
  ageDistribution: { label: string; count: number }[];
  genderDistribution: { label: string; count: number }[];
  /** Marketplace has no buyer PII — KPIs are order-based */
  identityAvailable: boolean;
  marketplaceOrders: number;
  marketplaceCancelled: number;
  channel: SalesChannel;
}

export async function getCustomerAnalytics(
  from: string,
  to: string,
  channelInput: SalesChannel = 'all'
): Promise<CustomerAnalyticsData> {
  await connectDB();

  const channel = parseSalesChannel(channelInput);
  const fromDate = new Date(`${from}T00:00:00+05:30`);
  const toDate = new Date(`${to}T23:59:59.999+05:30`);

  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const includeWebsite = channel === 'website' || channel === 'all';
  const includeAmazon = channel === 'amazon' || channel === 'all';
  const includeFlipkart = channel === 'flipkart' || channel === 'all';
  const identityAvailable = includeWebsite;

  if (includeAmazon || includeFlipkart) {
    await ensureChannelOrdersBackfilled(2000);
  }

  const customerMap: Record<
    string,
    {
      userId: string;
      name: string;
      phone: string;
      email: string;
      orderCount: number;
      totalSpend: number;
      lastOrderDate: Date;
      methods: Set<string>;
    }
  > = {};
  const cityMap: Record<string, CityCustomerRow> = {};
  let marketplaceOrders = 0;
  let marketplaceCancelled = 0;
  let marketplaceRevenue = 0;

  if (includeWebsite) {
    const orders = await Order.find({
      createdAt: { $gte: fromDate, $lte: toDate },
      status: { $in: [...confirmedStatuses, 'Delivered'] },
    })
      .select('userId name phone email total status paymentMethod city state createdAt')
      .lean();

    for (const order of orders) {
      const uid = order.userId?.toString() || 'unknown';
      const total = order.total || 0;

      if (!customerMap[uid]) {
        customerMap[uid] = {
          userId: uid,
          name: order.name || 'Unknown',
          phone: order.phone || '',
          email: order.email || '',
          orderCount: 0,
          totalSpend: 0,
          lastOrderDate: new Date(order.createdAt),
          methods: new Set(),
        };
      }
      const c = customerMap[uid];
      c.orderCount++;
      c.totalSpend += total;
      c.methods.add(order.paymentMethod || 'razorpay');
      if (new Date(order.createdAt) > c.lastOrderDate) {
        c.lastOrderDate = new Date(order.createdAt);
      }

      const cityKey = `${(order.city || 'Unknown').toLowerCase()}_${(order.state || 'Unknown').toLowerCase()}`;
      if (!cityMap[cityKey]) {
        cityMap[cityKey] = {
          city: order.city || 'Unknown',
          state: order.state || 'Unknown',
          customers: 0,
          orders: 0,
          revenue: 0,
        };
      }
      cityMap[cityKey].orders++;
      cityMap[cityKey].revenue += total;
    }

    const cityCustomerSets: Record<string, Set<string>> = {};
    for (const order of orders) {
      const cityKey = `${(order.city || 'Unknown').toLowerCase()}_${(order.state || 'Unknown').toLowerCase()}`;
      const uid = order.userId?.toString() || 'unknown';
      if (!cityCustomerSets[cityKey]) cityCustomerSets[cityKey] = new Set();
      cityCustomerSets[cityKey].add(uid);
    }
    for (const [key, set] of Object.entries(cityCustomerSets)) {
      if (cityMap[key]) cityMap[key].customers = set.size;
    }
  }

  async function accumulateMarketplace(marketplace: 'amazon' | 'flipkart') {
    const marketOrders = await ChannelOrder.find({
      ...marketplaceChannelFilter(marketplace),
      ...channelDateQuery(fromDate, toDate),
    })
      .select('total status channel')
      .lean();

    for (const order of marketOrders) {
      const rowChannel =
        order.channel === 'flipkart' ? 'flipkart' : marketplace === 'flipkart' ? 'flipkart' : 'amazon';
      if (rowChannel !== marketplace) continue;
      marketplaceOrders++;
      if (order.status === 'Cancelled') {
        marketplaceCancelled++;
      } else {
        marketplaceRevenue += Number(order.total) || 0;
      }
    }
  }

  if (includeAmazon) await accumulateMarketplace('amazon');
  if (includeFlipkart) await accumulateMarketplace('flipkart');

  // Marketplace-only view: order-based KPIs (no buyer identity)
  if (!includeWebsite) {
    const confirmed = marketplaceOrders - marketplaceCancelled;
    return JSON.parse(
      JSON.stringify({
        totalCustomers: confirmed,
        newCustomers: confirmed,
        repeatCustomers: 0,
        repeatRate: 0,
        totalRevenue: marketplaceRevenue,
        aov: confirmed > 0 ? Math.round(marketplaceRevenue / confirmed) : 0,
        ltv: confirmed > 0 ? Math.round(marketplaceRevenue / confirmed) : 0,
        topCustomers: [],
        cityBreakdown: [],
        ageDistribution: [],
        genderDistribution: [],
        identityAvailable: false,
        marketplaceOrders,
        marketplaceCancelled,
        channel,
      })
    );
  }

  const users = await User.find({ isAdmin: false }).select('age gender').lean();

  const allCustomers = Object.values(customerMap);
  const totalCustomers = allCustomers.length;
  const newCustomers = allCustomers.filter((c) => c.orderCount === 1).length;
  const repeatCustomers = allCustomers.filter((c) => c.orderCount >= 2).length;
  const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

  const websiteRevenue = allCustomers.reduce((acc, c) => acc + c.totalSpend, 0);
  const totalOrderCount = allCustomers.reduce((acc, c) => acc + c.orderCount, 0);
  const totalRevenue = websiteRevenue + marketplaceRevenue;
  const aovOrders = totalOrderCount + (marketplaceOrders - marketplaceCancelled);
  const aov = aovOrders > 0 ? Math.round(totalRevenue / aovOrders) : 0;
  const ltv = totalCustomers > 0 ? Math.round(websiteRevenue / totalCustomers) : 0;

  const topCustomers: TopCustomer[] = allCustomers
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 10)
    .map((c) => ({
      userId: c.userId,
      name: c.name,
      phone: c.phone,
      email: c.email,
      orderCount: c.orderCount,
      totalSpend: c.totalSpend,
      lastOrderDate: c.lastOrderDate.toISOString(),
      paymentPreference: c.methods.size > 1 ? 'mixed' : Array.from(c.methods)[0] || 'razorpay',
    }));

  const cityBreakdown = Object.values(cityMap).sort((a, b) => b.revenue - a.revenue);

  const ageBuckets: Record<string, number> = {
    '0-3': 0,
    '4-6': 0,
    '7-9': 0,
    '10-12': 0,
    '13+': 0,
    Unknown: 0,
  };
  for (const user of users) {
    const age = user.age;
    if (!age) {
      ageBuckets.Unknown++;
      continue;
    }
    if (age <= 3) ageBuckets['0-3']++;
    else if (age <= 6) ageBuckets['4-6']++;
    else if (age <= 9) ageBuckets['7-9']++;
    else if (age <= 12) ageBuckets['10-12']++;
    else ageBuckets['13+']++;
  }
  const ageDistribution = Object.entries(ageBuckets)
    .map(([label, count]) => ({ label, count }))
    .filter((a) => a.count > 0);

  const genderBuckets: Record<string, number> = { boy: 0, girl: 0, other: 0, unknown: 0 };
  for (const user of users) {
    const g = user.gender || 'unknown';
    genderBuckets[g] = (genderBuckets[g] || 0) + 1;
  }
  const genderDistribution = Object.entries(genderBuckets)
    .map(([label, count]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      count,
    }))
    .filter((g) => g.count > 0);

  return JSON.parse(
    JSON.stringify({
      totalCustomers,
      newCustomers,
      repeatCustomers,
      repeatRate,
      totalRevenue,
      aov,
      ltv,
      topCustomers,
      cityBreakdown,
      ageDistribution,
      genderDistribution,
      identityAvailable,
      marketplaceOrders,
      marketplaceCancelled,
      channel,
    })
  );
}
