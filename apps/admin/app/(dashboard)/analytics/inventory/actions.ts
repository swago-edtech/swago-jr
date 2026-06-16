'use server';

import { connectDB, Product, Order } from '@swago/database';

export interface InventoryRow {
  productId: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stockValue: number;
  soldToday: number;
  soldThisMonth: number;
}

export interface InventoryAnalyticsData {
  products: InventoryRow[];
  totals: {
    totalProducts: number;
    totalStockValue: number;
    outOfStockCount: number;
    lowStockCount: number;
    inStockCount: number;
    totalAvailableItems: number;
  };
}

export async function getInventoryAnalytics(): Promise<InventoryAnalyticsData> {
  await connectDB();

  const products = await Product.find()
    .select('_id name category price stock reservedStock lowStockThreshold')
    .lean();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  const recentOrders = await Order.find({
    createdAt: { $gte: startOfMonth },
    status: { $in: confirmedStatuses },
  }).select('items createdAt').lean();

  const salesMap: Record<string, { today: number, month: number }> = {};
  
  for (const order of recentOrders) {
    const isToday = new Date(order.createdAt) >= startOfDay;
    for (const item of order.items || []) {
      const pid = String(item.productId);
      if (!salesMap[pid]) salesMap[pid] = { today: 0, month: 0 };
      salesMap[pid].month += item.quantity || 0;
      if (isToday) salesMap[pid].today += item.quantity || 0;
    }
  }

  const inventory: InventoryRow[] = [];
  const totals = {
    totalProducts: 0,
    totalStockValue: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    inStockCount: 0,
    totalAvailableItems: 0,
  };

  for (const p of products) {
    const stock = p.stock || 0;
    const reservedStock = p.reservedStock || 0;
    const availableStock = Math.max(0, stock - reservedStock);
    const threshold = p.lowStockThreshold || 50;
    const price = p.price || 0;
    
    let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
    if (availableStock === 0) {
      status = 'Out of Stock';
    } else if (availableStock <= threshold) {
      status = 'Low Stock';
    }

    const stockValue = availableStock * price;

    inventory.push({
      productId: String(p._id),
      name: p.name || 'Unknown',
      category: p.category || 'Uncategorized',
      price,
      stock,
      reservedStock,
      availableStock,
      lowStockThreshold: threshold,
      status,
      stockValue,
      soldToday: salesMap[String(p._id)]?.today || 0,
      soldThisMonth: salesMap[String(p._id)]?.month || 0,
    });

    totals.totalProducts++;
    totals.totalAvailableItems += availableStock;
    totals.totalStockValue += stockValue;

    if (status === 'Out of Stock') totals.outOfStockCount++;
    else if (status === 'Low Stock') totals.lowStockCount++;
    else totals.inStockCount++;
  }

  // Sort by status (Out of Stock first, then Low Stock), then by available stock asc
  inventory.sort((a, b) => {
    const statusScore = { 'Out of Stock': 0, 'Low Stock': 1, 'In Stock': 2 };
    if (statusScore[a.status] !== statusScore[b.status]) {
      return statusScore[a.status] - statusScore[b.status];
    }
    return a.availableStock - b.availableStock;
  });

  return JSON.parse(JSON.stringify({ products: inventory, totals }));
}
