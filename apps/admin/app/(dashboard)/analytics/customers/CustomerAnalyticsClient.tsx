'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@swago/utils';
import DateRangeFilter, { DateRange, getDefaultDateRange } from '@/components/DateRangeFilter';
import AnalyticsCard from '@/components/AnalyticsCard';
import { getCustomerAnalytics, CustomerAnalyticsData, TopCustomer, CityCustomerRow } from './actions';
import { exportToCSV } from '@/lib/exportCsv';
import { Users, UserPlus, Repeat, TrendingUp, MapPin, Crown, Download, IndianRupee, Search, ArrowUpDown, Award, Star } from 'lucide-react';

export default function CustomerAnalyticsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [data, setData] = useState<CustomerAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'customers' | 'orders' | 'revenue'>('revenue');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const fetchData = useCallback(async (range: DateRange) => {
    setLoading(true);
    try {
      const result = await getCustomerAnalytics(range.from, range.to);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch customer analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateRange);
  }, [dateRange, fetchData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">New vs repeat buyers, top spenders, LTV & demographics</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV('top_customers', data?.topCustomers || [])}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export VIPs</span>
          </button>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading customer data...</p>
          </div>
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <AnalyticsCard title="Total Customers" value={data.totalCustomers} icon={Users} color="bg-indigo-500" />
            <AnalyticsCard title="New Customers" value={data.newCustomers} icon={UserPlus} color="bg-blue-500" />
            <AnalyticsCard title="Repeat Customers" value={data.repeatCustomers} icon={Repeat} color="bg-purple-500" />
            <AnalyticsCard 
              title="Repeat Rate" 
              value={`${data.repeatRate}%`} 
              icon={TrendingUp} 
              color="bg-teal-600" 
              textColor={data.repeatRate >= 20 ? 'text-teal-700' : 'text-amber-600'}
            />
            <AnalyticsCard 
              title="Avg Order Value" 
              value={formatPrice(data.aov)} 
              subtitle="Revenue ÷ Orders"
              icon={IndianRupee} 
              color="bg-emerald-500" 
            />
            <AnalyticsCard 
              title="Est. LTV" 
              value={formatPrice(data.ltv)} 
              subtitle="Revenue ÷ Customers"
              icon={Award} 
              color="bg-amber-500" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* VIP Customers Matrix */}
            <div className="bg-[#ffffff]/80 shadow-sm backdrop-blur-xl rounded-2xl border border-[#e2e8f0]/80 overflow-hidden flex flex-col h-full">
              <div className="px-6 py-4 border-b border-[#e2e8f0]/80 flex justify-between items-center">
                <h2 className="text-[16px] font-bold text-[#0f172a] flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  Top Spender VIP Matrix
                </h2>
              </div>
              
              <div className="overflow-x-auto flex-1">
                <div className="min-w-[500px]">
                  <div className="grid grid-cols-12 gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-wider text-[#94a3b8] bg-[#f8fafc]/50">
                    <div className="col-span-4">Customer</div>
                    <div className="col-span-2 text-center">Tier</div>
                    <div className="col-span-2 text-center">Orders</div>
                    <div className="col-span-2 text-center">Spend</div>
                    <div className="col-span-2 text-right">AOV</div>
                  </div>
                  
                  <div className="flex flex-col gap-1 p-3">
                    {data.topCustomers.length === 0 ? (
                      <div className="py-8 text-center text-[13px] font-bold text-[#94a3b8]">No VIP customers found</div>
                    ) : (
                      data.topCustomers.map((c: TopCustomer, i: number) => {
                        const aov = c.orderCount > 0 ? c.totalSpend / c.orderCount : 0;
                        const tier = i === 0 ? 'Platinum' : i <= 2 ? 'Gold' : 'Silver';
                        const tierColors = {
                          Platinum: 'bg-slate-900 text-slate-100 border-slate-700',
                          Gold: 'bg-amber-100 text-amber-800 border-amber-300',
                          Silver: 'bg-slate-100 text-slate-600 border-slate-300'
                        };
                        const iconColors = {
                          Platinum: 'text-slate-100',
                          Gold: 'text-amber-500',
                          Silver: 'text-slate-400'
                        };

                        return (
                          <div key={c.userId} className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-xl hover:bg-[#f8fafc] transition-colors border border-transparent hover:border-[#e2e8f0]/50 group">
                            <div className="col-span-4 flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-[#f1f5f9] text-[#64748b]'}`}>
                                #{i + 1}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[13px] font-bold text-[#0f172a] truncate">{c.name}</span>
                                <span className="text-[11px] font-medium text-[#64748b] truncate">{c.phone || c.email}</span>
                              </div>
                            </div>
                            
                            <div className="col-span-2 flex justify-center">
                              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${tierColors[tier]}`}>
                                <Star className={`w-3 h-3 fill-current ${iconColors[tier]}`} />
                                {tier}
                              </div>
                            </div>
                            
                            <div className="col-span-2 text-center text-[13px] font-bold text-[#334155]">{c.orderCount}</div>
                            
                            <div className="col-span-2 text-center text-[13px] font-black text-emerald-600">
                              {formatPrice(c.totalSpend)}
                            </div>
                            
                            <div className="col-span-2 text-right text-[12px] font-bold text-[#64748b]">
                              {formatPrice(aov)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Demographics Matrix */}
            <div className="space-y-6 flex flex-col h-full">
              {/* Age Distribution */}
              <div className="bg-[#ffffff]/80 shadow-sm backdrop-blur-xl rounded-2xl border border-[#e2e8f0]/80 p-6 flex-1">
                <h3 className="text-[15px] font-bold text-[#0f172a] mb-5">Age Demographics</h3>
                {data.ageDistribution.length > 0 ? (
                  <div className="space-y-4">
                    {data.ageDistribution.map(a => {
                      const maxCount = Math.max(...data.ageDistribution.map(d => d.count));
                      const width = maxCount > 0 ? Math.max(10, (a.count / maxCount) * 100) : 0;
                      return (
                        <div key={a.label} className="flex items-center gap-4 group">
                          <span className="text-[13px] font-bold text-[#64748b] w-14 text-right">{a.label} yrs</span>
                          <div className="flex-1 h-7 bg-[#f1f5f9] rounded-xl overflow-hidden relative">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-xl transition-all duration-1000 ease-out flex items-center justify-end px-3"
                              style={{ width: `${width}%` }}
                            >
                            </div>
                            <span className="absolute inset-0 flex items-center px-3 text-[12px] font-black mix-blend-difference text-white">
                              {a.count} {a.count === 1 ? 'user' : 'users'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[13px] font-bold text-[#94a3b8] text-center py-8">No age data available</p>
                )}
              </div>

              {/* Gender Distribution */}
              <div className="bg-[#ffffff]/80 shadow-sm backdrop-blur-xl rounded-2xl border border-[#e2e8f0]/80 p-6 flex-1">
                <h3 className="text-[15px] font-bold text-[#0f172a] mb-5">Gender Demographics</h3>
                {data.genderDistribution.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {data.genderDistribution.map(g => {
                      const total = data.genderDistribution.reduce((s, d) => s + d.count, 0);
                      const pct = total > 0 ? Math.round((g.count / total) * 100) : 0;
                      const colors: Record<string, string> = {
                        Boy: 'bg-[#eff6ff] text-blue-600 border-blue-200 hover:border-blue-300',
                        Girl: 'bg-[#fdf2f8] text-pink-600 border-pink-200 hover:border-pink-300',
                        Other: 'bg-[#faf5ff] text-purple-600 border-purple-200 hover:border-purple-300',
                        Unknown: 'bg-[#f8fafc] text-[#64748b] border-[#e2e8f0] hover:border-[#cbd5e1]',
                      };
                      return (
                        <div key={g.label} className={`rounded-2xl border p-4 text-center transition-colors cursor-default ${colors[g.label] || colors.Unknown}`}>
                          <div className="text-[24px] font-black leading-none mb-1">{g.count}</div>
                          <div className="text-[12px] font-bold opacity-90">{g.label}</div>
                          <div className="text-[10px] font-bold opacity-60 mt-1 bg-white/50 inline-block px-2 py-0.5 rounded-full">{pct}%</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[13px] font-bold text-[#94a3b8] text-center py-8">No gender data available</p>
                )}
              </div>
            </div>
          </div>

          {/* City Performance Heatmap */}
          <div className="pt-6">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold text-[#0f172a] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                  Geographic Performance Matrix
                </h2>
                <p className="text-[13px] font-medium text-[#64748b] mt-1">Color intensity indicates higher customer volume and revenue yield.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search city or state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-[#e2e8f0] text-[#0f172a] rounded-xl text-[13px] font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors shadow-sm"
                />
              </div>
            </div>

            <div className="bg-[#ffffff]/80 shadow-sm backdrop-blur-xl rounded-2xl border border-[#e2e8f0]/80 overflow-hidden">
              <div className="overflow-x-auto p-4 sm:p-6">
                <div className="min-w-[700px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-2 mb-4 px-2 text-[10px] font-black uppercase tracking-wider text-[#94a3b8]">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-5">Location (City, State)</div>
                    <div 
                      className="col-span-2 text-center cursor-pointer hover:text-[#0f172a] transition-colors flex items-center justify-center gap-1"
                      onClick={() => { setSortBy('customers'); setSortOrder(sortBy === 'customers' && sortOrder === 'desc' ? 'asc' : 'desc'); }}
                    >
                      Customers <ArrowUpDown className="w-3 h-3" />
                    </div>
                    <div 
                      className="col-span-2 text-center cursor-pointer hover:text-[#0f172a] transition-colors flex items-center justify-center gap-1"
                      onClick={() => { setSortBy('orders'); setSortOrder(sortBy === 'orders' && sortOrder === 'desc' ? 'asc' : 'desc'); }}
                    >
                      Orders <ArrowUpDown className="w-3 h-3" />
                    </div>
                    <div 
                      className="col-span-2 text-center cursor-pointer hover:text-[#0f172a] transition-colors flex items-center justify-center gap-1"
                      onClick={() => { setSortBy('revenue'); setSortOrder(sortBy === 'revenue' && sortOrder === 'desc' ? 'asc' : 'desc'); }}
                    >
                      Revenue <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Data Rows */}
                  <div className="flex flex-col gap-1.5">
                    {(() => {
                      const filteredCities = data.cityBreakdown.filter((c: CityCustomerRow) => 
                        c.city.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        c.state.toLowerCase().includes(searchQuery.toLowerCase())
                      );

                      const sortedCities = [...filteredCities].sort((a, b) => {
                        let valA = 0;
                        let valB = 0;
                        if (sortBy === 'customers') { valA = a.customers; valB = b.customers; }
                        else if (sortBy === 'orders') { valA = a.orders; valB = b.orders; }
                        else if (sortBy === 'revenue') { valA = a.revenue; valB = b.revenue; }
                        return sortOrder === 'desc' ? valB - valA : valA - valB;
                      });

                      if (sortedCities.length === 0) return (
                        <div className="py-12 text-center text-[13px] font-bold text-[#94a3b8]">No location data available</div>
                      );

                      const maxCust = Math.max(...sortedCities.map((c: CityCustomerRow) => c.customers), 1);
                      const maxRev = Math.max(...sortedCities.map((c: CityCustomerRow) => c.revenue), 1);
                      
                      const getVolumeColor = (val: number, max: number) => {
                        if (val === 0) return 'bg-slate-50 text-slate-400';
                        const pct = val / max;
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

                      return sortedCities.slice(0, 30).map((c: CityCustomerRow, index: number) => {
                        return (
                          <div key={`${c.city}-${c.state}`} className="grid grid-cols-12 gap-2 items-center px-2 py-1.5 rounded-xl hover:bg-[#f8fafc] transition-colors group border border-transparent hover:border-[#e2e8f0]/50">
                            <div className="col-span-1 text-center text-[12px] font-bold text-[#94a3b8]">{index + 1}</div>
                            <div className="col-span-5 flex flex-col justify-center min-w-0 pr-4">
                              <span className="text-[13px] font-black text-[#0f172a] truncate">{c.city}</span>
                              <span className="text-[10px] font-bold text-[#64748b] truncate uppercase">{c.state}</span>
                            </div>
                            
                            <div className="col-span-2 p-1">
                              <div className={`w-full h-10 rounded-xl flex items-center justify-center transition-all ${getVolumeColor(c.customers, maxCust)}`}>
                                <span className="text-[13px] font-black">{c.customers}</span>
                              </div>
                            </div>

                            <div className="col-span-2 p-1">
                              <div className={`w-full h-10 rounded-xl flex items-center justify-center transition-all bg-[#f1f5f9] text-[#334155]`}>
                                <span className="text-[13px] font-black">{c.orders}</span>
                              </div>
                            </div>
                            
                            <div className="col-span-2 p-1">
                              <div className={`w-full h-10 rounded-xl flex items-center justify-center transition-all ${getRevenueColor(c.revenue, maxRev)}`}>
                                <span className="text-[13px] font-black">{formatPrice(c.revenue)}</span>
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
            
            {/* Heatmap Legend */}
            <div className="mt-4 bg-[#ffffff]/80 shadow-sm backdrop-blur-xl rounded-2xl border border-[#e2e8f0]/80 p-4 flex flex-wrap gap-x-8 gap-y-3 justify-center text-[11px] font-bold">
              <div className="flex items-center gap-2">
                <span className="text-[#64748b] uppercase tracking-wider text-[9px]">Customers:</span>
                <div className="flex items-center gap-0.5">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[8px] bg-indigo-50 text-indigo-400">Low</div>
                  <div className="w-5 h-5 rounded bg-indigo-200"></div>
                  <div className="w-5 h-5 rounded bg-indigo-400"></div>
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[8px] bg-indigo-600 text-white">High</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#64748b] uppercase tracking-wider text-[9px]">Revenue Yield:</span>
                <div className="flex items-center gap-0.5">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[8px] bg-emerald-50 text-emerald-400">Low</div>
                  <div className="w-5 h-5 rounded bg-emerald-200"></div>
                  <div className="w-5 h-5 rounded bg-emerald-400"></div>
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[8px] bg-emerald-500 text-white">High</div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
