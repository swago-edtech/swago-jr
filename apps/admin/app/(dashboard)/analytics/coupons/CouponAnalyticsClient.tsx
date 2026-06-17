'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@swago/utils';
import DateRangeFilter, { DateRange, getDefaultDateRange } from '@/components/DateRangeFilter';
import AnalyticsCard from '@/components/AnalyticsCard';
import { getCouponAnalytics, CouponAnalyticsData, CouponRow } from './actions';
import { exportToCSV } from '@/lib/exportCsv';
import { Ticket, Gift, TrendingUp, IndianRupee, Download } from 'lucide-react';

export default function CouponAnalyticsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [data, setData] = useState<CouponAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (range: DateRange) => {
    setLoading(true);
    try {
      const result = await getCouponAnalytics(range.from, range.to);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch coupon analytics:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Coupon Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Track promotional code usage and ROI</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV('coupon_performance', data?.coupons || [])}
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
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading coupon data...</p>
          </div>
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AnalyticsCard 
              title="Coupon Orders" 
              value={data.totals.totalOrdersWithCoupon} 
              icon={Ticket} 
              color="bg-orange-500" 
            />
            <AnalyticsCard 
              title="Discounts Given" 
              value={formatPrice(data.totals.totalDiscountGiven)} 
              icon={Gift} 
              color="bg-pink-500" 
            />
            <AnalyticsCard 
              title="Revenue Generated" 
              value={formatPrice(data.totals.totalRevenueFromCoupons)} 
              subtitle="Net revenue from orders using coupons"
              icon={TrendingUp} 
              color="bg-emerald-600" 
            />
          </div>

          {/* Coupon Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-gray-400" />
                Coupon Code Performance
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Coupon Code', 'Usage Count', 'Gross Value', 'Discount Given', 'Avg Discount %', 'Net Revenue'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.coupons.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">No coupons used in selected period</td></tr>
                  ) : (
                    data.coupons.map((c: CouponRow) => (
                      <tr key={c.code} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-bold text-orange-700 bg-orange-50 border border-orange-100 uppercase tracking-wider">
                            {c.code}
                          </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{c.usageCount}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600">{formatPrice(c.grossValue)}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-pink-600">−{formatPrice(c.discountGiven)}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">{c.avgDiscountPercent}%</td>
                        <td className="px-5 py-3 whitespace-nowrap text-sm font-bold text-emerald-700">{formatPrice(c.netRevenue)}</td>
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
