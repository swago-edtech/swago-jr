'use server';

import { connectDB, Order } from '@swago/database';
import { parseSalesChannel, type SalesChannel } from '@/lib/sales-query';

export interface LocationRow {
  state: string;
  city: string;
  orders: number;
  revenue: number;
  codOrders: number;
  codPercent: number;
  rtoOrders: number;
  rtoPercent: number;
  isRisky: boolean; // COD% > 60 AND RTO% > 15
}

export interface LocationAnalyticsData {
  locations: LocationRow[];
  statesSummary: LocationRow[];
  totals: {
    totalOrders: number;
    totalRevenue: number;
    totalCod: number;
    totalRto: number;
  };
  /** Marketplace ChannelOrders do not store city/state */
  geoAvailable: boolean;
  channel: SalesChannel;
}

export async function getLocationAnalytics(
  from: string,
  to: string,
  channelInput: SalesChannel = 'all'
): Promise<LocationAnalyticsData> {
  await connectDB();

  const channel = parseSalesChannel(channelInput);
  const fromDate = new Date(`${from}T00:00:00+05:30`);
  const toDate = new Date(`${to}T23:59:59.999+05:30`);

  // Amazon/Flipkart have no shipping address — empty geo with flag
  if (channel === 'amazon' || channel === 'flipkart') {
    return JSON.parse(
      JSON.stringify({
        locations: [],
        statesSummary: [],
        totals: { totalOrders: 0, totalRevenue: 0, totalCod: 0, totalRto: 0 },
        geoAvailable: false,
        channel,
      })
    );
  }

  const EXCLUDED_STATUSES = ['Abandoned', 'Failed', 'Pending'];

  const orders = await Order.find({
    createdAt: { $gte: fromDate, $lte: toDate },
    status: { $nin: EXCLUDED_STATUSES },
  })
    .select('total status paymentMethod city state')
    .lean();

  const cityMap: Record<
    string,
    {
      state: string;
      city: string;
      orders: number;
      revenue: number;
      codOrders: number;
      rtoOrders: number;
    }
  > = {};

  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  for (const order of orders) {
    const city = (order.city || 'Unknown').trim();
    const state = (order.state || 'Unknown').trim();
    const key = `${city.toLowerCase()}_${state.toLowerCase()}`;
    const total = order.total || 0;

    if (!cityMap[key]) {
      cityMap[key] = { state, city, orders: 0, revenue: 0, codOrders: 0, rtoOrders: 0 };
    }

    const c = cityMap[key];
    c.orders++;

    if (confirmedStatuses.includes(order.status) || order.status === 'Delivered') {
      c.revenue += total;
    }

    if (order.paymentMethod === 'cod') {
      c.codOrders++;
    }
    if (order.status === 'RTO') {
      c.rtoOrders++;
    }
  }

  const locations: LocationRow[] = Object.values(cityMap)
    .map((c) => {
      const codPercent = c.orders > 0 ? Math.round((c.codOrders / c.orders) * 100) : 0;
      const rtoPercent = c.orders > 0 ? Math.round((c.rtoOrders / c.orders) * 100) : 0;
      return {
        ...c,
        codPercent,
        rtoPercent,
        isRisky: codPercent > 60 && rtoPercent > 15,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const stateMap: Record<
    string,
    { state: string; city: string; orders: number; revenue: number; codOrders: number; rtoOrders: number }
  > = {};
  for (const loc of locations) {
    const sKey = loc.state.toLowerCase();
    if (!stateMap[sKey]) {
      stateMap[sKey] = {
        state: loc.state,
        city: 'All Cities',
        orders: 0,
        revenue: 0,
        codOrders: 0,
        rtoOrders: 0,
      };
    }
    stateMap[sKey].orders += loc.orders;
    stateMap[sKey].revenue += loc.revenue;
    stateMap[sKey].codOrders += loc.codOrders;
    stateMap[sKey].rtoOrders += loc.rtoOrders;
  }

  const statesSummary: LocationRow[] = Object.values(stateMap)
    .map((s) => {
      const codPercent = s.orders > 0 ? Math.round((s.codOrders / s.orders) * 100) : 0;
      const rtoPercent = s.orders > 0 ? Math.round((s.rtoOrders / s.orders) * 100) : 0;
      return {
        ...s,
        codPercent,
        rtoPercent,
        isRisky: codPercent > 60 && rtoPercent > 15,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const totals = {
    totalOrders: orders.length,
    totalRevenue: locations.reduce((s, l) => s + l.revenue, 0),
    totalCod: locations.reduce((s, l) => s + l.codOrders, 0),
    totalRto: locations.reduce((s, l) => s + l.rtoOrders, 0),
  };

  return JSON.parse(
    JSON.stringify({
      locations,
      statesSummary,
      totals,
      geoAvailable: true,
      channel,
    })
  );
}
