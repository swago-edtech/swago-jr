'use server';

import { connectDB, Product, Order, ChannelOrder, ensureChannelOrdersBackfilled } from '@swago/database';
import { effectiveUnits } from '@/lib/combo-units';
import {
  channelDateQuery,
  channelSaleDate,
  marketplaceChannelFilter,
  parseSalesChannel,
  type SalesChannel,
} from '@/lib/sales-query';

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
  channel: SalesChannel;
}

export async function getInventoryAnalytics(
  channelInput: SalesChannel = 'all'
): Promise<InventoryAnalyticsData> {
  await connectDB();

  const channel = parseSalesChannel(channelInput);
  const includeWebsite = channel === 'website' || channel === 'all';
  const includeAmazon = channel === 'amazon' || channel === 'all';
  const includeFlipkart = channel === 'flipkart' || channel === 'all';

  if (includeAmazon || includeFlipkart) {
    await ensureChannelOrdersBackfilled(2000);
  }

  const products = await Product.find()
    .select('_id name category price stock reservedStock lowStockThreshold isCombo comboUnitCount')
    .lean();

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;

  const startOfDay = new Date(`${y}-${m}-${d}T00:00:00+05:30`);
  const startOfMonth = new Date(`${y}-${m}-01T00:00:00+05:30`);
  const now = new Date();

  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  const comboById: Record<string, { isCombo?: boolean; comboUnitCount?: number }> = {};
  for (const p of products as any[]) {
    comboById[String(p._id)] = {
      isCombo: Boolean(p.isCombo),
      comboUnitCount: p.comboUnitCount || 1,
    };
  }

  const salesMap: Record<string, { today: number; month: number }> = {};

  function addSale(productId: string, qty: number, saleAt: Date) {
    const pid = String(productId);
    if (!salesMap[pid]) salesMap[pid] = { today: 0, month: 0 };
    const units = effectiveUnits(qty || 0, comboById[pid]);
    salesMap[pid].month += units;
    if (saleAt >= startOfDay) salesMap[pid].today += units;
  }

  if (includeWebsite) {
    const recentOrders = await Order.find({
      createdAt: { $gte: startOfMonth },
      status: { $in: confirmedStatuses },
    })
      .select('items createdAt')
      .lean();

    for (const order of recentOrders) {
      const saleAt = new Date(order.createdAt);
      for (const item of order.items || []) {
        addSale(String(item.productId), item.quantity || 0, saleAt);
      }
    }
  }

  async function accumulateMarketplace(marketplace: 'amazon' | 'flipkart') {
    const marketOrders = await ChannelOrder.find({
      ...marketplaceChannelFilter(marketplace),
      ...channelDateQuery(startOfMonth, now),
      status: { $ne: 'Cancelled' },
    })
      .select('items createdAt receivedAt confirmedAt channel')
      .lean();

    for (const order of marketOrders) {
      const rowChannel =
        order.channel === 'flipkart' ? 'flipkart' : marketplace === 'flipkart' ? 'flipkart' : 'amazon';
      if (rowChannel !== marketplace) continue;
      const saleAt = channelSaleDate(order);
      for (const item of order.items || []) {
        addSale(String(item.productId), item.quantity || 0, saleAt);
      }
    }
  }

  if (includeAmazon) await accumulateMarketplace('amazon');
  if (includeFlipkart) await accumulateMarketplace('flipkart');

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

  inventory.sort((a, b) => {
    const statusScore = { 'Out of Stock': 0, 'Low Stock': 1, 'In Stock': 2 };
    if (statusScore[a.status] !== statusScore[b.status]) {
      return statusScore[a.status] - statusScore[b.status];
    }
    return a.availableStock - b.availableStock;
  });

  return JSON.parse(JSON.stringify({ products: inventory, totals, channel }));
}
