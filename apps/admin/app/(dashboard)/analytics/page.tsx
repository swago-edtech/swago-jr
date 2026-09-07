import { connectDB, Order, User, Review, ChannelOrder, ensureChannelOrdersBackfilled } from '@swago/database';
import { formatPrice } from '@swago/utils';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import { TrendingUp, TrendingDown, Users, ShoppingBag, DollarSign, Package, Store } from 'lucide-react';
import { amazonSaleDate } from '@/lib/sales-query';

async function getAnalyticsData() {
  await connectDB();
  await ensureChannelOrdersBackfilled(2000);

  // Get all data
  const [orders, amazonOrders, users, reviews] = await Promise.all([
    Order.find().select('total status createdAt items paymentMethod').lean(),
    ChannelOrder.find().select('total status createdAt receivedAt confirmedAt items').lean(),
    User.find({ isAdmin: false }).select('createdAt').lean(),
    Review.find().select('rating sentimentLabel status createdAt productId').lean(),
  ]);

  // ── Normalize Status First ──
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

  const normalizedOrders = orders.map((o: any) => ({ ...o, status: normalizeStatus(o.status) }));

  // Filter out non-business orders for all revenue/order calculations
  const validOrders = normalizedOrders.filter(o => !['Abandoned', 'Failed'].includes(o.status));
  
  // Confirmed statuses for revenue calculations (Pending excluded — payment not yet completed)
  const confirmedStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const confirmedWebsiteOrders = validOrders.filter(o => confirmedStatuses.includes(o.status));
  const confirmedAmazonOrders = amazonOrders.filter((o: any) => o.status !== 'Cancelled');
  const confirmedOrders = [
    ...confirmedWebsiteOrders.map((o: any) => ({ ...o, channel: 'website' as const, saleAt: o.createdAt })),
    ...confirmedAmazonOrders.map((o: any) => ({
      ...o,
      channel: 'amazon' as const,
      saleAt: amazonSaleDate(o),
      createdAt: amazonSaleDate(o),
    })),
  ];
  
  // Calculate raw totals (website + Amazon)
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingRevenue = validOrders.filter(o => o.status === 'Pending').reduce((sum, o) => sum + (o.total || 0), 0);
  const avgOrderValue = confirmedOrders.length > 0 ? totalRevenue / confirmedOrders.length : 0;

  // ── Time Boundaries ──
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  sixtyDaysAgo.setHours(0, 0, 0, 0);

  // ── Current 30 Days Stats ──
  const current30DaysOrders = confirmedOrders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
  const current30DaysRevenue = current30DaysOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const current30DaysWebsiteRevenue = current30DaysOrders
    .filter((o: any) => o.channel === 'website')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const current30DaysAmazonRevenue = current30DaysOrders
    .filter((o: any) => o.channel === 'amazon')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const current30DaysUsers = users.filter(u => new Date(u.createdAt) >= thirtyDaysAgo);

  // ── Previous 30 Days Stats ──
  const prev30DaysOrders = confirmedOrders.filter(o => {
    const d = new Date(o.createdAt);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
  });
  const prev30DaysRevenue = prev30DaysOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const prev30DaysUsers = users.filter(u => {
    const d = new Date(u.createdAt);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
  });

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  };

  const trends = {
    revenue: calculateTrend(current30DaysRevenue, prev30DaysRevenue),
    orders: calculateTrend(current30DaysOrders.length, prev30DaysOrders.length),
    customers: calculateTrend(current30DaysUsers.length, prev30DaysUsers.length)
  };

  // Get today's and month's data
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayRevenue = confirmedOrders.filter(o => new Date(o.createdAt) >= startOfToday).reduce((sum, o) => sum + (o.total || 0), 0);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthRevenue = confirmedOrders.filter(o => new Date(o.createdAt) >= thisMonth).reduce((sum, o) => sum + (o.total || 0), 0);

  // Revenue by day (last 30 days)
  const revenueByDay = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
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

  // Normalize product names to fix fragmented product IDs from testing
  const normalizeProductName = (name: string) => {
    if (!name) return 'Unknown Product';
    const lowerName = name.toLowerCase();
    if (lowerName.includes('seek rush')) return 'Seek Rush';
    if (lowerName.includes('scarf') || lowerName.includes('charades') || lowerName.includes('chardaes')) return 'Scarf Dumb Charades';
    return name;
  };

  // Product sales count
  const productSales: Record<string, { name: string; count: number, revenue: number }> = {};
  
  confirmedOrders.forEach(order => {
    order.items?.forEach((item: any) => {
      const normalizedName = normalizeProductName(item.name);
      if (!productSales[normalizedName]) {
        productSales[normalizedName] = {
          name: normalizedName,
          count: 0,
          revenue: 0,
        };
      }
      productSales[normalizedName].count += (item.quantity || 1);
      productSales[normalizedName].revenue += ((item.price || 0) * (item.quantity || 1));
    });
  });

  const topProducts = Object.values(productSales)
    .map((data, index) => ({
      id: index.toString(),
      name: data.name,
      sales: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Customer growth (last 30 days)
  const customerGrowth = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
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

  // ── Operational Metrics ──
  // Use normalizedOrders (full set) for abandonment rate — it needs total orders as denominator
  const abandonedOrders = normalizedOrders.filter(o => o.status === 'Abandoned').length;
  const rtoOrdersCount = validOrders.filter(o => o.status === 'RTO').length;
  const totalCodOrders = validOrders.filter(o => o.paymentMethod === 'cod').length;
  
  const abandonmentRate = normalizedOrders.length > 0 ? (abandonedOrders / normalizedOrders.length) * 100 : 0;
  const rtoRate = totalCodOrders > 0 ? (rtoOrdersCount / totalCodOrders) * 100 : 0;



  const amazon30Days = confirmedAmazonOrders.filter(
    (o: any) => new Date(o.createdAt) >= thirtyDaysAgo
  ).length;

  return {
    totalRevenue,
    websiteRevenue: current30DaysWebsiteRevenue,
    amazonRevenue: current30DaysAmazonRevenue,
    pendingRevenue,
    avgOrderValue,
    todayRevenue,
    monthRevenue: current30DaysRevenue,
    totalOrders: current30DaysOrders.length,
    amazonOrders30d: amazon30Days,
    websiteOrders30d: current30DaysOrders.filter((o: any) => o.channel === 'website').length,
    pendingOrders: validOrders.filter(o => o.status === 'Pending').length,
    totalCustomers: current30DaysUsers.length,
    totalReviews: reviews.length,
    avgRating,
    pendingReviews,
    trends,
    abandonmentRate,
    rtoRate,
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
      title: "30-Day Revenue",
      value: formatPrice(data.monthRevenue),
      trend: data.trends.revenue,
      icon: DollarSign,
      color: 'from-blue-500 to-indigo-600',
      subtitle: `Web ${formatPrice(data.websiteRevenue)} · Amz ${formatPrice(data.amazonRevenue)}`,
    },
    {
      title: "30-Day Orders",
      value: data.totalOrders,
      trend: data.trends.orders,
      icon: ShoppingBag,
      color: 'from-emerald-400 to-teal-500',
      subtitle: `Web ${data.websiteOrders30d} · Amz ${data.amazonOrders30d}`,
    },
    {
      title: "Amazon Orders (30d)",
      value: data.amazonOrders30d,
      trend: null,
      icon: Store,
      color: 'from-orange-400 to-amber-500',
      subtitle: formatPrice(data.amazonRevenue) + ' est. catalog value',
    },
    {
      title: "New Customers",
      value: data.totalCustomers,
      trend: data.trends.customers,
      icon: Users,
      color: 'from-purple-500 to-fuchsia-600',
    },
    {
      title: "Avg Order Value",
      value: formatPrice(data.avgOrderValue),
      trend: null,
      icon: TrendingUp,
      color: 'from-sky-400 to-cyan-500',
    },
    {
      title: "Cart Abandonment",
      value: `${data.abandonmentRate.toFixed(1)}%`,
      trend: null,
      icon: Package,
      color: 'from-pink-500 to-rose-500',
    },
    {
      title: "RTO Rate (COD)",
      value: `${data.rtoRate.toFixed(1)}%`,
      trend: null,
      icon: TrendingDown,
      color: 'from-red-500 to-rose-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Website + Amazon channel insights in one place
        </p>
      </div>

      {/* Premium Glassmorphic Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isPositive = card.trend !== null && card.trend > 0;
          const isNegative = card.trend !== null && card.trend < 0;
          
          return (
            <div 
              key={card.title} 
              className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-gray-100/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 p-6 group"
            >
              {/* Subtle top gradient border */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color} opacity-70`} />
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2 tracking-tight">
                    {card.value}
                  </p>
                  {'subtitle' in card && card.subtitle ? (
                    <p className="text-xs text-gray-400 mt-1.5">{card.subtitle}</p>
                  ) : null}
                  
                  {card.trend !== null && (
                    <div className="mt-3 flex items-center">
                      <span className={`inline-flex items-center text-sm font-semibold ${isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-gray-500'}`}>
                        {isPositive ? '▲' : isNegative ? '▼' : '−'} {Math.abs(card.trend)}%
                      </span>
                      <span className="text-xs text-gray-400 ml-2">vs previous 30 days</span>
                    </div>
                  )}
                </div>
                
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.color} shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}>
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

    </div>
  );
}