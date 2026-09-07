import { useState, useEffect, useCallback } from 'react';
import DateRangeFilter, { DateRange, getDefaultDateRange } from '@/components/DateRangeFilter';
import { getSingleProductAnalytics, ProductSalesRow } from './actions';
import { formatPrice } from '@swago/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function SingleProductInsight({ productsList }: { productsList: ProductSalesRow[] }) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const selectedProduct = productsList.find(p => p.productId === selectedProductId);

  const fetchData = useCallback(async (id: string, name: string, range: DateRange) => {
    setLoading(true);
    try {
      const result = await getSingleProductAnalytics(id, name, range.from, range.to);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch single product analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProductId && selectedProduct) {
      fetchData(selectedProductId, selectedProduct.name, dateRange);
    } else {
      setData(null);
    }
  }, [selectedProductId, selectedProduct, dateRange, fetchData]);

  return (
    <div className="pt-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold text-[#0f172a]">Individual Product Insight</h2>
          <p className="text-[13px] font-medium text-[#64748b] mt-1">Select a product and timeframe to view its specific roadmap and breakdown.</p>
        </div>
        
        {/* Independent Date Range Picker */}
        {selectedProductId && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Timeframe:</span>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        )}
      </div>

      <div className="bg-[#ffffff]/80 shadow-sm backdrop-blur-xl rounded-2xl border border-[#e2e8f0]/80 p-6">
        <div className="max-w-md mb-6">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 text-black rounded-lg text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="">-- Choose a product to analyze --</option>
            {[...productsList].sort((a, b) => a.name.localeCompare(b.name)).map(p => (
              <option key={p.productId} value={p.productId}>{p.name} ({p.category})</option>
            ))}
          </select>
        </div>

        {!selectedProductId ? (
          <div className="py-8 text-center text-[13px] font-bold text-[#94a3b8] bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
            Select a product from the dropdown above to see its detailed insights.
          </div>
        ) : loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading product roadmap...</p>
          </div>
        ) : data ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Level Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col">
                <span className="text-indigo-600 text-[11px] font-bold uppercase tracking-wider mb-1">Volume Sold</span>
                <span className="text-2xl font-black text-indigo-900">{data.totals.qtySold} <span className="text-sm font-medium text-indigo-700">units</span></span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col">
                <span className="text-emerald-600 text-[11px] font-bold uppercase tracking-wider mb-1">Net Revenue</span>
                <span className="text-2xl font-black text-emerald-900">{formatPrice(data.totals.netRevenue)}</span>
              </div>
              {(() => {
                const rtoRate = data.totals.totalOrders > 0 ? (data.totals.rtoCount / data.totals.totalOrders) * 100 : 0;
                const refundRate = data.totals.revenue > 0 ? (data.totals.refunds / data.totals.revenue) * 100 : 0;
                return (
                  <>
                    <div className={`border rounded-xl p-4 flex flex-col ${rtoRate > 15 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'}`}>
                      <span className={`${rtoRate > 15 ? 'text-rose-600' : 'text-slate-500'} text-[11px] font-bold uppercase tracking-wider mb-1`}>RTO Rate</span>
                      <div className="flex items-end gap-2">
                        <span className={`text-2xl font-black ${rtoRate > 15 ? 'text-rose-900' : 'text-slate-700'}`}>{rtoRate.toFixed(1)}%</span>
                        <span className={`text-sm font-medium mb-1 ${rtoRate > 15 ? 'text-rose-700' : 'text-slate-500'}`}>({data.totals.rtoCount} orders)</span>
                      </div>
                    </div>
                    <div className={`border rounded-xl p-4 flex flex-col ${refundRate > 10 ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-200'}`}>
                      <span className={`${refundRate > 10 ? 'text-orange-600' : 'text-slate-500'} text-[11px] font-bold uppercase tracking-wider mb-1`}>Refund Rate</span>
                      <div className="flex items-end gap-2">
                        <span className={`text-2xl font-black ${refundRate > 10 ? 'text-orange-900' : 'text-slate-700'}`}>{refundRate.toFixed(1)}%</span>
                        <span className={`text-sm font-medium mb-1 ${refundRate > 10 ? 'text-orange-700' : 'text-slate-500'}`}>({formatPrice(data.totals.refunds)})</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Roadmap Chart */}
              <div className="lg:col-span-2 border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Daily Activity Roadmap</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.daily} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => format(parseISO(val), 'MMM d')}
                        tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelFormatter={(val) => format(parseISO(val), 'MMM d, yyyy')}
                        formatter={(val: number | undefined) => [`${val ?? 0} Units`, 'Volume Sold']}
                      />
                      <Bar dataKey="qty" radius={[4, 4, 0, 0]}>
                        {data.daily.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.qty > 0 ? '#6366f1' : '#e2e8f0'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Breakdowns */}
              <div className="flex flex-col gap-4">
                <div className="border border-slate-200 rounded-xl p-5 flex-1">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Channel & Payment Split</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-600">Prepaid (Razorpay)</span>
                        <span className="text-emerald-600">{data.breakdown.paidOrders} orders</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${data.totals.totalOrders > 0 ? (data.breakdown.paidOrders / data.totals.totalOrders) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-600">Cash on Delivery (COD)</span>
                        <span className="text-indigo-600">{data.breakdown.codOrders} orders</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${data.totals.totalOrders > 0 ? (data.breakdown.codOrders / data.totals.totalOrders) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-600">Amazon</span>
                        <span className="text-orange-600">{data.breakdown.amazonOrders || 0} orders</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{
                            width: `${data.totals.totalOrders > 0 ? ((data.breakdown.amazonOrders || 0) / data.totals.totalOrders) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 flex-1">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">Top Statuses</h3>
                  <div className="space-y-2">
                    {Object.entries(data.breakdown.status)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 4)
                      .map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                          <span className="text-xs font-semibold text-slate-600">{status}</span>
                          <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">{count as number}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
