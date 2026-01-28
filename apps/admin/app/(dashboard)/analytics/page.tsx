import { connectDB, Order, User, Review } from '@swago/database';
import { formatPrice } from '@swago/utils';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import { TrendingUp, TrendingDown, Users, ShoppingBag, DollarSign, Star, MessageSquare, Package } from 'lucide-react';

async function getAnalyticsData() {
  await connectDB();

  // Get all data
  const [orders, users, reviews] = await Promise.all([
    Order.find().select('total status createdAt items').lean(),
    User.find({ isAdmin: false }).select('createdAt').lean(),
    Review.find().select('rating sentimentLabel status createdAt productId').lean(),
  ]);

  // Calculate revenue metrics
  const confirmedOrders = orders.filter(o => ['Paid', 'confirmed', 'delivered', 'shipped'].includes(o.status));
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingRevenue = orders.filter(o => ['Pending', 'pending'].includes(o.status)).reduce((sum, o) => sum + (o.total || 0), 0);
  const avgOrderValue = confirmedOrders.length > 0 ? totalRevenue / confirmedOrders.length : 0;

  // Get today's data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = confirmedOrders.filter(o => new Date(o.createdAt) >= today);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Get this month's data
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthOrders = confirmedOrders.filter(o => new Date(o.createdAt) >= thisMonth);
  const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Revenue by day (last 30 days)
  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 30);
  const revenueByDay = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayOrders = confirmedOrders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= dayStart && orderDate <= dayEnd;
    });
    const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    revenueByDay.push({
      date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      revenue: dayRevenue,
      orders: dayOrders.length,
    });
  }

  // Product sales count
  const productSales: Record<string, { name: string; count: number }> = {};
  confirmedOrders.forEach(order => {
    order.items?.forEach((item: any) => {
      const productId = item.productId?.toString() || 'unknown';
      if (!productSales[productId]) {
        productSales[productId] = {
          name: item.name || `Product #${productId}`,
          count: 0
        };
      }
      productSales[productId].count += (item.quantity || 1);
    });
  });

  const topProducts = Object.entries(productSales)
    .map(([id, data]) => {
      return {
        id,
        name: data.name,
        sales: data.count,
        revenue: confirmedOrders
          .filter(o => o.items?.some((i: any) => i.productId?.toString() === id))
          .reduce((sum, o) => {
            const item = o.items?.find((i: any) => i.productId?.toString() === id);
            return sum + ((item as any)?.price || 0) * ((item as any)?.quantity || 0);
          }, 0),
      };
    })
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Customer growth (last 30 days)
  const customerGrowth = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const newUsers = users.filter(u => {
      const userDate = new Date(u.createdAt);
      return userDate >= dayStart && userDate <= dayEnd;
    }).length;

    customerGrowth.push({
      date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      newUsers,
    });
  }

  // Review sentiment distribution
  const sentimentCount = {
    POSITIVE: reviews.filter(r => r.sentimentLabel === 'POSITIVE').length,
    NEUTRAL: reviews.filter(r => r.sentimentLabel === 'NEUTRAL').length,
    NEGATIVE: reviews.filter(r => r.sentimentLabel === 'NEGATIVE').length,
  };

  // Average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  // Pending reviews
  const pendingReviews = reviews.filter(r => r.status === 'pending').length;

  return {
    totalRevenue,
    pendingRevenue,
    avgOrderValue,
    todayRevenue,
    monthRevenue,
    totalOrders: confirmedOrders.length,
    pendingOrders: orders.filter(o => ['Pending', 'pending'].includes(o.status)).length,
    totalCustomers: users.length,
    totalReviews: reviews.length,
    avgRating,
    pendingReviews,
    revenueByDay: JSON.parse(JSON.stringify(revenueByDay)),
    topProducts: JSON.parse(JSON.stringify(topProducts)),
    customerGrowth: JSON.parse(JSON.stringify(customerGrowth)),
    sentimentCount,
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  const statCards = [
    {
      title: "Today's Revenue",
      value: formatPrice(data.todayRevenue),
      icon: DollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
    {
      title: "This Month",
      value: formatPrice(data.monthRevenue),
      icon: TrendingUp,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      title: "Total Customers",
      value: data.totalCustomers,
      icon: Users,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
    },
    {
      title: "Total Orders",
      value: data.totalOrders,
      icon: ShoppingBag,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
    },
    {
      title: "Avg Order Value",
      value: formatPrice(data.avgOrderValue),
      icon: TrendingUp,
      color: 'bg-pink-500',
      textColor: 'text-pink-600',
    },
    {
      title: "Pending Reviews",
      value: data.pendingReviews,
      icon: MessageSquare,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section (Client Component) */}
      <AnalyticsCharts
        revenueByDay={data.revenueByDay}
        topProducts={data.topProducts}
        customerGrowth={data.customerGrowth}
        sentimentCount={data.sentimentCount}
        avgRating={data.avgRating}
      />

      {/* Top Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Selling Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.topProducts.map((product: any, index: number) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{product.sales} units</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{formatPrice(product.revenue)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}