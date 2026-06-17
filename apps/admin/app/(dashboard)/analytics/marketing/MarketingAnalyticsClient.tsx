'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@swago/utils';
import DateRangeFilter, { DateRange, getDefaultDateRange } from '@/components/DateRangeFilter';
import AnalyticsCard from '@/components/AnalyticsCard';
import { getMarketingAnalytics, MarketingAnalyticsData, MarketingRow } from './actions';
import { exportToCSV } from '@/lib/exportCsv';
import { Megaphone, MousePointerClick, TrendingUp, IndianRupee, Download } from 'lucide-react';

export default function MarketingAnalyticsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [data, setData] = useState<MarketingAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (range: DateRange) => {
    setLoading(true);
    try {
      const result = await getMarketingAnalytics(range.from, range.to);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch marketing analytics:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Marketing Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Track campaign performance and ROAS via UTM parameters</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV('marketing_campaigns', data?.campaigns || [])}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading marketing data...</p>
          </div>
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnalyticsCard 
              title="Attributed Orders" 
              value={data.totals.totalOrders} 
              icon={MousePointerClick} 
              color="bg-blue-500" 
            />
            <AnalyticsCard 
              title="Attributed Revenue" 
              value={formatPrice(data.totals.totalRevenue)} 
              icon={TrendingUp} 
              color="bg-emerald-600" 
            />
          </div>

          {/* Campaign Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-gray-400" />
                Campaign Performance
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Source (UTM)', 'Medium', 'Campaign', 'Orders', 'Revenue', 'AOV'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.campaigns.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">No campaign data found</td></tr>
                  ) : (
                    data.campaigns.map((c: MarketingRow, i: number) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100">
                            {c.source}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{c.medium}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{c.campaign}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{c.orders}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-emerald-700">{formatPrice(c.revenue)}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(c.aov)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
