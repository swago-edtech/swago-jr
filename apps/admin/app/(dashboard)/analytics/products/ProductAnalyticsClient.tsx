'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@swago/utils';
import DateRangeFilter, { DateRange, getDefaultDateRange } from '@/components/DateRangeFilter';
import AnalyticsCard from '@/components/AnalyticsCard';
import { getProductAnalytics, ProductAnalyticsData, ProductSalesRow } from './actions';
import { exportToCSV } from '@/lib/exportCsv';
import { Package, ShoppingBag, CreditCard, Truck, IndianRupee, TrendingUp, RotateCcw, Download, AlertTriangle, Layers, BarChart2, Award, ShieldAlert, XOctagon, Search, ArrowUpDown } from 'lucide-react';
import ProductAnalyticsCharts from './ProductAnalyticsCharts';
import SingleProductInsight from './SingleProductInsight';

export default function ProductAnalyticsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [data, setData] = useState<ProductAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'qtySold' | 'netRevenue' | 'rtoRate' | 'refundRate'>('qtySold');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const fetchData = useCallback(async (range: DateRange, payment: string, status: string) => {
    setLoading(true);
    try {
      const result = await getProductAnalytics(range.from, range.to, {
        paymentMethod: payment,
        status: status,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to fetch product analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateRange, paymentFilter, statusFilter);
  }, [dateRange, paymentFilter, statusFilter, fetchData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Product-wise sales, quantity &amp; revenue breakdown</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV('product_sales', data?.products || [])}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Payments</option>
          <option value="razorpay">Prepaid Only</option>
          <option value="cod">COD Only</option>
          <option value="amazon">Amazon Only</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="Delivered">Delivered</option>
          <option value="Shipped">Shipped</option>
          <option value="Paid">Paid</option>
          <option value="Cancelled">Cancelled</option>
          <option value="RTO">RTO</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading product data...</p>
          </div>
        </div>
      ) : data ? (
        <>
          {/* Product-Specific KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
            <AnalyticsCard 
              title="Products Sold" 
              value={data.products.length} 
              subtitle="Unique items moved"
              icon={Package} 
              color="bg-indigo-500" 
            />
            <AnalyticsCard 
              title="Total Units Sold" 
              value={data.totals.totalQty} 
              subtitle="Overall sales volume"
              icon={BarChart2} 
              color="bg-blue-500" 
            />
            <AnalyticsCard 
              title="Avg Units / Order" 
              value={data.totals.totalOrders > 0 ? (data.totals.totalQty / data.totals.totalOrders).toFixed(1) : '0'} 
              subtitle="Product cart density"
              icon={ShoppingBag} 
              color="bg-emerald-500" 
            />
            <AnalyticsCard 
              title="Global Refund Rate" 
              value={`${data.totals.totalRevenue > 0 ? ((data.totals.totalRefunds / data.totals.totalRevenue) * 100).toFixed(1) : 0}%`} 
              subtitle="Overall revenue loss"
              icon={ShieldAlert} 
              color="bg-orange-500" 
            />
            <AnalyticsCard 
              title="Global RTO Rate" 
              value={`${data.totals.totalOrders > 0 ? ((data.products.reduce((acc, p) => acc + p.rtoCount, 0) / data.totals.totalOrders) * 100).toFixed(1) : 0}%`} 
              subtitle="Overall return to origin"
              icon={XOctagon} 
              color="bg-red-500" 
            />
            <AnalyticsCard 
              title="High-Risk Products" 
              value={data.products.filter((p: ProductSalesRow) => {
                const rtoRate = p.orders > 0 ? (p.rtoCount / p.orders) * 100 : 0;
                const refundRate = p.revenue > 0 ? (p.refunds / p.revenue) * 100 : 0;
                return rtoRate > 20 || refundRate > 15;
              }).length} 
              subtitle=">15% Refund or >20% RTO"
              icon={AlertTriangle} 
              color="bg-rose-600" 
              textColor="text-rose-600"
            />
          </div>

          {/* Product Analytics Charts (Categories, Bestsellers, Alerts) */}
          <ProductAnalyticsCharts products={data.products} categoryData={data.categoryData} />

          {/* Individual Product Insight (Quick View / Deep Dive) */}
          <SingleProductInsight productsList={data.products} />

          {/* Unified Product Metrics Heatmap */}
          <div className="pt-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold text-[#0f172a]">Product Performance Heatmap</h2>
                <p className="text-[13px] font-medium text-[#64748b] mt-1">Unified graphical matrix. Color intensity represents metric strength. Red indicates high risk (RTO/Refunds).</p>
              </div>
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 text-black rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div className="bg-[#ffffff]/80 shadow-sm backdrop-blur-xl rounded-2xl border border-[#e2e8f0]/80 overflow-hidden">
              <div className="overflow-x-auto p-4 sm:p-6">
                <div className="min-w-[800px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-2 mb-4 px-2 text-[10px] font-black uppercase tracking-wider text-[#94a3b8]">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-5">Product Details</div>
                    <div 
                      className="col-span-2 text-center cursor-pointer hover:text-[#0f172a] transition-colors flex items-center justify-center gap-1"
                      onClick={() => { setSortBy('qtySold'); setSortOrder(sortBy === 'qtySold' && sortOrder === 'desc' ? 'asc' : 'desc'); }}
                    >
                      Volume <ArrowUpDown className="w-3 h-3" />
                    </div>
                    <div 
                      className="col-span-2 text-center cursor-pointer hover:text-[#0f172a] transition-colors flex items-center justify-center gap-1"
                      onClick={() => { setSortBy('netRevenue'); setSortOrder(sortBy === 'netRevenue' && sortOrder === 'desc' ? 'asc' : 'desc'); }}
                    >
                      Net Revenue <ArrowUpDown className="w-3 h-3" />
                    </div>
                    <div 
                      className="col-span-1 text-center cursor-pointer hover:text-[#0f172a] transition-colors flex items-center justify-center gap-1"
                      onClick={() => { setSortBy('rtoRate'); setSortOrder(sortBy === 'rtoRate' && sortOrder === 'desc' ? 'asc' : 'desc'); }}
                    >
                      RTO Rate <ArrowUpDown className="w-3 h-3" />
                    </div>
                    <div 
                      className="col-span-1 text-center cursor-pointer hover:text-[#0f172a] transition-colors flex items-center justify-center gap-1"
                      onClick={() => { setSortBy('refundRate'); setSortOrder(sortBy === 'refundRate' && sortOrder === 'desc' ? 'asc' : 'desc'); }}
                    >
                      Refund Rate <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Data Rows */}
                  <div className="flex flex-col gap-1.5">
                    {(() => {
                      const filteredProducts = data.products.filter((p: ProductSalesRow) => 
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.category.toLowerCase().includes(searchQuery.toLowerCase())
                      );

                      const sortedProducts = [...filteredProducts].sort((a, b) => {
                        const aRto = a.orders > 0 ? (a.rtoCount / a.orders) * 100 : 0;
                        const bRto = b.orders > 0 ? (b.rtoCount / b.orders) * 100 : 0;
                        const aRefund = a.revenue > 0 ? (a.refunds / a.revenue) * 100 : 0;
                        const bRefund = b.revenue > 0 ? (b.refunds / b.revenue) * 100 : 0;

                        let valA = 0;
                        let valB = 0;
                        
                        if (sortBy === 'qtySold') { valA = a.qtySold; valB = b.qtySold; }
                        else if (sortBy === 'netRevenue') { valA = a.netRevenue; valB = b.netRevenue; }
                        else if (sortBy === 'rtoRate') { valA = aRto; valB = bRto; }
                        else if (sortBy === 'refundRate') { valA = aRefund; valB = bRefund; }

                        return sortOrder === 'desc' ? valB - valA : valA - valB;
                      });

                      if (sortedProducts.length === 0) return (
                        <div className="py-12 text-center text-[13px] font-bold text-[#94a3b8]">No product data available</div>
                      );
                      const maxQty = Math.max(...sortedProducts.map((p: ProductSalesRow) => p.qtySold), 1);
                      const maxRev = Math.max(...sortedProducts.map((p: ProductSalesRow) => p.netRevenue), 1);
                      
                      const getVolumeColor = (qty: number, max: number) => {
                        if (qty === 0) return 'bg-slate-50 text-slate-400';
                        const pct = qty / max;
                        if (pct > 0.8) return 'bg-indigo-600 text-white';
                        if (pct > 0.5) return 'bg-indigo-400 text-white';
                        if (pct > 0.2) return 'bg-indigo-200 text-indigo-900';
                        return 'bg-indigo-50 text-indigo-700';
                      };

                      const getRevenueColor = (rev: number, max: number) => {
                        if (rev <= 0) return 'bg-slate-50 text-slate-400';
                        const pct = rev / max;
                        if (pct > 0.8) return 'bg-emerald-500 text-white';
                        if (pct > 0.5) return 'bg-emerald-400 text-white';
                        if (pct > 0.2) return 'bg-emerald-200 text-emerald-900';
                        return 'bg-emerald-50 text-emerald-700';
                      };

                      const getRiskColor = (rate: number) => {
                        if (rate === 0) return 'bg-slate-50 text-slate-400';
                        if (rate >= 20) return 'bg-rose-600 text-white';
                        if (rate >= 10) return 'bg-rose-400 text-white';
                        if (rate >= 5) return 'bg-amber-200 text-amber-900';
                        return 'bg-slate-50 text-slate-500';
                      };

                      return sortedProducts.map((p: ProductSalesRow, index: number) => {
                        const rtoRate = p.orders > 0 ? (p.rtoCount / p.orders) * 100 : 0;
                        const refundRate = p.revenue > 0 ? (p.refunds / p.revenue) * 100 : 0;

                        return (
                          <div key={p.productId} className="grid grid-cols-12 gap-2 items-center px-2 py-1.5 rounded-xl hover:bg-[#f8fafc] transition-colors group border border-transparent hover:border-[#e2e8f0]/50">
                            <div className="col-span-1 text-center text-[12px] font-bold text-[#94a3b8]">{index + 1}</div>
                            <div className="col-span-5 flex flex-col justify-center min-w-0 pr-4">
                              <span className="text-[13px] font-black text-[#0f172a] truncate" title={p.name}>{p.name}</span>
                              <span className="text-[10px] font-bold text-[#64748b] truncate">{p.category}</span>
                            </div>
                            
                            {/* Heatmap Cells */}
                            <div className="col-span-2 p-1">
                              <div className={`w-full h-11 rounded-xl flex flex-col items-center justify-center transition-all ${getVolumeColor(p.qtySold, maxQty)}`}>
                                <span className="text-[14px] font-black leading-none">{p.qtySold}</span>
                                {p.qtySold > 0 && <span className="text-[8px] font-black opacity-80 mt-0.5 uppercase tracking-widest">Units</span>}
                              </div>
                            </div>
                            
                            <div className="col-span-2 p-1">
                              <div className={`w-full h-11 rounded-xl flex flex-col items-center justify-center transition-all ${getRevenueColor(p.netRevenue, maxRev)}`}>
                                <span className="text-[14px] font-black leading-none">{formatPrice(p.netRevenue)}</span>
                              </div>
                            </div>
                            
                            <div className="col-span-1 p-1">
                              <div className={`w-full h-11 rounded-xl flex flex-col items-center justify-center transition-all ${getRiskColor(rtoRate)}`}>
                                <span className="text-[13px] font-black leading-none">{rtoRate > 0 ? `${rtoRate.toFixed(1)}%` : '-'}</span>
                              </div>
                            </div>
                            
                            <div className="col-span-1 p-1">
                              <div className={`w-full h-11 rounded-xl flex flex-col items-center justify-center transition-all ${getRiskColor(refundRate)}`}>
                                <span className="text-[13px] font-black leading-none">{refundRate > 0 ? `${refundRate.toFixed(1)}%` : '-'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-4 bg-[#ffffff]/80 shadow-sm backdrop-blur-xl rounded-2xl border border-[#e2e8f0]/80 p-4 flex flex-wrap gap-x-8 gap-y-3 justify-center text-[11px] font-bold">
              <div className="flex items-center gap-2">
                <span className="text-[#64748b] uppercase tracking-wider text-[9px]">Volume:</span>
                <div className="flex items-center gap-0.5">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[8px] bg-indigo-50 text-indigo-400">Low</div>
                  <div className="w-5 h-5 rounded bg-indigo-200"></div>
                  <div className="w-5 h-5 rounded bg-indigo-400"></div>
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[8px] bg-indigo-600 text-white">High</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#64748b] uppercase tracking-wider text-[9px]">Revenue:</span>
                <div className="flex items-center gap-0.5">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[8px] bg-emerald-50 text-emerald-400">Low</div>
                  <div className="w-5 h-5 rounded bg-emerald-200"></div>
                  <div className="w-5 h-5 rounded bg-emerald-400"></div>
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[8px] bg-emerald-500 text-white">High</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#64748b] uppercase tracking-wider text-[9px]">Risk (RTO/Refund):</span>
                <div className="flex items-center gap-0.5">
                  <div className="w-8 h-5 rounded flex items-center justify-center text-[8px] bg-slate-50 text-slate-400">0%</div>
                  <div className="w-8 h-5 rounded flex items-center justify-center text-[8px] bg-amber-200 text-amber-900">&gt;5%</div>
                  <div className="w-8 h-5 rounded flex items-center justify-center text-[8px] bg-rose-400 text-white">&gt;10%</div>
                  <div className="w-8 h-5 rounded flex items-center justify-center text-[8px] bg-rose-600 text-white">&gt;20%</div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
