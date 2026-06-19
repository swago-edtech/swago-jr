'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@swago/utils';
import DateRangeFilter, { DateRange, getDefaultDateRange } from '@/components/DateRangeFilter';
import { getRevenueAnalytics, RevenueBreakdown } from './actions';
import { exportToCSV } from '@/lib/exportCsv';
import { IndianRupee, TrendingUp, ArrowLeftRight, CreditCard, Truck, RotateCcw, XCircle, Gift, Package, Download } from 'lucide-react';
import AnalyticsCard from '@/components/AnalyticsCard';
import RevenueAnalyticsCharts from './RevenueAnalyticsCharts';

export default function RevenueAnalyticsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [data, setData] = useState<RevenueBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (range: DateRange) => {
    setLoading(true);
    try {
      const result = await getRevenueAnalytics(range.from, range.to);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch revenue analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateRange);
  }, [dateRange, fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue Analytics</h1>
            <p className="text-gray-500 text-sm mt-1">Detailed revenue breakdown &amp; reconciliation</p>
          </div>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading revenue data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const revenueRows = [
    { label: 'Gross Revenue', value: data.grossRevenue, description: 'Total order value before cancellation/refund', color: 'text-gray-900', icon: IndianRupee, bg: 'bg-gray-50' },
    { label: 'Paid Revenue', value: data.paidRevenue, description: 'Prepaid successful payments (Razorpay)', color: 'text-blue-700', icon: CreditCard, bg: 'bg-blue-50' },
    { label: 'COD Revenue (Placed)', value: data.codRevenuePlaced, description: 'COD order value (expected, NOT collected)', color: 'text-amber-700', icon: Truck, bg: 'bg-amber-50' },
    { label: 'COD Revenue (Collected)', value: data.codRevenueCollected, description: 'COD money actually collected after delivery', color: 'text-green-700', icon: Package, bg: 'bg-green-50' },
    { label: 'Pending COD', value: data.pendingCod, description: 'COD orders not yet delivered/collected', color: 'text-yellow-700', icon: ArrowLeftRight, bg: 'bg-yellow-50' },
    { label: 'GST Collected', value: data.gstCollected, description: 'Tax collected on confirmed orders', color: 'text-indigo-700', icon: IndianRupee, bg: 'bg-indigo-50' },
    { label: 'Delivered Revenue', value: data.deliveredRevenue, description: 'Revenue from delivered orders only', color: 'text-emerald-700', icon: TrendingUp, bg: 'bg-emerald-50' },
  ];

  const deductionRows = [
    { label: 'Cancelled Revenue', value: data.cancelledRevenue, description: 'Revenue lost from cancellations', color: 'text-red-600', icon: XCircle },
    { label: 'RTO Loss', value: data.rtoLoss, description: 'COD orders returned/not accepted', color: 'text-rose-600', icon: RotateCcw },
    { label: 'Refunds', value: data.refunds, description: 'Amount refunded to customers', color: 'text-purple-600', icon: ArrowLeftRight },
    { label: 'Discounts Given', value: data.discountsGiven, description: 'Coupon discounts applied', color: 'text-orange-600', icon: Gift },
    { label: 'Swago Money Redeemed', value: data.swagoMoneyRedeemed, description: 'Loyalty points redeemed by customers', color: 'text-indigo-600', icon: Gift },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Detailed revenue breakdown &amp; reconciliation</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => exportToCSV('revenue_breakdown', [...revenueRows, ...deductionRows, { label: 'Net Revenue', value: data.netRevenue, description: '' }])}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnalyticsCard title="Gross Revenue" value={formatPrice(data.grossRevenue)} icon={IndianRupee} color="bg-gray-500" />
        <AnalyticsCard title="Delivered Revenue" value={formatPrice(data.deliveredRevenue)} icon={TrendingUp} color="bg-emerald-600" textColor="text-emerald-700" />
        <AnalyticsCard title="Net Revenue" value={formatPrice(data.netRevenue)} icon={TrendingUp} color="bg-teal-600" textColor="text-teal-700" />
        <AnalyticsCard title="Shipping Collected" value={formatPrice(data.shippingCollected)} icon={Truck} color="bg-violet-500" />
      </div>

      {/* Revenue Trend & Leakage Charts */}
      <RevenueAnalyticsCharts dailyTrends={data.dailyTrends} data={data} />

      {/* Revenue Breakdown Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Revenue Breakdown</h2>
          <p className="text-xs text-gray-400 mt-0.5">COD Placed ≠ COD Collected — do not mix these numbers</p>
        </div>
        <div className="divide-y divide-gray-100">
          {/* Revenue rows */}
          {revenueRows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className={`flex items-center justify-between px-6 py-4 ${row.bg || ''}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{row.label}</div>
                    <div className="text-xs text-gray-400">{row.description}</div>
                  </div>
                </div>
                <div className={`text-lg font-bold ${row.color}`}>
                  {formatPrice(row.value)}
                </div>
              </div>
            );
          })}

          {/* Separator */}
          <div className="px-6 py-2 bg-red-50">
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Deductions</span>
          </div>

          {/* Deduction rows */}
          {deductionRows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Icon className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{row.label}</div>
                    <div className="text-xs text-gray-400">{row.description}</div>
                  </div>
                </div>
                <div className={`text-lg font-bold ${row.color}`}>
                  {row.value > 0 ? `−${formatPrice(row.value)}` : formatPrice(0)}
                </div>
              </div>
            );
          })}

          {/* Net Revenue */}
          <div className="flex items-center justify-between px-6 py-5 bg-teal-50 border-t-2 border-teal-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-base font-bold text-gray-900">Net Revenue</div>
                <div className="text-xs text-gray-500">Delivered − Refunds − RTO Loss</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-teal-700">
              {formatPrice(data.netRevenue)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
