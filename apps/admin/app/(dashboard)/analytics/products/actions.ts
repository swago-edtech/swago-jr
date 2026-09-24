'use server';

import { connectDB, Order, Product } from '@swago/database';
import { effectiveUnits, type ComboProductMeta } from '@/lib/combo-units';

export interface ProductSalesRow {
  productId: string;
  name: string;
  orders: number;
  qtySold: number;
  paidOrders: number;
  codOrders: number;
  revenue: number;
  refunds: number;
  netRevenue: number;
  rtoCount: number;
  category: string;
}

export interface CategoryRevenue {
  name: string;
  revenue: number;
}

export interface ProductAnalyticsData {
  products: ProductSalesRow[];
  categoryData: CategoryRevenue[];
  totals: {
    totalOrders: number;
    totalQty: number;
    paidOrders: number;
    codOrders: number;
    totalRevenue: number;
    totalRefunds: number;
    netRevenue: number;
  };
}

export async function getProductAnalytics(
  from: string,
  to: string,
  filters?: {
    paymentMethod?: string;
    status?: string;
  }
): Promise<ProductAnalyticsData> {
  await connectDB();

  const fromDate = new Date(`${from}T00:00:00+05:30`);
  const toDate = new Date(`${to}T23:59:59.999+05:30`);

  // Exclude non-business orders (Abandoned/Failed/Pending) from all analytics
  const EXCLUDED_STATUSES = ['Abandoned', 'Failed', 'Pending'];

  // Build query
  const query: any = {
    createdAt: { $gte: fromDate, $lte: toDate },
    status: { $nin: EXCLUDED_STATUSES },
  };

  // Apply optional filters
  if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
    query.paymentMethod = filters.paymentMethod;
  }
  if (filters?.status && filters.status !== 'all') {
    query.status = filters.status;
  }

  const orders = await Order.find(query)
    .select('items total status paymentMethod refundAmount')
    .lean();

  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  // Fetch product categories and build mapping dictionaries
  const allProducts = await Product.find()
    .select('_id name ageCategory isCombo comboUnitCount')
    .lean();
  
  // Maps true MongoDB _id to its metadata
  const productMetaMap: Record<
    string,
    { id: string; category: string; name: string } & ComboProductMeta
  > = {};
  // Maps product name to its true MongoDB _id (for healing legacy corrupted orders)
  const nameToIdMap: Record<string, string> = {};

  for (const p of allProducts as any[]) {
    const id = String(p._id);
    const pName = (p.name || '').trim();
    
    productMetaMap[id] = {
      id,
      category: p.ageCategory || 'Uncategorized',
      name: pName,
      isCombo: Boolean(p.isCombo),
      comboUnitCount: p.comboUnitCount || 1,
    };

    if (pName) {
      nameToIdMap[pName] = id;
    }
  }

  // ── Aggregate by product ──
  const productMap: Record<string, ProductSalesRow> = {};
  const catRevMap: Record<string, number> = {};

  for (const order of orders) {
    if (!order.items || !Array.isArray(order.items)) continue;

    const isConfirmed = confirmedStatuses.includes(order.status);
    const isPaid = order.paymentMethod === 'razorpay';
    const isCod = order.paymentMethod === 'cod';

    // Distribute refund proportionally across items
    const orderTotal = order.total || 0;
    const orderRefund = order.refundAmount || 0;
    const refundRatio = orderTotal > 0 ? orderRefund / orderTotal : 0;

    for (const item of order.items as any[]) {
      const rawPid = item.productId?.toString() || 'unknown';
      const rawName = (item.name || `Unknown Product`).trim();
      
      // SMART GROUPING: Determine the true Product ID.
      // 1. If rawPid exists in our meta map, it's a true ID (handles renamed products securely).
      // 2. Otherwise, fall back to mapping by name (heals legacy corrupted orders with cart IDs).
      // 3. If even that fails, use rawName as a fallback string.
      let truePid = rawName;
      if (productMetaMap[rawPid]) {
        truePid = rawPid;
      } else if (nameToIdMap[rawName]) {
        truePid = nameToIdMap[rawName];
      }

      const qty = effectiveUnits(
        item.quantity || 1,
        productMetaMap[truePid] || null
      );
      const itemRevenue = (item.price || 0) * (item.quantity || 1);
      const itemRefund = itemRevenue * refundRatio;

      if (!productMap[truePid]) {
        const meta = productMetaMap[truePid];
        
        productMap[truePid] = {
          productId: truePid,
          name: meta ? meta.name : rawName, // Always use latest DB name if available
          orders: 0,
          qtySold: 0,
          paidOrders: 0,
          codOrders: 0,
          revenue: 0,
          refunds: 0,
          netRevenue: 0,
          rtoCount: 0,
          category: meta ? meta.category : 'Uncategorized',
        };
      }

      const p = productMap[truePid];
      p.orders++;
      p.qtySold += qty;
      
      if (order.status === 'RTO') {
        p.rtoCount++;
      }

      if (isPaid) p.paidOrders++;
      if (isCod) p.codOrders++;

      if (isConfirmed) {
        p.revenue += itemRevenue;
        p.refunds += itemRefund;
        p.netRevenue += itemRevenue - itemRefund;
        
        const cat = p.category;
        catRevMap[cat] = (catRevMap[cat] || 0) + itemRevenue;
      }
    }
  }

  // ── Sort by qty sold descending ──
  const products = Object.values(productMap).sort((a, b) => b.qtySold - a.qtySold);
  
  const categoryData = Object.entries(catRevMap)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── Totals ──
  const totals = products.reduce(
    (acc, p) => ({
      totalOrders: acc.totalOrders + p.orders,
      totalQty: acc.totalQty + p.qtySold,
      paidOrders: acc.paidOrders + p.paidOrders,
      codOrders: acc.codOrders + p.codOrders,
      totalRevenue: acc.totalRevenue + p.revenue,
      totalRefunds: acc.totalRefunds + p.refunds,
      netRevenue: acc.netRevenue + p.netRevenue,
    }),
    { totalOrders: 0, totalQty: 0, paidOrders: 0, codOrders: 0, totalRevenue: 0, totalRefunds: 0, netRevenue: 0 }
  );

  return JSON.parse(JSON.stringify({ products, categoryData, totals }));
}

