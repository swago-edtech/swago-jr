'use client';

import {
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
import { DailyRevenue, RevenueBreakdown } from './actions';
import { formatPrice } from '@swago/utils';

interface RevenueAnalyticsChartsProps {
  dailyTrends: DailyRevenue[];
  data: RevenueBreakdown;
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

const LEAKAGE_COLORS = {
  cancelled: '#ef4444',
  rto: '#f43f5e',
  refunds: '#f97316',
  discounts: '#8b5cf6',
  gst: '#6366f1',
};

export default function RevenueAnalyticsCharts({ dailyTrends, data }: RevenueAnalyticsChartsProps) {
  const leakageData = [
    { name: 'RTO Loss', value: data.rtoLoss, color: LEAKAGE_COLORS.rto },
    { name: 'Cancellations', value: data.cancelledRevenue, color: LEAKAGE_COLORS.cancelled },
    { name: 'Refunds', value: data.refunds, color: LEAKAGE_COLORS.refunds },
    { name: 'Discounts', value: data.discountsGiven, color: LEAKAGE_COLORS.discounts },
    { name: 'GST Collected', value: data.gstCollected, color: LEAKAGE_COLORS.gst },
  ].filter(d => d.value > 0);

  const formatYAxis = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue Trend Area Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Gross vs Net Revenue Trend</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTrends}>
              <defs>
                <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} interval={Math.max(0, Math.floor(dailyTrends.length / 8) - 1)} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={formatYAxis} />
              <Tooltip 
                contentStyle={tooltipStyle.contentStyle} 
                labelStyle={tooltipStyle.labelStyle} 
                itemStyle={tooltipStyle.itemStyle} 
                formatter={(value: number | undefined) => [`₹${(value ?? 0).toLocaleString('en-IN')}`, '']} 
              />
              <Legend />
              <Area type="monotone" dataKey="gross" name="Gross Revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorGross)" />
              <Area type="monotone" dataKey="net" name="Net Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorNet)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Leakage Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Revenue Leakage</h3>
        {leakageData.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leakageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {leakageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={tooltipStyle.contentStyle} 
                  itemStyle={tooltipStyle.itemStyle} 
                  formatter={(value: number | undefined, name: string | undefined) => [`₹${(value ?? 0).toLocaleString('en-IN')}`, name ?? '']} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
            No leakage data for selected period
          </div>
        )}
      </div>
    </div>
  );
}
