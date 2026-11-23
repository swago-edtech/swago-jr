'use server';

import { fetchUnifiedSales, istDayKey, SalesChannel } from '@/lib/sales-query';

export interface DaySummary {
  date: string;
  dateKey: string;
  totalOrders: number;
  paidOrders: number;
  codOrders: number;
  amazonOrders: number;
  flipkartOrders: number;
  cancelled: number;
  shipped: number;
  delivered: number;
  confirmed: number;
  rto: number;
  revenue: number;
  aov: number;
  rtoRate: number;
  cancellationRate: number;
}

export interface HourlySummary {
  hour: string;
  orders: number;
  revenue: number;
}

export interface DayOfWeekSummary {
  day: string;
  orders: number;
  revenue: number;
}

export interface OrderAnalyticsData {
  dailyData: DaySummary[];
  hourlyDistribution: HourlySummary[];
  dayOfWeekDistribution: DayOfWeekSummary[];
  totals: {
    totalOrders: number;
    confirmedOrders: number;
    paidOrders: number;
    codOrders: number;
    amazonOrders: number;
    flipkartOrders: number;
    websiteOrders: number;
    delivered: number;
    cancelled: number;
    rto: number;
    shipped: number;
    confirmed: number;
    totalRevenue: number;
    paidRevenue: number;
    codRevenue: number;
    amazonRevenue: number;
    flipkartRevenue: number;
    websiteRevenue: number;
    deliveredRevenue: number;
  };
  channel: SalesChannel;
}

