'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsChartsProps {
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
  topProducts: Array<{ name: string; sales: number }>;
  customerGrowth: Array<{ date: string; newUsers: number }>;
  sentimentCount: { POSITIVE: number; NEUTRAL: number; NEGATIVE: number };
  avgRating: number;
}

export default function AnalyticsCharts({
  revenueByDay,
  topProducts,
  customerGrowth,
  sentimentCount,
  avgRating,
}: AnalyticsChartsProps) {
  const COLORS = {
    POSITIVE: '#10b981',
    NEUTRAL: '#6b7280',
    NEGATIVE: '#ef4444',
  };

  const sentimentData = [
    { name: 'Positive', value: sentimentCount.POSITIVE, color: COLORS.POSITIVE },
    { name: 'Neutral', value: sentimentCount.NEUTRAL, color: COLORS.NEUTRAL },
    { name: 'Negative', value: sentimentCount.NEGATIVE, color: COLORS.NEGATIVE },
  ];

  // Custom tooltip styling
  const tooltipStyle = {
    contentStyle: {
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '0.75rem',
    },
    labelStyle: {
      color: '#111827',
      fontWeight: 600,
      marginBottom: '0.5rem',
    },
    itemStyle: {
      color: '#111827',
      fontWeight: 500,
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueByDay}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={tooltipStyle.contentStyle}
              labelStyle={tooltipStyle.labelStyle}
              itemStyle={tooltipStyle.itemStyle}
            />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Products by Sales</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topProducts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#000000', fontWeight: 500 }} 
              angle={0} 
              textAnchor="middle" 
              height={40} 
              interval={0}
              tickFormatter={(value) => value.length > 18 ? `${value.substring(0, 18)}...` : value}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={tooltipStyle.contentStyle}
              labelStyle={tooltipStyle.labelStyle}
              itemStyle={tooltipStyle.itemStyle}
            />
            <Bar dataKey="sales" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>


      {/* Customer Growth Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Growth (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={customerGrowth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={tooltipStyle.contentStyle}
              labelStyle={tooltipStyle.labelStyle}
              itemStyle={tooltipStyle.itemStyle}
            />
            <Line type="monotone" dataKey="newUsers" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sentiment Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Sentiment Distribution</h3>
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => percent && percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={tooltipStyle.contentStyle}
                itemStyle={tooltipStyle.itemStyle}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-600">Average Rating</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">
            {avgRating.toFixed(1)} <span className="text-yellow-500">★</span>
          </div>
        </div>
      </div>
    </div>
  );
}