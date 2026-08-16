import { connectDB, Order, User, ContactSubmission, Product } from '@swago/database';
import { formatPrice } from '@swago/utils';
import { ShoppingBag, Users, TrendingUp, CheckCircle, AlertCircle, CreditCard, Truck, XCircle, RotateCcw, IndianRupee, PackageCheck, ArrowLeftRight, Percent, Tag, Package, BarChart3 } from 'lucide-react';
import AnalyticsCard from '@/components/AnalyticsCard';
import DashboardDateCell from './DashboardDateCell';
import Link from 'next/link';
import { cleanupExpiredOrders } from '@/lib/cleanupExpiredOrders';
import { effectiveUnits } from '@/lib/combo-units';

async function getDashboardStats() {
  await connectDB();

  // ✅ Clean up expired prepaid orders before calculating stats
  await cleanupExpiredOrders();

  const [rawOrders, users, pendingContactCount, products] = await Promise.all([
    Order.find().select('total status createdAt items paymentMethod discount shippingFee refundAmount codCollected swagoMoneyRedeemed name phone userId couponCode').lean(),
    User.countDocuments({ isAdmin: false }),
    ContactSubmission.countDocuments({ status: 'pending' }),
    Product.find().select('_id isCombo comboUnitCount').lean(),
  ]);

  const comboById: Record<string, { isCombo?: boolean; comboUnitCount?: number }> = {};
  for (const p of products as any[]) {
    comboById[String(p._id)] = {
      isCombo: Boolean(p.isCombo),
      comboUnitCount: p.comboUnitCount || 1,
    };
  }

  // Normalize order statuses (handle lowercase database variations like 'delivered')
  const normalizeStatus = (status: string) => {
    if (!status) return 'Pending';
    const s = status.toLowerCase();
    if (s === 'delivered') return 'Delivered';
    if (s === 'cancelled') return 'Cancelled';
    if (s === 'shipped') return 'Shipped';
    if (s === 'paid') return 'Paid';
    if (s === 'pending') return 'Pending';
    if (s === 'packed') return 'Packed';
    if (s === 'failed') return 'Failed';
    if (s === 'abandoned') return 'Abandoned';
    if (s === 'rto') return 'RTO';
    if (s === 'returned') return 'Returned';
    if (s === 'refunded') return 'Refunded';
    if (s === 'out for delivery') return 'Out for Delivery';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const orders = rawOrders.map((o: any) => ({ ...o, status: normalizeStatus(o.status) }))
    .filter((o: any) => !['Abandoned', 'Failed'].includes(o.status));

  // ── Time Boundaries ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Status Groups ──
  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const validSalesStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled');
  const rtoOrders = orders.filter(o => o.status === 'RTO');
  const confirmedOrders = orders.filter(o => confirmedStatuses.includes(o.status));
  // Track all non-terminal pipeline orders for the At Risk revenue slice
  const pendingOrders = orders.filter(o => ['Pending', 'Paid', 'Packed', 'Shipped', 'Out for Delivery'].includes(o.status));

  // ── Today's Orders ──
  const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
  const todayPaidOrders = todayOrders.filter(o => o.paymentMethod === 'razorpay');
  const todayCodOrders = todayOrders.filter(o => o.paymentMethod === 'cod');
  const todayValidSales = todayOrders.filter(o => validSalesStatuses.includes(o.status));

  // ── Revenue Calculations ──
  const todayRevenue = todayValidSales.reduce((sum, o) => sum + (o.total || 0), 0);
  const todayPaidRevenue = todayPaidOrders.filter(o => validSalesStatuses.includes(o.status)).reduce((sum, o) => sum + (o.total || 0), 0);
  const todayCodRevenue = todayCodOrders.filter(o => validSalesStatuses.includes(o.status)).reduce((sum, o) => sum + (o.total || 0), 0);

  const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const deliveredPrepaidRevenue = deliveredOrders.filter(o => o.paymentMethod === 'razorpay').reduce((sum, o) => sum + (o.total || 0), 0);
  const deliveredCodRevenue = deliveredOrders.filter(o => o.paymentMethod === 'cod').reduce((sum, o) => sum + (o.total || 0), 0);

  const cancelledRevenue = cancelledOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const rtoRevenueLoss = rtoOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalRefundAmount = orders.reduce((sum, o) => sum + (o.refundAmount || 0), 0);
  
  // Net revenue only subtracts refunds since RTO orders are never marked as Delivered
  const netPrepaidRevenue = deliveredPrepaidRevenue - totalRefundAmount;
  const netCodRevenue = deliveredCodRevenue;
  const netRevenue = netPrepaidRevenue + netCodRevenue;
  
  const aov = deliveredOrders.length > 0 ? deliveredRevenue / deliveredOrders.length : 0;

  // Confirmed (total actual revenue received or expected)
  const confirmedRevenue = confirmedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  
  // Total Potential Revenue defines the 100% base for the Revenue Leakage Breakdown.
  // We sum the explicit slices to prevent 'Failed'/'Abandoned' orders from inflating the denominator.
  const totalPotentialRevenue = netPrepaidRevenue + netCodRevenue + pendingRevenue + totalRefundAmount + cancelledRevenue + rtoRevenueLoss;

  // ── Performance & Customer Insights ──
  const totalCodOrders = orders.filter(o => o.paymentMethod === 'cod');
  const codRtoOrders = totalCodOrders.filter(o => o.status === 'RTO');
  const codRtoRate = totalCodOrders.length > 0 ? (codRtoOrders.length / totalCodOrders.length) * 100 : 0;

  const cancelledOrdersCount = orders.filter(o => o.status === 'Cancelled').length;
  const cancellationRate = orders.length > 0 ? (cancelledOrdersCount / orders.length) * 100 : 0;

  const totalItemsSold = orders.reduce((sum, o) => {
    const itemsCount = o.items?.reduce((acc: number, item: any) => {
      const pid = String(item.productId || '');
      return acc + effectiveUnits(item.quantity || 0, comboById[pid]);
    }, 0) || 0;
    return sum + itemsCount;
  }, 0);
  const avgItemsPerOrder = orders.length > 0 ? totalItemsSold / orders.length : 0;

  const customerOrderCounts = orders.reduce((acc, o) => {
    if (o.userId) {
      const uid = o.userId.toString();
      acc[uid] = (acc[uid] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const repeatCustomersCount = Object.values(customerOrderCounts).filter((count: any) => count > 1).length;
  const uniqueCustomersCount = Object.keys(customerOrderCounts).length;
  const repeatCustomerRate = uniqueCustomersCount > 0 ? (repeatCustomersCount / uniqueCustomersCount) * 100 : 0;

  const couponOrdersCount = orders.filter(o => o.couponCode).length;
  const couponUsageRate = orders.length > 0 ? (couponOrdersCount / orders.length) * 100 : 0;

  // ── Recent Orders ──
  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    // Today's Snapshot
    todayTotalOrders: todayOrders.length,
    todayPaidOrders: todayPaidOrders.length,
    todayCodOrders: todayCodOrders.length,
    todayRevenue,
    todayPaidRevenue,
    todayCodRevenue,
    // Lifetime Metrics
    deliveredRevenue,
    cancelledRevenue,
    rtoRevenueLoss,
    totalRefundAmount,
    netRevenue,
    netPrepaidRevenue,
    netCodRevenue,
    aov,
    // Overview
    totalOrders: orders.length,
    confirmedRevenue,
    pendingRevenue,
    totalPotentialRevenue,
    prepaidOrdersCount: orders.filter(o => o.paymentMethod === 'razorpay').length,
    codOrdersCount: orders.filter(o => o.paymentMethod === 'cod').length,
    pendingOrdersCount: pendingOrders.length,
    totalCustomers: users,
    pendingContactCount,
    // KPIs
    codRtoRate,
    cancellationRate,
    avgItemsPerOrder,
    repeatCustomerRate,
    couponUsageRate,
    couponOrdersCount,
    recentOrders: JSON.parse(JSON.stringify(recentOrders)),
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6 max-w-8xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Real-time store metrics and operations overview</p>
          </div>

        </div>
      </div>

      {/* Alert Banner for Pending Contact Queries */}
      {stats.pendingContactCount > 0 && (
        <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="text-sm text-amber-900 font-medium">
                You have {stats.pendingContactCount} unresolved {stats.pendingContactCount === 1 ? 'query' : 'queries'} waiting for response.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-lg text-amber-900 bg-amber-100 hover:bg-amber-200/80 transition-colors"
            >
              View Queries →
            </Link>
          </div>
        </div>
      )}

      {/* ── Primary KPIs Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Net Revenue */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-[3px] w-full bg-teal-500" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Revenue</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(stats.netRevenue)}</h3>
              <p className="text-xs font-semibold text-gray-500 mt-2">Delivered − Refunds − RTO Loss</p>
            </div>
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-[3px] w-full bg-blue-500" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</h3>
              <p className="text-xs text-gray-600 mt-2 font-medium">
                <span className="text-blue-600 font-bold">{stats.prepaidOrdersCount} Prepaid</span> • <span className="text-amber-600 font-bold">{stats.codOrdersCount} COD</span>
              </p>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-[3px] w-full bg-indigo-500" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Order Value</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(stats.aov)}</h3>
              <p className="text-xs font-semibold text-gray-500 mt-2">Calculated from delivered orders</p>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-[3px] w-full bg-purple-500" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Customers</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</h3>
              <p className="text-xs text-gray-600 mt-2 font-medium">
                <span className="text-purple-600 font-bold">{stats.repeatCustomerRate.toFixed(1)}%</span> repeat buyer rate
              </p>
            </div>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout Split ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Today's Activity Unified Panel */}
          <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Today&apos;s Activity</h3>
              <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-bold rounded border border-green-200/50 uppercase tracking-wider">Live</span>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              {/* Left Segment: Orders count */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Orders Summary</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-gray-900">{stats.todayTotalOrders}</span>
                  <span className="text-sm font-semibold text-gray-500">placed today</span>
                </div>
                <div className="flex gap-4 text-sm font-bold text-gray-600 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    {stats.todayPaidOrders} Prepaid
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    {stats.todayCodOrders} COD
                  </span>
                </div>
              </div>

              {/* Right Segment: Revenue count */}
              <div className="sm:pl-6 space-y-2 pt-4 sm:pt-0">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sales Breakdown</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-gray-900">{formatPrice(stats.todayRevenue)}</span>
                  <span className="text-sm font-semibold text-gray-500">total sales</span>
                </div>
                <div className="flex flex-col gap-1 text-sm font-medium text-gray-600 pt-1">
                  <div className="flex justify-between">
                    <span>Online payments:</span>
                    <span className="font-bold text-gray-950">{formatPrice(stats.todayPaidRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected Cash-on-Delivery:</span>
                    <span className="font-bold text-gray-950">{formatPrice(stats.todayCodRevenue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Recent Orders</h3>
              <Link href="/orders" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                View All Orders →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Customer</th>
                    <th className="py-3 px-5">Items</th>
                    <th className="py-3 px-5">Total</th>
                    <th className="py-3 px-5">Method</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {stats.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-500 font-bold text-base">No recent orders yet</td>
                    </tr>
                  ) : (
                    stats.recentOrders.map((order: any) => (
                      <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-gray-950">{order.name}</div>
                          <div className="text-xs font-semibold text-gray-500 mt-0.5">{order.phone}</div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="text-xs font-bold bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded">
                            {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-bold text-gray-955 text-gray-950">
                          {formatPrice(order.total || 0)}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded ${order.paymentMethod === 'cod'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                              : 'bg-blue-50 text-blue-800 border border-blue-200/60'
                            }`}>
                            {order.paymentMethod === 'cod' ? 'COD' : 'Prepaid'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`px-2 py-0.5 text-[10px] uppercase font-extrabold rounded ${order.status === 'Delivered' ? 'bg-green-50 text-green-800 border border-green-200' :
                              ['Shipped', 'Out for Delivery'].includes(order.status) ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                                ['Paid', 'Packed'].includes(order.status) ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                                  order.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                    order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                                      order.status === 'RTO' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                                        'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-xs font-semibold text-gray-500 text-right">
                          <DashboardDateCell date={order.createdAt} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Revenue Leakage Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Revenue &amp; Loss Breakdown</h3>

            {(() => {
              const totalPotential = stats.totalPotentialRevenue || 1;
              const netPrepaidPct = Math.max(0, (stats.netPrepaidRevenue / totalPotential) * 100);
              const netCodPct = Math.max(0, (stats.netCodRevenue / totalPotential) * 100);
              const cancelledPct = Math.max(0, (stats.cancelledRevenue / totalPotential) * 100);
              const rtoPct = Math.max(0, (stats.rtoRevenueLoss / totalPotential) * 100);
              const refundPct = Math.max(0, (stats.totalRefundAmount / totalPotential) * 100);
              const pendingPct = Math.max(0, (stats.pendingRevenue / totalPotential) * 100);

              return (
                <div className="space-y-4">
                  {/* Stacked Progress Bar */}
                  <div className="h-4 w-full rounded-full bg-gray-150 overflow-hidden flex">
                    <div style={{ width: `${netPrepaidPct}%` }} className="bg-blue-500 h-full" title={`Prepaid Revenue: ${netPrepaidPct.toFixed(1)}%`} />
                    <div style={{ width: `${netCodPct}%` }} className="bg-teal-500 h-full" title={`COD Revenue: ${netCodPct.toFixed(1)}%`} />
                    <div style={{ width: `${pendingPct}%` }} className="bg-yellow-400 h-full" title={`Pending Risk: ${pendingPct.toFixed(1)}%`} />
                    <div style={{ width: `${refundPct}%` }} className="bg-purple-500 h-full" title={`Refunds: ${refundPct.toFixed(1)}%`} />
                    <div style={{ width: `${cancelledPct}%` }} className="bg-orange-500 h-full" title={`Cancelled: ${cancelledPct.toFixed(1)}%`} />
                    <div style={{ width: `${rtoPct}%` }} className="bg-red-500 h-full" title={`RTO: ${rtoPct.toFixed(1)}%`} />
                  </div>

                  {/* Details & Legends */}
                  <div className="space-y-2.5 pt-2 text-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-gray-700 font-semibold">Prepaid Revenue (Delivered)</span>
                      </div>
                      <span className="font-bold text-blue-700">{formatPrice(stats.netPrepaidRevenue)} ({netPrepaidPct.toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                        <span className="text-gray-700 font-semibold">COD Revenue (Delivered)</span>
                      </div>
                      <span className="font-bold text-teal-700">{formatPrice(stats.netCodRevenue)} ({netCodPct.toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <span className="text-gray-700 font-semibold">Pending Revenue (At Risk)</span>
                      </div>
                      <span className="font-bold text-gray-800">{formatPrice(stats.pendingRevenue)} ({pendingPct.toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <span className="text-gray-700 font-semibold">Prepaid Refunds</span>
                      </div>
                      <span className="font-bold text-gray-800">-{formatPrice(stats.totalRefundAmount)} ({refundPct.toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        <span className="text-gray-700 font-semibold">Cancelled Losses</span>
                      </div>
                      <span className="font-bold text-gray-800">-{formatPrice(stats.cancelledRevenue)} ({cancelledPct.toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-gray-700 font-semibold">RTO Losses</span>
                      </div>
                      <span className="font-bold text-gray-800">-{formatPrice(stats.rtoRevenueLoss)} ({rtoPct.toFixed(1)}%)</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-sm">
                      <span className="font-bold text-gray-800 text-base">Total Potential Revenue</span>
                      <span className="font-extrabold text-gray-950 text-base">{formatPrice(stats.totalPotentialRevenue)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Operations & Customer Insights */}
          <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-5 space-y-5">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Operations &amp; Customer Health</h3>

            <div className="space-y-4">
              {/* COD RTO Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-semibold">COD Return-to-Origin (RTO)</span>
                  <span className={`font-extrabold ${stats.codRtoRate > 10 ? 'text-red-600' : 'text-teal-600'}`}>
                    {stats.codRtoRate.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, stats.codRtoRate)}%` }}
                    className={`h-full rounded-full ${stats.codRtoRate > 10 ? 'bg-red-500' : 'bg-teal-500'}`}
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Healthy benchmark: &lt; 10%</span>
                  <span>Based on COD orders only</span>
                </div>
              </div>

              {/* Repeat Customer Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-semibold">Repeat Customer Purchase Rate</span>
                  <span className="font-extrabold text-blue-600">{stats.repeatCustomerRate.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    style={{ width: `${stats.repeatCustomerRate}%` }}
                    className="h-full rounded-full bg-blue-500"
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Benchmark: &gt; 15% repeat buyers</span>
                  <span>Retention efficiency</span>
                </div>
              </div>

              {/* Coupon Usage Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-semibold">Orders Applying Coupons</span>
                  <span className="font-extrabold text-purple-600">{stats.couponUsageRate.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    style={{ width: `${stats.couponUsageRate}%` }}
                    className="h-full rounded-full bg-purple-500"
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>{stats.couponOrdersCount} total promotional orders</span>
                  <span>Campaign engagement</span>
                </div>
              </div>

              {/* Average Items per Order */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-semibold">Average Cart Density</span>
                  <span className="font-extrabold text-indigo-600">{stats.avgItemsPerOrder.toFixed(1)} items</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, (stats.avgItemsPerOrder / 5) * 100)}%` }}
                    className="h-full rounded-full bg-indigo-500"
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Target: &gt; 2.0 items/order</span>
                  <span>Cross-sell effectiveness</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