function eachIstDayKey(fromDate: Date, toDate: Date): string[] {
  const keys: string[] = [];
  // Walk noon UTC equivalents of IST midnights by iterating calendar keys
  const startKey = istDayKey(fromDate);
  const endKey = istDayKey(toDate);
  // Parse YYYY-MM-DD as IST midnight
  let cursor = new Date(`${startKey}T12:00:00+05:30`);
  const end = new Date(`${endKey}T12:00:00+05:30`);
  while (cursor <= end) {
    keys.push(istDayKey(cursor));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return keys;
}

function displayDayLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00+05:30`);
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
  });
}

export async function getOrderAnalytics(
  from: string,
  to: string,
  channel: SalesChannel = 'all'
): Promise<OrderAnalyticsData> {
  const fromDate = new Date(`${from}T00:00:00+05:30`);
  const toDate = new Date(`${to}T23:59:59.999+05:30`);

  const orders = await fetchUnifiedSales(fromDate, toDate, channel);

  const dayMap: Record<string, DaySummary> = {};
  for (const dateKey of eachIstDayKey(fromDate, toDate)) {
    dayMap[dateKey] = {
      date: displayDayLabel(dateKey),
      dateKey,
      totalOrders: 0,
      paidOrders: 0,
      codOrders: 0,
      amazonOrders: 0,
      flipkartOrders: 0,
      cancelled: 0,
      shipped: 0,
      delivered: 0,
      confirmed: 0,
      rto: 0,
      revenue: 0,
      aov: 0,
      rtoRate: 0,
      cancellationRate: 0,
    };
  }

  const totals = {
    totalOrders: 0,
    confirmedOrders: 0,
    paidOrders: 0,
    codOrders: 0,
    amazonOrders: 0,
    flipkartOrders: 0,
    websiteOrders: 0,
    delivered: 0,
    cancelled: 0,
    rto: 0,
    shipped: 0,
    confirmed: 0,
    totalRevenue: 0,
    paidRevenue: 0,
    codRevenue: 0,
    amazonRevenue: 0,
    flipkartRevenue: 0,
    websiteRevenue: 0,
    deliveredRevenue: 0,
  };

  const websiteConfirmed = [
    'Paid',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Confirmed',
    'paid',
    'packed',
    'shipped',
    'out for delivery',
    'delivered',
    'confirmed',
  ];

  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    orders: 0,
    revenue: 0,
  }));

  const daysOfWeek = [
    { day: 'Sun', orders: 0, revenue: 0 },
    { day: 'Mon', orders: 0, revenue: 0 },
    { day: 'Tue', orders: 0, revenue: 0 },
    { day: 'Wed', orders: 0, revenue: 0 },
    { day: 'Thu', orders: 0, revenue: 0 },
    { day: 'Fri', orders: 0, revenue: 0 },
    { day: 'Sat', orders: 0, revenue: 0 },
  ];

  for (const order of orders) {
    // Defense: if UI asked for one channel, ignore anything else
    if (channel !== 'all' && order.channel !== channel) continue;

    const orderDate = new Date(order.createdAt);
    const dateKey = istDayKey(orderDate);
    const day = dayMap[dateKey];
    if (!day) continue;

    const total = order.total || 0;
    const isAmazon = order.channel === 'amazon';
    const isFlipkart = order.channel === 'flipkart';
    const isWebsite = order.channel === 'website';
    const isMarketplace = isAmazon || isFlipkart;
    const isPaid = order.paymentMethod === 'razorpay';
    const isCod = order.paymentMethod === 'cod';
    const statusNorm = String(order.status || '');
    const isConfirmed = isMarketplace
      ? statusNorm !== 'Cancelled'
      : websiteConfirmed.includes(statusNorm);

    day.totalOrders++;
    totals.totalOrders++;

    if (isWebsite) {
      totals.websiteOrders++;
      if (isConfirmed) totals.websiteRevenue += total;
    }
    if (isAmazon) {
      day.amazonOrders++;
      totals.amazonOrders++;
      if (isConfirmed) totals.amazonRevenue += total;
    }
    if (isFlipkart) {
      day.flipkartOrders++;
      totals.flipkartOrders++;
      if (isConfirmed) totals.flipkartRevenue += total;
    }
    if (isPaid) {
      day.paidOrders++;
      totals.paidOrders++;
      if (isConfirmed) totals.paidRevenue += total;
    }
    if (isCod) {
      day.codOrders++;
      totals.codOrders++;
      if (isConfirmed) totals.codRevenue += total;
    }

    if (isConfirmed) {
      day.revenue += total;
      totals.totalRevenue += total;
      totals.confirmedOrders++;
    }

    switch (statusNorm) {
      case 'Cancelled':
        day.cancelled++;
        totals.cancelled++;
        break;
      case 'Confirmed':
        day.confirmed++;
        totals.confirmed++;
        break;
      case 'Shipped':
      case 'Out for Delivery':
      case 'Packed':
      case 'shipped':
      case 'packed':
        day.shipped++;
        totals.shipped++;
        break;
      case 'Delivered':
      case 'delivered':
        day.delivered++;
        totals.delivered++;
        totals.deliveredRevenue += total;
        break;
      case 'RTO':
      case 'rto':
        day.rto++;
        totals.rto++;
        break;
      case 'Paid':
      case 'paid':
        day.shipped++;
        totals.shipped++;
        break;
    }

    // Hour / weekday in IST
    const istHour = Number(
      orderDate.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hour12: false,
      })
    );
    const istWeekday = new Date(
      orderDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
    ).getDay();
    const hourIdx = Number.isFinite(istHour) ? Math.min(23, Math.max(0, istHour % 24)) : 0;
    hours[hourIdx].orders++;
    daysOfWeek[istWeekday].orders++;
    if (isConfirmed) {
      hours[hourIdx].revenue += total;
      daysOfWeek[istWeekday].revenue += total;
    }
  }

  const dailyData = Object.values(dayMap).map((day) => {
    const confirmedDayOrders = Math.max(0, day.totalOrders - day.cancelled - day.rto);
    return {
      ...day,
      aov: confirmedDayOrders > 0 ? Math.round(day.revenue / confirmedDayOrders) : 0,
      rtoRate: day.totalOrders > 0 ? Number(((day.rto / day.totalOrders) * 100).toFixed(1)) : 0,
      cancellationRate:
        day.totalOrders > 0 ? Number(((day.cancelled / day.totalOrders) * 100).toFixed(1)) : 0,
    };
  });

  return JSON.parse(
    JSON.stringify({
      dailyData,
      hourlyDistribution: hours,
      dayOfWeekDistribution: daysOfWeek,
      totals,
      channel,
    })
  );
}
