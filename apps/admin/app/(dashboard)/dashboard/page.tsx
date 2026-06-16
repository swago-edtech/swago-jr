import { connectDB, Order, User, ContactSubmission } from '@swago/database';
import { formatPrice } from '@swago/utils';
import { ShoppingBag, Users, TrendingUp, CheckCircle, AlertCircle, CreditCard, Truck, XCircle, RotateCcw, IndianRupee, PackageCheck, ArrowLeftRight } from 'lucide-react';
import AnalyticsCard from '@/components/AnalyticsCard';
import DashboardDateCell from './DashboardDateCell';
import Link from 'next/link';
import { cleanupExpiredOrders } from '@/lib/cleanupExpiredOrders';

async function getDashboardStats() {
  await connectDB();

  // ✅ Clean up expired prepaid orders before calculating stats
  await cleanupExpiredOrders();

  const [orders, users, pendingContactCount] = await Promise.all([
    Order.find().select('total status createdAt items paymentMethod discount shippingFee refundAmount codCollected swagoMoneyRedeemed name phone').lean(),
    User.countDocuments({ isAdmin: false }),
    ContactSubmission.countDocuments({ status: 'pending' }),
  ]);

  // ── Time Boundaries ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Status Groups ──
  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled');
  const rtoOrders = orders.filter(o => o.status === 'RTO');
  const confirmedOrders = orders.filter(o => confirmedStatuses.includes(o.status));
  const pendingOrders = orders.filter(o => ['Pending'].includes(o.status));

  // ── Today's Orders ──
  const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
  const todayPaidOrders = todayOrders.filter(o => o.paymentMethod === 'razorpay');
  const todayCodOrders = todayOrders.filter(o => o.paymentMethod === 'cod');
  const todayConfirmed = todayOrders.filter(o => confirmedStatuses.includes(o.status) || o.status === 'Delivered');

  // ── Revenue Calculations ──
  const todayRevenue = todayConfirmed.reduce((sum, o) => sum + (o.total || 0), 0);
  const todayPaidRevenue = todayPaidOrders.filter(o => [...confirmedStatuses, 'Delivered'].includes(o.status)).reduce((sum, o) => sum + (o.total || 0), 0);
  const todayCodRevenue = todayCodOrders.filter(o => [...confirmedStatuses, 'Delivered'].includes(o.status)).reduce((sum, o) => sum + (o.total || 0), 0);

  const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const cancelledRevenue = cancelledOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const rtoRevenueLoss = rtoOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalRefundAmount = orders.reduce((sum, o) => sum + (o.refundAmount || 0), 0);
  const netRevenue = deliveredRevenue - totalRefundAmount - rtoRevenueLoss;
  const aov = deliveredOrders.length > 0 ? deliveredRevenue / deliveredOrders.length : 0;

  // Confirmed (total actual revenue received or expected)
  const confirmedRevenue = confirmedOrders.reduce((sum, o) => sum + (o.total || 0), 0) +
    deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalPotentialRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  // ── Recent Orders ──
  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

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
    aov,
    // Overview
    totalOrders: orders.length,
    confirmedRevenue,
    pendingRevenue,
    totalPotentialRevenue,
    paidOrdersCount: orders.filter(o => [...confirmedStatuses, 'Delivered'].includes(o.status) && o.paymentMethod === 'razorpay').length,
    codOrdersCount: orders.filter(o => o.paymentMethod === 'cod').length,
    pendingOrdersCount: pendingOrders.length,
    totalCustomers: users,
    pendingContactCount,
    recentOrders: JSON.parse(JSON.stringify(recentOrders)),
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Business overview &amp; key performance metrics</p>
      </div>

      {/* Alert Banner for Pending Contact Queries */}
      {stats.pendingContactCount > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">
                  You have {stats.pendingContactCount} unresolved {stats.pendingContactCount === 1 ? 'query' : 'queries'}
                </span>{' '}
                in the Contact Us section.
              </p>
            </div>
            <div className="ml-3 flex-shrink-0">
              <Link
                href="/contact"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
              >
                View Queries →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Today's Snapshot ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Today&apos;s Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <AnalyticsCard
            title="Total Orders"
            value={stats.todayTotalOrders}
            icon={ShoppingBag}
            color="bg-blue-500"
          />
          <AnalyticsCard
            title="Paid Orders"
            value={stats.todayPaidOrders}
            icon={CreditCard}
            color="bg-green-500"
          />
          <AnalyticsCard
            title="COD Orders"
            value={stats.todayCodOrders}
            icon={Truck}
            color="bg-amber-500"
          />
          <AnalyticsCard
            title="Today's Revenue"
            value={formatPrice(stats.todayRevenue)}
            icon={IndianRupee}
            color="bg-indigo-500"
          />
          <AnalyticsCard
            title="Paid Revenue"
            value={formatPrice(stats.todayPaidRevenue)}
            subtitle="Online payments"
            icon={CheckCircle}
            color="bg-emerald-500"
            textColor="text-emerald-700"
          />
          <AnalyticsCard
            title="COD Revenue"
            value={formatPrice(stats.todayCodRevenue)}
            subtitle="Expected from COD"
            icon={ArrowLeftRight}
            color="bg-orange-500"
            textColor="text-orange-700"
          />
        </div>
      </div>

      {/* ── Lifetime Metrics ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Lifetime Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <AnalyticsCard
            title="Delivered Revenue"
            value={formatPrice(stats.deliveredRevenue)}
            subtitle={`${stats.totalOrders} total orders`}
            icon={PackageCheck}
            color="bg-green-600"
            textColor="text-green-700"
          />
          <AnalyticsCard
            title="Cancelled Revenue"
            value={formatPrice(stats.cancelledRevenue)}
            subtitle="Revenue lost"
            icon={XCircle}
            color="bg-red-500"
            textColor="text-red-600"
          />
          <AnalyticsCard
            title="RTO Loss"
            value={formatPrice(stats.rtoRevenueLoss)}
            subtitle="COD returned/rejected"
            icon={RotateCcw}
            color="bg-rose-500"
            textColor="text-rose-600"
          />
          <AnalyticsCard
            title="Refund Amount"
            value={formatPrice(stats.totalRefundAmount)}
            subtitle="Amount refunded"
            icon={ArrowLeftRight}
            color="bg-purple-500"
            textColor="text-purple-600"
          />
          <AnalyticsCard
            title="Net Revenue"
            value={formatPrice(stats.netRevenue)}
            subtitle="Delivered − refunds − RTO"
            icon={TrendingUp}
            color="bg-teal-600"
            textColor="text-teal-700"
          />
          <AnalyticsCard
            title="AOV"
            value={formatPrice(stats.aov)}
            subtitle="Avg order value (delivered)"
            icon={IndianRupee}
            color="bg-violet-500"
          />
        </div>
      </div>

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Orders"
          value={stats.totalOrders}
          subtitle={`${stats.paidOrdersCount} paid, ${stats.codOrdersCount} COD`}
          icon={ShoppingBag}
          color="bg-blue-500"
        />
        <AnalyticsCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          color="bg-green-500"
        />
        <AnalyticsCard
          title="Confirmed Revenue"
          value={formatPrice(stats.confirmedRevenue)}
          subtitle={`Pending: ${formatPrice(stats.pendingRevenue)}`}
          icon={CheckCircle}
          color="bg-purple-500"
        />
        <AnalyticsCard
          title="Pending Orders"
          value={stats.pendingOrdersCount}
          subtitle={`₹${Math.round(stats.pendingRevenue).toLocaleString('en-IN')} at risk`}
          icon={AlertCircle}
          color="bg-yellow-500"
        />
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Confirmed Revenue</span>
            <span className="text-lg font-semibold text-green-600">
              {formatPrice(stats.confirmedRevenue)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Pending Revenue</span>
            <span className="text-lg font-semibold text-yellow-600">
              {formatPrice(stats.pendingRevenue)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Delivered Revenue</span>
            <span className="text-lg font-semibold text-emerald-600">
              {formatPrice(stats.deliveredRevenue)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Cancelled + RTO Loss</span>
            <span className="text-lg font-semibold text-red-500">
              −{formatPrice(stats.cancelledRevenue + stats.rtoRevenueLoss)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Refunds</span>
            <span className="text-lg font-semibold text-purple-500">
              −{formatPrice(stats.totalRefundAmount)}
            </span>
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-900">Net Revenue</span>
            <span className="text-xl font-bold text-teal-700">
              {formatPrice(stats.netRevenue)}
            </span>
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-500">Total Potential</span>
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(stats.totalPotentialRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No orders yet
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(order.total || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.paymentMethod === 'cod'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.paymentMethod === 'cod' ? 'COD' : 'Prepaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'Delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'Shipped' || order.status === 'Out for Delivery'
                              ? 'bg-purple-100 text-purple-800'
                              : order.status === 'Paid' || order.status === 'Packed'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'Pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : order.status === 'Cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : order.status === 'RTO'
                                      ? 'bg-rose-100 text-rose-800'
                                      : order.status === 'Refunded'
                                        ? 'bg-indigo-100 text-indigo-800'
                                        : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
  );
}
