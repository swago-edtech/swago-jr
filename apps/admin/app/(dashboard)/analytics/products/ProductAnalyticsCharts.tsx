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
  ResponsiveContainer
} from 'recharts';
import { ProductSalesRow, CategoryRevenue } from './actions';

interface ProductAnalyticsChartsProps {
  products: ProductSalesRow[];
  categoryData: CategoryRevenue[];
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

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

export default function ProductAnalyticsCharts({ products, categoryData }: ProductAnalyticsChartsProps) {
  const formatYAxis = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  const top10Products = [...products].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  
  // Find problematic products: at least 3 orders and RTO rate > 20% OR high refunds
  const problematicProducts = [...products]
    .filter(p => p.orders >= 3)
    .map(p => ({
      ...p,
      rtoRate: (p.rtoCount / p.orders) * 100,
      refundRate: p.revenue > 0 ? (p.refunds / p.revenue) * 100 : 0
    }))
    .filter(p => p.rtoRate > 20 || p.refundRate > 15)
    .sort((a, b) => b.rtoRate - a.rtoRate)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Category Distribution Pie Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Top Categories by Revenue</h3>
        {categoryData.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData.slice(0, 6)} // Top 6
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="revenue"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {categoryData.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={tooltipStyle.contentStyle} 
                  itemStyle={tooltipStyle.itemStyle} 
                  formatter={(value: number | undefined) => [`₹${(value ?? 0).toLocaleString('en-IN')}`, 'Revenue']} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
            No category data available
          </div>
        )}
      </div>

      {/* Top 10 Products by Revenue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Top 10 Bestsellers (By Revenue)</h3>
        {top10Products.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Products} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={formatYAxis} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: '#4b5563' }} />
                <Tooltip 
                  contentStyle={tooltipStyle.contentStyle} 
                  labelStyle={tooltipStyle.labelStyle} 
                  itemStyle={tooltipStyle.itemStyle} 
                  cursor={{ fill: '#f3f4f6' }}
                  formatter={(value: number | undefined) => [`₹${(value ?? 0).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
            No product data available
          </div>
        )}
      </div>

      {/* Problematic Products Table */}
      {problematicProducts.length > 0 && (
        <div className="bg-rose-50 rounded-xl shadow-sm border border-rose-100 p-6 lg:col-span-3">
          <h3 className="text-base font-semibold text-rose-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            Problematic Products Alert (High RTO or Refunds)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-rose-700 uppercase bg-rose-100/50">
                <tr>
                  <th className="px-4 py-2 rounded-l-lg">Product Name</th>
                  <th className="px-4 py-2">Orders</th>
                  <th className="px-4 py-2">RTO Count</th>
                  <th className="px-4 py-2">RTO Rate</th>
                  <th className="px-4 py-2">Refunds</th>
                  <th className="px-4 py-2 rounded-r-lg">Refund Rate</th>
                </tr>
              </thead>
              <tbody>
                {problematicProducts.map((p, i) => (
                  <tr key={i} className="border-b border-rose-100/50 last:border-0 text-rose-900">
                    <td className="px-4 py-3 font-medium truncate max-w-[200px]" title={p.name}>{p.name}</td>
                    <td className="px-4 py-3">{p.orders}</td>
                    <td className="px-4 py-3 text-rose-600 font-bold">{p.rtoCount}</td>
                    <td className="px-4 py-3">{p.rtoRate.toFixed(1)}%</td>
                    <td className="px-4 py-3">₹{Math.round(p.refunds).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">{p.refundRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
