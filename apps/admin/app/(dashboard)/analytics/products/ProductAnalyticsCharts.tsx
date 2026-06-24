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
import { formatPrice } from '@swago/utils';
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
      <div className="bg-[#ffffff]/80 shadow-sm backdrop-blur-xl rounded-2xl border border-[#e2e8f0]/80 p-6">
        <div className="mb-2">
          <h3 className="text-[15px] font-bold text-[#0f172a]">Top Categories</h3>
          <p className="text-[12px] font-medium text-[#64748b] mt-1">Revenue breakdown by product category</p>
        </div>
        {categoryData.length > 0 ? (
          <div>
            <div className="w-full h-[260px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData.slice(0, 6)} // Top 6
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="revenue"
                    nameKey="name"
                    stroke="none"
                  >
                    {categoryData.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                    itemStyle={{ color: '#10b981', fontWeight: 900, fontSize: '14px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}
                    formatter={(value: number | undefined) => [formatPrice(value ?? 0), 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text for Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="text-[24px] font-black text-[#0f172a] leading-none">{categoryData.length}</span>
                <span className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest mt-1">Categories</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
              {categoryData.slice(0, 6).map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}></div>
                  <span className="text-[11px] font-bold text-[#475569]">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full h-[250px] flex items-center justify-center text-[#94a3b8] text-sm font-bold bg-[#f8fafc]/50 rounded-xl border border-[#e2e8f0]/50 border-dashed mt-4">
            No category data available
          </div>
        )}
      </div>

      {/* Top 10 Bestsellers (Custom Visual List) */}
      <div className="bg-[#ffffff]/80 shadow-sm backdrop-blur-xl rounded-2xl border border-[#e2e8f0]/80 p-6 lg:col-span-2">
        <div className="mb-6">
          <h3 className="text-[15px] font-bold text-[#0f172a]">Top Bestsellers Spotlight</h3>
          <p className="text-[12px] font-medium text-[#64748b] mt-1">Highest revenue-generating products</p>
        </div>
        
        {top10Products.length > 0 ? (
          <div className="space-y-4">
            {(() => {
              const maxRev = top10Products[0].revenue; // It's sorted descending
              return top10Products.map((p, index) => {
                const widthPercent = Math.max((p.revenue / maxRev) * 100, 2); // min 2% for visibility
                return (
                  <div key={p.productId} className="group">
                    <div className="flex justify-between items-end mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-[#94a3b8] w-4">{index + 1}.</span>
                        <span className="text-[13px] font-bold text-[#0f172a] truncate max-w-[180px] sm:max-w-[250px] md:max-w-[300px]" title={p.name}>{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-[#64748b] hidden sm:inline">{p.orders} orders</span>
                        <span className="text-[14px] font-black text-[#10b981]">{formatPrice(p.revenue)}</span>
                      </div>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full h-2.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#818cf8] group-hover:from-[#4f46e5] group-hover:to-[#6366f1] transition-all duration-500 relative overflow-hidden"
                        style={{ width: `${widthPercent}%` }}
                      >
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
           <div className="w-full h-[250px] flex items-center justify-center text-[#94a3b8] text-sm font-bold bg-[#f8fafc]/50 rounded-xl border border-[#e2e8f0]/50 border-dashed">
             No product data available
           </div>
        )}
      </div>

      {/* Problematic Products Alert Cards */}
      {problematicProducts.length > 0 && (
        <div className="lg:col-span-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
            <h3 className="text-[15px] font-bold text-rose-900">Action Required: Problematic Products</h3>
            <span className="text-[12px] font-bold text-rose-600/70 ml-2">High RTO (&gt;20%) or Refund (&gt;15%) Rates</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {problematicProducts.map((p, i) => (
              <div key={i} className="bg-gradient-to-br from-rose-50 to-white rounded-2xl border border-rose-200/60 p-5 shadow-sm hover:shadow-md transition-all group">
                <p className="font-black text-[#0f172a] text-[14px] truncate mb-3 group-hover:text-rose-600 transition-colors" title={p.name}>{p.name}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-rose-100 p-3 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">RTO Rate</p>
                    <div className="flex items-end gap-1.5">
                      <p className={`text-[16px] font-black leading-none ${p.rtoRate > 20 ? 'text-rose-600' : 'text-[#0f172a]'}`}>{p.rtoRate.toFixed(1)}%</p>
                      <p className="text-[10px] font-bold text-[#64748b] mb-0.5">({p.rtoCount} items)</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-rose-100 p-3 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Refund Rate</p>
                    <div className="flex items-end gap-1.5">
                      <p className={`text-[16px] font-black leading-none ${p.refundRate > 15 ? 'text-rose-600' : 'text-[#0f172a]'}`}>{p.refundRate.toFixed(1)}%</p>
                      <p className="text-[10px] font-bold text-[#64748b] mb-0.5">({formatPrice(p.refunds)})</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-rose-100 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-[#64748b]">Total Orders: {p.orders}</span>
                  <span className="text-[#64748b]">Revenue: {formatPrice(p.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
