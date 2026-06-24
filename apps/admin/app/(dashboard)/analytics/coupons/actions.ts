'use server';

import { connectDB, Order } from '@swago/database';

export interface CouponRow {
  code: string;
  usageCount: number;
  grossValue: number;
  discountGiven: number;
  netRevenue: number;
  avgDiscountPercent: number;
}

export interface CouponAnalyticsData {
  coupons: CouponRow[];
  totals: {
    totalOrdersWithCoupon: number;
    totalDiscountGiven: number;
    totalRevenueFromCoupons: number;
  };
}

export async function getCouponAnalytics(from: string, to: string): Promise<CouponAnalyticsData> {
  await connectDB();

  const fromDate = new Date(`${from}T00:00:00+05:30`);
  const toDate = new Date(`${to}T23:59:59.999+05:30`);

  // Get orders that have a coupon applied
  const orders = await Order.find({
    createdAt: { $gte: fromDate, $lte: toDate },
    couponApplied: { $exists: true, $ne: '' },
  })
    .select('total subtotal discount status couponApplied')
    .lean();

  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  const couponMap: Record<string, {
    code: string;
    usageCount: number;
    grossValue: number;
    discountGiven: number;
    netRevenue: number;
  }> = {};

  let totalOrdersWithCoupon = 0;
  let totalDiscountGiven = 0;
  let totalRevenueFromCoupons = 0;

  for (const order of orders) {
    const code = (order.couponApplied || 'UNKNOWN').toUpperCase();
    
    // Only count confirmed/successful orders for revenue metrics
    if (!confirmedStatuses.includes(order.status)) continue;

    const discount = order.discount || 0;
    const net = order.total || 0;
    const gross = (order.subtotal || 0);

    if (!couponMap[code]) {
      couponMap[code] = {
        code,
        usageCount: 0,
        grossValue: 0,
        discountGiven: 0,
        netRevenue: 0,
      };
    }

    const c = couponMap[code];
    c.usageCount++;
    c.grossValue += gross;
    c.discountGiven += discount;
    c.netRevenue += net;

    totalOrdersWithCoupon++;
    totalDiscountGiven += discount;
    totalRevenueFromCoupons += net;
  }

  const coupons: CouponRow[] = Object.values(couponMap)
    .map(c => ({
      ...c,
      avgDiscountPercent: c.grossValue > 0 ? Math.round((c.discountGiven / c.grossValue) * 100) : 0,
    }))
    .sort((a, b) => b.usageCount - a.usageCount);

  return JSON.parse(JSON.stringify({
    coupons,
    totals: {
      totalOrdersWithCoupon,
      totalDiscountGiven,
      totalRevenueFromCoupons,
    }
  }));
}
