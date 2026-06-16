'use client';

import {
  BarChart,
  Bar,
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

interface DaySummary {
  date: string;
  totalOrders: number;
  paidOrders: number;
  codOrders: number;
  cancelled: number;
  shipped: number;
  delivered: number;
  rto: number;
  revenue: number;
}

interface OrderAnalyticsChartsProps {
  dailyData: DaySummary[];
  totals: {
    totalOrders: number;
    paidOrders: number;
    codOrders: number;
    delivered: number;
    cancelled: number;
    rto: number;
    shipped: number;
  };
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  },
  labelStyle: {
    color: '#111827',
    fontWeight: 600,
    marginBottom: '0.25rem',
  },
  itemStyle: {
    color: '#374151',
    fontWeight: 500,
    fontSize: '13px',
  },
};

const STATUS_COLORS = {
  delivered: '#10b981',
  cancelled: '#ef4444',
  rto: '#f43f5e',
  shipped: '#8b5cf6',
  pending: '#f59e0b',
};

const PAYMENT_COLORS = {
  paid: '#3b82f6',
  cod: '#f59e0b',
};

export default function OrderAnalyticsCharts({ dailyData, totals }: OrderAnalyticsChartsProps) {
  // ── Paid vs COD Pie Data ──
  const paymentSplitData = [
    { name: 'Prepaid', value: totals.paidOrders, color: PAYMENT_COLORS.paid },
    { name: 'COD', value: totals.codOrders, color: PAYMENT_COLORS.cod },
  ].filter(d => d.value > 0);

  // ── Status Distribution Pie Data ──
  const statusData = [
    { name: 'Delivered', value: totals.delivered, color: STATUS_COLORS.delivered },
    { name: 'Cancelled', value: totals.cancelled, color: STATUS_COLORS.cancelled },
    { name: 'RTO', value: totals.rto, color: STATUS_COLORS.rto },
    { name: 'Shipped', value: totals.shipped, color: STATUS_COLORS.shipped },
  ].filter(d => d.value > 0);

  // ── Monthly aggregation (for month-wise chart) ──
  const monthlyData: Record<string, { month: string; orders: number; revenue: number }> = {};
  dailyData.forEach(day => {
    // Parse the date string to get month key
    const dateParts = day.date.split(' '); // e.g. "Jun 15" or "15 Jun"
    const monthKey = dateParts.find(p => isNaN(Number(p))) || day.date;
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthKey, orders: 0, revenue: 0 };
    }
    monthlyData[monthKey].orders += day.totalOrders;
    monthlyData[monthKey].revenue += day.revenue;
  });
  const monthlyArray = Object.values(monthlyData);
  const showMonthly = dailyData.length > 30;

  // ── Custom Revenue Formatter ──
  const formatRevenue = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Day-wise Orders Bar Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Day-wise Orders</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              interval={Math.max(0, Math.floor(dailyData.length / 8) - 1)}
            />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle.contentStyle}
              labelStyle={tooltipStyle.labelStyle}
              itemStyle={tooltipStyle.itemStyle}
              formatter={(value: number | undefined, name: string | undefined) => {
                const labels: Record<string, string> = {
                  paidOrders: 'Prepaid',
                  codOrders: 'COD',
                };
                return [value ?? 0, labels[name ?? ''] || name || ''];
              }}
            />
            <Legend
              formatter={(value) => {
                const labels: Record<string, string> = {
                  paidOrders: 'Prepaid',
                  codOrders: 'COD',
                };
                return labels[value] || value;
              }}
            />
            <Bar dataKey="paidOrders" stackId="orders" fill={PAYMENT_COLORS.paid} radius={[0, 0, 0, 0]} />
            <Bar dataKey="codOrders" stackId="orders" fill={PAYMENT_COLORS.cod} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Month-wise or Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          {showMonthly ? 'Month-wise Orders' : 'Day-wise Revenue'}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          {showMonthly ? (
            <BarChart data={monthlyArray}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle.contentStyle}
                labelStyle={tooltipStyle.labelStyle}
                itemStyle={tooltipStyle.itemStyle}
              />
              <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                interval={Math.max(0, Math.floor(dailyData.length / 8) - 1)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickFormatter={formatRevenue}
              />
              <Tooltip
                contentStyle={tooltipStyle.contentStyle}
                labelStyle={tooltipStyle.labelStyle}
                itemStyle={tooltipStyle.itemStyle}
                formatter={(value: number | undefined) => [`₹${(value ?? 0).toLocaleString('en-IN')}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Paid vs COD Split */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Method Split</h3>
        {paymentSplitData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentSplitData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {paymentSplitData.map((entry, index) => (
                  <Cell key={`payment-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle.contentStyle}
                itemStyle={tooltipStyle.itemStyle}
                formatter={(value: number | undefined, name: string | undefined) => [`${value ?? 0} orders`, name ?? '']}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
            No order data for selected period
          </div>
        )}
        <div className="flex justify-center gap-6 mt-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totals.paidOrders}</div>
            <div className="text-xs text-gray-500">Prepaid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-500">{totals.codOrders}</div>
            <div className="text-xs text-gray-500">COD</div>
          </div>
        </div>
      </div>

      {/* Delivered vs Cancelled vs RTO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`status-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle.contentStyle}
                itemStyle={tooltipStyle.itemStyle}
                formatter={(value: number | undefined, name: string | undefined) => [`${value ?? 0} orders`, name ?? '']}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
            No order data for selected period
          </div>
        )}
        <div className="flex justify-center gap-4 mt-2">
          {statusData.map((item) => (
            <div key={item.name} className="text-center">
              <div className="text-xl font-bold" style={{ color: item.color }}>{item.value}</div>
              <div className="text-xs text-gray-500">{item.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
