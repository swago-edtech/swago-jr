'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@swago/utils';
import DateRangeFilter, { DateRange, getDefaultDateRange } from '@/components/DateRangeFilter';
import OrderAnalyticsCharts from '@/components/OrderAnalyticsCharts';
import AnalyticsCard from '@/components/AnalyticsCard';
import { getOrderAnalytics, OrderAnalyticsData, DaySummary } from './actions';
import { exportToCSV } from '@/lib/exportCsv';
import { ShoppingBag, CreditCard, Truck, PackageCheck, XCircle, RotateCcw, IndianRupee, TrendingUp, Download } from 'lucide-react';

export default function OrderAnalyticsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [data, setData] = useState<OrderAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (range: DateRange) => {
    setLoading(true);
    try {
      const result = await getOrderAnalytics(range.from, range.to);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch order analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateRange);
  }, [dateRange, fetchData]);

  const handleDateChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Track orders by date, payment method &amp; status</p>
        </div>
        <div className="flex items-center gap-3">
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
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            <AnalyticsCard
              title="Total Orders"
              value={data.totals.totalOrders}
              icon={ShoppingBag}
              color="bg-blue-500"
            />
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
              title="Cancelled"
              value={data.totals.cancelled}
              icon={XCircle}
              color="bg-red-500"
            />
            <AnalyticsCard
              title="RTO"
              value={data.totals.rto}
              icon={RotateCcw}
              color="bg-rose-500"
            />
            <AnalyticsCard
              title="Total Revenue"
              value={formatPrice(data.totals.totalRevenue)}
              icon={IndianRupee}
              color="bg-indigo-500"
              textColor="text-indigo-700"
            />
            <AnalyticsCard
              title="AOV"
              value={data.totals.delivered > 0 ? formatPrice(data.totals.deliveredRevenue / data.totals.delivered) : '₹0'}
              icon={TrendingUp}
              color="bg-violet-500"
            />
          </div>

          {/* Charts */}
          <OrderAnalyticsCharts
            dailyData={data.dailyData}
            totals={data.totals}
          />

          {/* Day-wise Order Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Day-wise Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Date', 'Total', 'Paid', 'COD', 'Shipped', 'Delivered', 'Cancelled', 'RTO', 'Revenue'].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.dailyData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-400 text-sm">
                        No orders in selected period
                      </td>
                    </tr>
                  ) : (
                    data.dailyData.map((day: DaySummary) => (
                      <tr key={day.date} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {day.date}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {day.totalOrders}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-blue-600">{day.paidOrders}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-amber-600">{day.codOrders}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-purple-600">{day.shipped}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-emerald-600">{day.delivered}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {day.cancelled > 0 ? (
                            <span className="text-sm font-medium text-red-500">{day.cancelled}</span>
                          ) : (
                            <span className="text-sm text-gray-300">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {day.rto > 0 ? (
                            <span className="text-sm font-semibold text-rose-600">{day.rto}</span>
                          ) : (
                            <span className="text-sm text-gray-300">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {day.revenue > 0 ? formatPrice(day.revenue) : (
                            <span className="text-gray-300">₹0</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* Table Footer with Totals */}
                {data.dailyData.length > 0 && (
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr className="font-semibold">
                      <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{data.totals.totalOrders}</td>
                      <td className="px-4 py-3 text-sm text-blue-700">{data.totals.paidOrders}</td>
                      <td className="px-4 py-3 text-sm text-amber-700">{data.totals.codOrders}</td>
                      <td className="px-4 py-3 text-sm text-purple-700">{data.totals.shipped}</td>
                      <td className="px-4 py-3 text-sm text-emerald-700">{data.totals.delivered}</td>
                      <td className="px-4 py-3 text-sm text-red-600">{data.totals.cancelled}</td>
                      <td className="px-4 py-3 text-sm text-rose-700">{data.totals.rto}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(data.totals.totalRevenue)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
