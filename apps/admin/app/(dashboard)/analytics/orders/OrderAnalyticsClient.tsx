'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@swago/utils';
import DateRangeFilter, { DateRange, getDefaultDateRange } from '@/components/DateRangeFilter';
import OrderAnalyticsCharts from '@/components/OrderAnalyticsCharts';
import AnalyticsCard from '@/components/AnalyticsCard';
import { getOrderAnalytics, OrderAnalyticsData, DaySummary } from './actions';
import { exportToCSV } from '@/lib/exportCsv';
import { ShoppingBag, CreditCard, Truck, PackageCheck, XCircle, RotateCcw, IndianRupee, TrendingUp, Download, Store } from 'lucide-react';
import type { SalesChannel } from '@/lib/sales-query';

export default function OrderAnalyticsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [channel, setChannel] = useState<SalesChannel>('all');
  const [data, setData] = useState<OrderAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (range: DateRange, selectedChannel: SalesChannel) => {
    setLoading(true);
    try {
      const result = await getOrderAnalytics(range.from, range.to, selectedChannel);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch order analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateRange, channel);
  }, [dateRange, channel, fetchData]);

  const handleDateChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">
            Website + Amazon sales — filter by channel
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {([
              ['all', 'All'],
              ['website', 'Website'],
              ['amazon', 'Amazon'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setChannel(value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  channel === value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => exportToCSV('order_analytics', data?.dailyData || [])}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <DateRangeFilter value={dateRange} onChange={handleDateChange} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading analytics...</p>
          </div>
        </div>
      ) : data ? (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <AnalyticsCard
              title="Total Orders"
              value={data.totals.totalOrders}
              icon={ShoppingBag}
              color="bg-blue-500"
            />
            {(channel === 'all' || channel === 'amazon') && (
              <AnalyticsCard
                title="Amazon Orders"
                value={data.totals.amazonOrders}
                icon={Store}
                color="bg-orange-500"
              />
            )}
            {(channel === 'all' || channel === 'website') && (
              <>
                <AnalyticsCard
                  title="Paid Orders"
                  value={data.totals.paidOrders}
                  icon={CreditCard}
                  color="bg-green-500"
                />
                <AnalyticsCard
                  title="COD Orders"
                  value={data.totals.codOrders}
                  icon={Truck}
                  color="bg-amber-500"
                />
                <AnalyticsCard
                  title="Delivered"
                  value={data.totals.delivered}
                  icon={PackageCheck}
                  color="bg-emerald-600"
                />
                <AnalyticsCard
                  title="RTO"
                  value={data.totals.rto}
                  icon={RotateCcw}
                  color="bg-rose-500"
                />
              </>
            )}
            <AnalyticsCard
              title="Cancelled"
              value={data.totals.cancelled}
              icon={XCircle}
              color="bg-red-500"
            />
            <AnalyticsCard
              title="Total Revenue"
              value={formatPrice(data.totals.totalRevenue)}
              icon={IndianRupee}
              color="bg-indigo-500"
              textColor="text-indigo-700"
            />
            {(channel === 'all' || channel === 'amazon') && (
              <AnalyticsCard
                title="Amazon Revenue"
                value={formatPrice(data.totals.amazonRevenue)}
                icon={Store}
                color="bg-amber-600"
              />
            )}
            <AnalyticsCard
              title="AOV"
              value={
                data.totals.confirmedOrders > 0
                  ? formatPrice(data.totals.totalRevenue / data.totals.confirmedOrders)
                  : '₹0'
              }
              icon={TrendingUp}
              color="bg-violet-500"
            />
          </div>

          {/* Charts */}
          <OrderAnalyticsCharts
            dailyData={data.dailyData}
            hourlyDistribution={data.hourlyDistribution}
            dayOfWeekDistribution={data.dayOfWeekDistribution}
            totals={data.totals}
          />

          {/* Day-wise Insights (Analytics & Trends) */}
          <div className="pt-4">
            <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold text-[#0f172a]">Day-wise Insights & Trends</h2>
                <p className="text-[13px] font-medium text-[#64748b] mt-1">Key highlights and activity intensity at a glance</p>
              </div>
            </div>

            {data.dailyData.length === 0 ? (
              <div className="bg-[#ffffff]/80 shadow-sm backdrop-blur-xl rounded-2xl border border-[#e2e8f0]/80 p-12 text-center">
                <p className="text-[#94a3b8] text-[14px] font-bold">No orders in selected period</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Highlights Column */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  {/* Highlight 1: Peak Revenue */}
                  {(() => {
                    const maxRevDay = [...data.dailyData].sort((a, b) => b.revenue - a.revenue)[0];
                    return maxRevDay && maxRevDay.revenue > 0 ? (
                      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white shadow-sm shadow-emerald-200">
                        <p className="text-emerald-100 text-[11px] font-bold uppercase tracking-wider mb-1">Top Revenue Day</p>
                        <div className="flex items-end justify-between">
                          <div>
                            <h3 className="text-2xl font-black">{maxRevDay.date}</h3>
                            <p className="text-emerald-50 font-medium text-sm mt-0.5">{formatPrice(maxRevDay.revenue)}</p>
                          </div>
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Highlight 2: Peak Orders */}
                  {(() => {
                    const maxOrdDay = [...data.dailyData].sort((a, b) => b.totalOrders - a.totalOrders)[0];
                    return maxOrdDay && maxOrdDay.totalOrders > 0 ? (
                      <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-5 text-white shadow-sm shadow-indigo-200">
                        <p className="text-indigo-100 text-[11px] font-bold uppercase tracking-wider mb-1">Highest Volume</p>
                        <div className="flex items-end justify-between">
                          <div>
                            <h3 className="text-2xl font-black">{maxOrdDay.date}</h3>
                            <p className="text-indigo-50 font-medium text-sm mt-0.5">{maxOrdDay.totalOrders} Orders</p>
                          </div>
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Highlight 3: Peak AOV */}
                  {(() => {
                    const maxAovDay = [...data.dailyData].sort((a, b) => b.aov - a.aov)[0];
                    return maxAovDay && maxAovDay.aov > 0 ? (
                      <div className="bg-gradient-to-br from-violet-500 to-violet-700 rounded-2xl p-5 text-white shadow-sm shadow-violet-200">
                        <p className="text-violet-100 text-[11px] font-bold uppercase tracking-wider mb-1">Highest AOV</p>
                        <div className="flex items-end justify-between">
                          <div>
                            <h3 className="text-2xl font-black">{maxAovDay.date}</h3>
                            <p className="text-violet-50 font-medium text-sm mt-0.5">{formatPrice(maxAovDay.aov)}</p>
                          </div>
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <IndianRupee className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Highlight 4: High RTO Alert */}
                  {(() => {
                    const maxRtoDay = [...data.dailyData].sort((a, b) => b.rtoRate - a.rtoRate)[0];
                    return maxRtoDay && maxRtoDay.rtoRate > 0 ? (
                      <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl p-5 text-white shadow-sm shadow-rose-200">
                        <p className="text-rose-100 text-[11px] font-bold uppercase tracking-wider mb-1">Highest RTO Alert</p>
                        <div className="flex items-end justify-between">
                          <div>
                            <h3 className="text-2xl font-black">{maxRtoDay.date}</h3>
                            <p className="text-rose-50 font-medium text-sm mt-0.5">{maxRtoDay.rtoRate}% ({maxRtoDay.rto} orders)</p>
                          </div>
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <RotateCcw className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Heatmap Column */}
                <div className="lg:col-span-2 bg-[#ffffff]/80 shadow-sm backdrop-blur-xl rounded-2xl border border-[#e2e8f0]/80 p-6 flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#e2e8f0]/80 pb-4">
                    <div>
                      <h3 className="text-[15px] font-bold text-[#0f172a]">Activity Heatmap</h3>
                      <p className="text-[12px] font-medium text-[#64748b]">Daily order volume intensity</p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-[#64748b] bg-[#f8fafc] px-3 py-1.5 rounded-lg border border-[#e2e8f0]/50">
                      <span>Less</span>
                      <div className="flex gap-1.5 mx-1">
                        <div className="w-3.5 h-3.5 rounded-[4px] bg-indigo-50 border border-indigo-100"></div>
                        <div className="w-3.5 h-3.5 rounded-[4px] bg-indigo-200"></div>
                        <div className="w-3.5 h-3.5 rounded-[4px] bg-indigo-400"></div>
                        <div className="w-3.5 h-3.5 rounded-[4px] bg-indigo-600"></div>
                        <div className="w-3.5 h-3.5 rounded-[4px] bg-indigo-800"></div>
                      </div>
                      <span>More</span>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center min-h-[200px]">
                    <div className="flex flex-wrap gap-2.5 max-w-full justify-center">
                      {(() => {
                        const maxOrders = Math.max(...data.dailyData.map((d: DaySummary) => d.totalOrders), 1);
                        
                        return data.dailyData.map((day: DaySummary) => {
                          const intensity = day.totalOrders / maxOrders;
                          let bgColor = 'bg-indigo-50 border border-indigo-100'; 
                          let textColor = 'text-indigo-900/40';
                          
                          if (intensity > 0) { bgColor = 'bg-indigo-200 border border-transparent'; textColor = 'text-indigo-900/60'; }
                          if (intensity > 0.25) { bgColor = 'bg-indigo-400 border border-transparent'; textColor = 'text-white/80'; }
                          if (intensity > 0.5) { bgColor = 'bg-indigo-600 border border-transparent'; textColor = 'text-white/90'; }
                          if (intensity > 0.75) { bgColor = 'bg-indigo-800 border border-transparent'; textColor = 'text-white'; }

                          const [dateNum] = day.date.split(' ');

                          return (
                            <div 
                              key={day.date}
                              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg ${bgColor} flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-indigo-400 transition-all group relative`}
                            >
                              <span className={`text-[12px] font-black ${textColor}`}>
                                {dateNum}
                              </span>
                              
                              {/* Enhanced Rich Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-60 bg-[#0f172a]/95 backdrop-blur-md text-white p-3.5 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-all shadow-2xl border border-white/10 scale-95 group-hover:scale-100 origin-bottom">
                                {/* Header: Date & Revenue */}
                                <div className="flex items-start justify-between border-b border-white/10 pb-2.5 mb-2.5">
                                  <div>
                                    <p className="font-black text-[14px] text-white leading-none mb-1">{day.date}</p>
                                    <p className="text-[#94a3b8] font-bold text-[10px]">{day.totalOrders} Orders</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-black text-[#10b981] text-[14px] leading-none mb-1">{formatPrice(day.revenue)}</p>
                                    <p className="text-[#94a3b8] font-bold text-[9px] uppercase">AOV: {formatPrice(day.aov)}</p>
                                  </div>
                                </div>

                                {/* Payment Split */}
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                  <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col items-center">
                                    <p className="text-[#94a3b8] text-[9px] font-bold uppercase tracking-wider mb-0.5">Prepaid</p>
                                    <p className="font-black text-[#60a5fa] text-[13px]">{day.paidOrders}</p>
                                  </div>
                                  <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col items-center">
                                    <p className="text-[#94a3b8] text-[9px] font-bold uppercase tracking-wider mb-0.5">COD</p>
                                    <p className="font-black text-[#fbbf24] text-[13px]">{day.codOrders}</p>
                                  </div>
                                  <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col items-center">
                                    <p className="text-[#94a3b8] text-[9px] font-bold uppercase tracking-wider mb-0.5">Amazon</p>
                                    <p className="font-black text-[#fb923c] text-[13px]">{day.amazonOrders || 0}</p>
                                  </div>
                                </div>

                                {/* Fulfillment & Issues */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[#94a3b8] font-bold">Delivered</span>
                                    <span className="font-black text-[#10b981]">{day.delivered}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[#94a3b8] font-bold">Shipped</span>
                                    <span className="font-black text-[#a78bfa]">{day.shipped}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[#94a3b8] font-bold">Cancelled</span>
                                    <span className={`font-black ${day.cancelled > 0 ? 'text-[#ef4444]' : 'text-white/50'}`}>
                                      {day.cancelled} {day.cancelled > 0 && <span className="text-[8px] opacity-80 ml-0.5">({day.cancellationRate}%)</span>}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-[#94a3b8] font-bold">RTO</span>
                                    <span className={`font-black ${day.rto > 0 ? 'text-[#f43f5e]' : 'text-white/50'}`}>
                                      {day.rto} {day.rto > 0 && <span className="text-[8px] opacity-80 ml-0.5">({day.rtoRate}%)</span>}
                                    </span>
                                  </div>
                                </div>

                                {/* Arrow pointer */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#0f172a]/95"></div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
