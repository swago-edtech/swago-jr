'use server';

import { connectDB, Order, User } from '@swago/database';

export interface TopCustomer {
  userId: string;
  name: string;
  phone: string;
  email: string;
  orderCount: number;
  totalSpend: number;
  lastOrderDate: string;
  paymentPreference: string; // 'razorpay' | 'cod' | 'mixed'
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
  topCustomers: TopCustomer[];
  cityBreakdown: CityCustomerRow[];
  ageDistribution: { label: string; count: number }[];
  genderDistribution: { label: string; count: number }[];
}

export async function getCustomerAnalytics(from: string, to: string): Promise<CustomerAnalyticsData> {
  await connectDB();

  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  // Get orders in range
  const orders = await Order.find({
    createdAt: { $gte: fromDate, $lte: toDate },
    status: { $in: [...confirmedStatuses, 'Delivered'] },
  })
    .select('userId name phone email total status paymentMethod city state createdAt')
    .lean();

  // Get user demographics
  const users = await User.find({ isAdmin: false })
    .select('age gender')
    .lean();

  // ── Customer aggregation (by userId) ──
  const customerMap: Record<string, {
    userId: string;
    name: string;
    phone: string;
    email: string;
    orderCount: number;
    totalSpend: number;
    lastOrderDate: Date;
    methods: Set<string>;
  }> = {};

  const cityMap: Record<string, CityCustomerRow> = {};

  for (const order of orders) {
    const uid = order.userId?.toString() || 'unknown';
    const total = order.total || 0;

    // Customer aggregation
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

    // City aggregation
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

  // Count unique customers per city
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

  // ── Compute metrics ──
  const allCustomers = Object.values(customerMap);
  const totalCustomers = allCustomers.length;
  const newCustomers = allCustomers.filter(c => c.orderCount === 1).length;
  const repeatCustomers = allCustomers.filter(c => c.orderCount >= 2).length;
  const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

  // Top 10 customers by spend
  const topCustomers: TopCustomer[] = allCustomers
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 10)
    .map(c => ({
      userId: c.userId,
      name: c.name,
      phone: c.phone,
      email: c.email,
      orderCount: c.orderCount,
      totalSpend: c.totalSpend,
      lastOrderDate: c.lastOrderDate.toISOString(),
      paymentPreference: c.methods.size > 1 ? 'mixed' : Array.from(c.methods)[0] || 'razorpay',
    }));

  // City breakdown sorted by revenue
  const cityBreakdown = Object.values(cityMap).sort((a, b) => b.revenue - a.revenue);

  // ── Age distribution ──
  const ageBuckets: Record<string, number> = {
    '0-3': 0, '4-6': 0, '7-9': 0, '10-12': 0, '13+': 0, 'Unknown': 0,
  };
  for (const user of users) {
    const age = user.age;
    if (!age) { ageBuckets['Unknown']++; continue; }
    if (age <= 3) ageBuckets['0-3']++;
    else if (age <= 6) ageBuckets['4-6']++;
    else if (age <= 9) ageBuckets['7-9']++;
    else if (age <= 12) ageBuckets['10-12']++;
    else ageBuckets['13+']++;
  }
  const ageDistribution = Object.entries(ageBuckets)
    .map(([label, count]) => ({ label, count }))
    .filter(a => a.count > 0);

  // ── Gender distribution ──
  const genderBuckets: Record<string, number> = { boy: 0, girl: 0, other: 0, unknown: 0 };
  for (const user of users) {
    const g = user.gender || 'unknown';
    genderBuckets[g] = (genderBuckets[g] || 0) + 1;
  }
  const genderDistribution = Object.entries(genderBuckets)
    .map(([label, count]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), count }))
    .filter(g => g.count > 0);

  return JSON.parse(JSON.stringify({
    totalCustomers,
    newCustomers,
    repeatCustomers,
    repeatRate,
    topCustomers,
    cityBreakdown,
    ageDistribution,
    genderDistribution,
  }));
}
