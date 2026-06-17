'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { PaymentDailyTrend, PaymentMethodRow } from './actions';
import { formatPrice } from '@swago/utils';

interface PaymentAnalyticsChartsProps {
  dailyTrends: PaymentDailyTrend[];
  methods: PaymentMethodRow[];
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

const PAYMENT_COLORS = {
  paid: '#3b82f6',
  cod: '#f59e0b',
};

export default function PaymentAnalyticsCharts({ dailyTrends, methods }: PaymentAnalyticsChartsProps) {
  const formatYAxis = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return `${value}`;
  };

  const formatPriceYAxis = (value: number) => {
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Payment Method Trend Line Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Method Trend</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} interval={Math.max(0, Math.floor(dailyTrends.length / 8) - 1)} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={formatYAxis} />
              <Tooltip 
                contentStyle={tooltipStyle.contentStyle} 
                labelStyle={tooltipStyle.labelStyle} 
                itemStyle={tooltipStyle.itemStyle} 
              />
              <Legend />
              <Line type="monotone" dataKey="razorpayOrders" name="Prepaid Orders" stroke={PAYMENT_COLORS.paid} strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="codOrders" name="COD Orders" stroke={PAYMENT_COLORS.cod} strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AOV Comparison Bar Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Average Order Value (Prepaid vs COD)</h3>
        {methods.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={methods}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={formatPriceYAxis} />
                <Tooltip 
                  contentStyle={tooltipStyle.contentStyle} 
                  labelStyle={tooltipStyle.labelStyle} 
                  itemStyle={tooltipStyle.itemStyle} 
                  cursor={{ fill: '#f3f4f6' }}
                  formatter={(value: number | undefined) => [`₹${(value ?? 0).toLocaleString('en-IN')}`, 'AOV']}
                />
                <Bar dataKey="aov" name="Average Order Value" radius={[4, 4, 0, 0]}>
                  {methods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.method === 'cod' ? PAYMENT_COLORS.cod : PAYMENT_COLORS.paid} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
            No payment data available
          </div>
        )}
      </div>
    </div>
  );
}
