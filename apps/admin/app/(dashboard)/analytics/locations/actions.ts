'use server';

import { connectDB, Order } from '@swago/database';

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
}

export async function getLocationAnalytics(from: string, to: string): Promise<LocationAnalyticsData> {
  await connectDB();

  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const orders = await Order.find({
    createdAt: { $gte: fromDate, $lte: toDate },
  })
    .select('total status paymentMethod city state')
    .lean();

  // ── City-level aggregation ──
  const cityMap: Record<string, {
    state: string;
    city: string;
    orders: number;
    revenue: number;
    codOrders: number;
    rtoOrders: number;
  }> = {};

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

  // ── Build location rows ──
  const locations: LocationRow[] = Object.values(cityMap)
    .map(c => {
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

  // ── State-level summary ──
  const stateMap: Record<string, { state: string; city: string; orders: number; revenue: number; codOrders: number; rtoOrders: number }> = {};
  for (const loc of locations) {
    const sKey = loc.state.toLowerCase();
    if (!stateMap[sKey]) {
      stateMap[sKey] = { state: loc.state, city: 'All Cities', orders: 0, revenue: 0, codOrders: 0, rtoOrders: 0 };
    }
    stateMap[sKey].orders += loc.orders;
    stateMap[sKey].revenue += loc.revenue;
    stateMap[sKey].codOrders += loc.codOrders;
    stateMap[sKey].rtoOrders += loc.rtoOrders;
  }

  const statesSummary: LocationRow[] = Object.values(stateMap)
    .map(s => {
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

  return JSON.parse(JSON.stringify({ locations, statesSummary, totals }));
}