export async function getSingleProductAnalytics(
  productId: string,
  productName: string,
  from: string,
  to: string
): Promise<any> {
  await connectDB();

  const fromDate = new Date(`${from}T00:00:00+05:30`);
  const toDate = new Date(`${to}T23:59:59.999+05:30`);

  // Exclude non-business orders (Abandoned/Failed/Pending) from all analytics
  const EXCLUDED_STATUSES = ['Abandoned', 'Failed', 'Pending'];

  const query: any = {
    createdAt: { $gte: fromDate, $lte: toDate },
    status: { $nin: EXCLUDED_STATUSES },
  };

  const orders = await Order.find(query)
    .select('createdAt items total status paymentMethod refundAmount')
    .lean();

  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  const comboMeta = await Product.findById(productId)
    .select('isCombo comboUnitCount')
    .lean() as ComboProductMeta | null;
  
  const result = {
    totals: { qtySold: 0, revenue: 0, netRevenue: 0, rtoCount: 0, refunds: 0, totalOrders: 0 },
    dailyMap: {} as Record<string, { qty: number; revenue: number }>,
    breakdown: {
      codOrders: 0,
      paidOrders: 0,
      status: {} as Record<string, number>
    }
  };

  for (const order of orders) {
    if (!order.items || !Array.isArray(order.items)) continue;

    const orderTotal = order.total || 0;
    const orderRefund = order.refundAmount || 0;
    const refundRatio = orderTotal > 0 ? orderRefund / orderTotal : 0;
    
    let hasProduct = false;
    let qtyInOrder = 0;
    let revInOrder = 0;

    for (const item of order.items as any[]) {
      const rawPid = item.productId?.toString() || '';
      const rawName = (item.name || '').trim();
      
      // Match by exact ID or exact Name (to heal legacy orders)
      if (rawPid === productId || rawName === productName || rawName === productId) {
        hasProduct = true;
        const lineQty = item.quantity || 1;
        const qty = effectiveUnits(lineQty, comboMeta);
        const itemRevenue = (item.price || 0) * lineQty;
        qtyInOrder += qty;
        revInOrder += itemRevenue;
      }
    }

    if (hasProduct) {
      result.totals.totalOrders++;
      
      const dateObj = order.createdAt as Date;
      let dateStr = '';
      if (dateObj && typeof dateObj.toISOString === 'function') {
        dateStr = dateObj.toISOString().split('T')[0];
      } else if (dateObj && typeof dateObj === 'string') {
        dateStr = (dateObj as string).split('T')[0];
      } else {
        continue;
      }

      if (!result.dailyMap[dateStr]) result.dailyMap[dateStr] = { qty: 0, revenue: 0 };
      
      if (order.status === 'RTO') {
        result.totals.rtoCount++;
      }

      const isPaid = order.paymentMethod === 'razorpay';
      const isCod = order.paymentMethod === 'cod';
      if (isPaid) result.breakdown.paidOrders++;
      if (isCod) result.breakdown.codOrders++;

      result.breakdown.status[order.status] = (result.breakdown.status[order.status] || 0) + 1;

      const isConfirmed = confirmedStatuses.includes(order.status);
      if (isConfirmed) {
        const itemRefund = revInOrder * refundRatio;
        result.totals.revenue += revInOrder;
        result.totals.refunds += itemRefund;
        result.totals.netRevenue += (revInOrder - itemRefund);
        
        result.dailyMap[dateStr].qty += qtyInOrder;
        result.dailyMap[dateStr].revenue += (revInOrder - itemRefund);
        result.totals.qtySold += qtyInOrder;
      }
    }
  }

  const daily = [];
  let curr = new Date(fromDate);
  while (curr <= toDate) {
    const dStr = curr.toISOString().split('T')[0];
    daily.push({
      date: dStr,
      qty: result.dailyMap[dStr]?.qty || 0,
      revenue: result.dailyMap[dStr]?.revenue || 0
    });
    curr.setDate(curr.getDate() + 1);
  }

  return JSON.parse(JSON.stringify({ 
    totals: result.totals, 
    daily, 
    breakdown: result.breakdown 
  }));
}
