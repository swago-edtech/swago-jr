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
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';

interface DaySummary {
  date: string;
  totalOrders: number;
  paidOrders: number;
  codOrders: number;
  amazonOrders?: number;
  cancelled: number;
  shipped: number;
  delivered: number;
  rto: number;
  revenue: number;
  aov: number;
  rtoRate: number;
  cancellationRate: number;
}

interface HourlySummary {
  hour: string;
  orders: number;
  revenue: number;
}

interface DayOfWeekSummary {
  day: string;
  orders: number;
  revenue: number;
}

interface OrderAnalyticsChartsProps {
  dailyData: DaySummary[];
  hourlyDistribution: HourlySummary[];
  dayOfWeekDistribution: DayOfWeekSummary[];
  totals: {
    totalOrders: number;
    paidOrders: number;
    codOrders: number;
    amazonOrders?: number;
    delivered: number;
    cancelled: number;
    rto: number;
    shipped: number;
    confirmed?: number;
    amazonRevenue?: number;
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
  amazon: '#f97316',
};

export default function OrderAnalyticsCharts({ dailyData, hourlyDistribution, dayOfWeekDistribution, totals }: OrderAnalyticsChartsProps) {
  // ── Channel / payment split ──
  const paymentSplitData = [
    { name: 'Prepaid', value: totals.paidOrders, color: PAYMENT_COLORS.paid },
    { name: 'COD', value: totals.codOrders, color: PAYMENT_COLORS.cod },
    { name: 'Amazon', value: totals.amazonOrders || 0, color: PAYMENT_COLORS.amazon },
  ].filter(d => d.value > 0);

  // ── Status Distribution Pie Data ──
  const statusData = [
    { name: 'Delivered', value: totals.delivered, color: STATUS_COLORS.delivered },
    { name: 'Confirmed', value: totals.confirmed || 0, color: '#f97316' },
    { name: 'Cancelled', value: totals.cancelled, color: STATUS_COLORS.cancelled },
    { name: 'RTO', value: totals.rto, color: STATUS_COLORS.rto },
    { name: 'In progress', value: totals.shipped, color: STATUS_COLORS.shipped },
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
                  amazonOrders: 'Amazon',
                };
                return [value ?? 0, labels[name ?? ''] || name || ''];
              }}
            />
            <Legend
              formatter={(value) => {
                const labels: Record<string, string> = {
                  paidOrders: 'Prepaid',
                  codOrders: 'COD',
                  amazonOrders: 'Amazon',
                };
                return labels[value] || value;
              }}
            />
            <Bar dataKey="paidOrders" stackId="orders" fill={PAYMENT_COLORS.paid} radius={[0, 0, 0, 0]} />
            <Bar dataKey="codOrders" stackId="orders" fill={PAYMENT_COLORS.cod} radius={[0, 0, 0, 0]} />
            <Bar dataKey="amazonOrders" stackId="orders" fill={PAYMENT_COLORS.amazon} radius={[4, 4, 0, 0]} />
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

      {/* Channel / payment split */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Channel & Payment Split</h3>
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
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{totals.amazonOrders || 0}</div>
            <div className="text-xs text-gray-500">Amazon</div>
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

      {/* Funnel Health (Rates) & AOV Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Funnel Health & AOV Trends</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[300px]">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">RTO & Cancellation Rates (%)</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} interval={Math.max(0, Math.floor(dailyData.length / 8) - 1)} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={tooltipStyle.contentStyle} labelStyle={tooltipStyle.labelStyle} itemStyle={tooltipStyle.itemStyle} />
                <Legend />
                <Line type="monotone" dataKey="rtoRate" name="RTO Rate (%)" stroke="#f43f5e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cancellationRate" name="Cancel Rate (%)" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[300px]">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Average Order Value (₹)</p>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorAov" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} interval={Math.max(0, Math.floor(dailyData.length / 8) - 1)} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={formatRevenue} />
                <Tooltip contentStyle={tooltipStyle.contentStyle} labelStyle={tooltipStyle.labelStyle} itemStyle={tooltipStyle.itemStyle} formatter={(value: number | undefined) => [`₹${value ?? 0}`, 'AOV']} />
                <Area type="monotone" dataKey="aov" stroke="#10b981" fillOpacity={1} fill="url(#colorAov)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Purchasing Behavior (Time & Day) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Purchasing Behavior Trends</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[300px]">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Orders by Hour of Day</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#6b7280' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle.contentStyle} labelStyle={tooltipStyle.labelStyle} itemStyle={tooltipStyle.itemStyle} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="orders" name="Orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[300px]">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Orders by Day of Week</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle.contentStyle} labelStyle={tooltipStyle.labelStyle} itemStyle={tooltipStyle.itemStyle} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="orders" name="Orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
