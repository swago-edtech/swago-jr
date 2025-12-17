import { connectDB, Order, User } from '@swago/database';
import { formatPrice } from '@swago/utils';
import { ShoppingBag, Users, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import DashboardDateCell from './DashboardDateCell';


async function getDashboardStats() {
  await connectDB();

  const [totalOrders, totalCustomers, orders, allOrders] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments({ isAdmin: false }),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name phone total status createdAt')
      .lean(),
    Order.find().select('total status').lean(), // Get all orders for calculations
  ]);

  // Calculate confirmed revenue (actual money received)
  const paidOrders = allOrders.filter(order => 
    ['Paid', 'confirmed', 'delivered', 'shipped'].includes(order.status)
  );
  const confirmedRevenue = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  
  // Calculate pending revenue (potential money)
  const pendingOrders = allOrders.filter(order => 
    ['Pending', 'pending'].includes(order.status)
  );
  const pendingRevenue = pendingOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  
  // Total potential revenue (all orders)
  const totalPotentialRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  
  // Average order value (based on paid orders only)
  const avgOrderValue = paidOrders.length > 0 
    ? confirmedRevenue / paidOrders.length 
    : 0;

  return {
    totalOrders,
    totalCustomers,
    confirmedRevenue,
    pendingRevenue,
    totalPotentialRevenue,
    avgOrderValue,
    paidOrdersCount: paidOrders.length,
    pendingOrdersCount: pendingOrders.length,
    recentOrders: JSON.parse(JSON.stringify(orders)),
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      subtitle: `${stats.paidOrdersCount} paid, ${stats.pendingOrdersCount} pending`,
      icon: ShoppingBag,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Confirmed Revenue',
      value: formatPrice(stats.confirmedRevenue),
      subtitle: `Pending: ${formatPrice(stats.pendingRevenue)}`,
      icon: CheckCircle,
      color: 'bg-purple-500',
    },
    {
      title: 'Avg Order Value',
      value: formatPrice(stats.avgOrderValue),
      subtitle: 'Based on paid orders',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {card.value}
                  </p>
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                  )}
                </div>
                <div className={`${card.color} p-3 rounded-lg flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900">Confirmed Revenue</span>
            <span className="text-lg font-semibold text-green-600">
              {formatPrice(stats.confirmedRevenue)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900">Pending Revenue</span>
            <span className="text-lg font-semibold text-yellow-600">
              {formatPrice(stats.pendingRevenue)}
            </span>
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-900">Total Potential</span>
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(stats.totalPotentialRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
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
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
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
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'shipped'
                            ? 'bg-purple-100 text-purple-800'
                            : order.status === 'confirmed' || order.status === 'Paid'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'pending' || order.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
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