'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@swago/utils';
import DateRangeFilter, { DateRange, getDefaultDateRange } from '@/components/DateRangeFilter';
import ChannelFilterTabs, { useAnalyticsChannel } from '@/components/ChannelFilterTabs';
import AnalyticsCard from '@/components/AnalyticsCard';
import { getPaymentAnalytics, PaymentAnalyticsData } from './actions';
import { exportToCSV } from '@/lib/exportCsv';
import { CreditCard, Truck, ShoppingBag, IndianRupee, RotateCcw, ArrowRight, Download, Store } from 'lucide-react';
import PaymentAnalyticsCharts from './PaymentAnalyticsCharts';

export default function PaymentAnalyticsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const { channel, selectChannel } = useAnalyticsChannel();
  const [data, setData] = useState<PaymentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const showWebsite = channel === 'all' || channel === 'website';
  const showAmazon = channel === 'all' || channel === 'amazon';
  const showFlipkart = channel === 'all' || channel === 'flipkart';

  const fetchData = useCallback(async (range: DateRange, selectedChannel: typeof channel) => {
    setLoading(true);
    try {
      const result = await getPaymentAnalytics(range.from, range.to, selectedChannel);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch payment analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateRange, channel);
  }, [dateRange, channel, fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Method Report</h1>
          <p className="text-gray-500 text-sm mt-1">
            {channel === 'amazon'
              ? 'Amazon marketplace order volume & estimated revenue'
              : channel === 'flipkart'
                ? 'Flipkart marketplace order volume & estimated revenue'
                : channel === 'website'
                  ? 'Razorpay vs COD performance & COD lifecycle funnel'
                  : 'Website payments + Amazon/Flipkart marketplace'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ChannelFilterTabs value={channel} onChange={selectChannel} accentClass="text-blue-600" />
          <button
            onClick={() => exportToCSV('payment_methods', data?.methods || [])}
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
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading payment data...</p>
          </div>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnalyticsCard title="Total Orders" value={data.totals.totalOrders} icon={ShoppingBag} color="bg-blue-500" />
            <AnalyticsCard title="Total Revenue" value={formatPrice(data.totals.totalRevenue)} icon={IndianRupee} color="bg-indigo-500" />
            {showWebsite && (
              <>
                <AnalyticsCard
                  title="COD Orders"
                  value={data.codFunnel.placed}
                  subtitle={`${data.codFunnel.rto} RTO (${data.codFunnel.placed > 0 ? Math.round((data.codFunnel.rto / data.codFunnel.placed) * 100) : 0}%)`}
                  icon={Truck}
                  color="bg-amber-500"
                />
                <AnalyticsCard
                  title="COD Loss"
                  value={formatPrice(data.codFunnel.loss)}
                  subtitle="Revenue lost to RTO"
                  icon={RotateCcw}
                  color="bg-rose-500"
                  textColor="text-rose-600"
                />
              </>
            )}
            {showAmazon && !showWebsite && (
              <AnalyticsCard
                title="Amazon Orders"
                value={data.methods.find((m) => m.method === 'amazon')?.orders || 0}
                icon={Store}
                color="bg-orange-500"
              />
            )}
            {showFlipkart && !showWebsite && (
              <AnalyticsCard
                title="Flipkart Orders"
                value={data.methods.find((m) => m.method === 'flipkart')?.orders || 0}
                icon={Store}
                color="bg-yellow-500"
              />
            )}
          </div>

          <PaymentAnalyticsCharts
            dailyTrends={data.dailyTrends}
            methods={data.methods}
            channel={channel}
          />

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Payment Method Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Payment Method', 'Orders', 'Revenue', 'Delivered / Confirmed', 'Cancelled', 'RTO', 'Success Rate'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.methods.map((m) => (
                    <tr key={m.method} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {m.method === 'cod' ? (
                            <Truck className="w-4 h-4 text-amber-500" />
                          ) : m.method === 'amazon' || m.method === 'flipkart' ? (
                            <Store
                              className={`w-4 h-4 ${m.method === 'amazon' ? 'text-orange-500' : 'text-yellow-500'}`}
                            />
                          ) : (
                            <CreditCard className="w-4 h-4 text-blue-500" />
                          )}
                          <span className="text-sm font-medium text-gray-900">{m.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {m.orders}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(m.revenue)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">
                        {m.delivered}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-red-500">{m.cancelled}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-rose-600 font-medium">{m.rto}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full max-w-[80px]">
                            <div
                              className={`h-2 rounded-full ${m.successRate >= 80 ? 'bg-green-500' : m.successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(100, m.successRate)}%` }}
                            />
                          </div>
                          <span
                            className={`text-sm font-bold ${m.successRate >= 80 ? 'text-green-600' : m.successRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}
                          >
                            {m.successRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {showWebsite && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">COD Lifecycle Funnel</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Track every website COD order from placement to cash collection
                </p>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {[
                    { label: 'Placed', value: data.codFunnel.placed, color: 'bg-gray-100 text-gray-700' },
                    { label: 'Confirmed', value: data.codFunnel.confirmed, color: 'bg-blue-50 text-blue-700' },
                    { label: 'Shipped', value: data.codFunnel.shipped, color: 'bg-purple-50 text-purple-700' },
                    { label: 'Delivered', value: data.codFunnel.delivered, color: 'bg-green-50 text-green-700' },
                    { label: 'Collected', value: data.codFunnel.collected, color: 'bg-emerald-50 text-emerald-700' },
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-2">
                      <div className={`${step.color} rounded-xl px-4 py-3 text-center min-w-[100px]`}>
                        <div className="text-2xl font-bold">{step.value}</div>
                        <div className="text-xs font-medium mt-0.5">{step.label}</div>
                      </div>
                      {i < 4 && <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-center gap-6">
                  <div className="bg-rose-50 text-rose-700 rounded-xl px-4 py-3 text-center min-w-[100px]">
                    <div className="text-2xl font-bold">{data.codFunnel.rto}</div>
                    <div className="text-xs font-medium mt-0.5">RTO</div>
                  </div>
                  <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-center min-w-[120px]">
                    <div className="text-2xl font-bold">{formatPrice(data.codFunnel.loss)}</div>
                    <div className="text-xs font-medium mt-0.5">Revenue Loss</div>
                  </div>
                  {data.codFunnel.placed > 0 && (
                    <div className="bg-gray-50 text-gray-700 rounded-xl px-4 py-3 text-center min-w-[100px]">
                      <div className="text-2xl font-bold">
                        {Math.round((data.codFunnel.rto / data.codFunnel.placed) * 100)}%
                      </div>
                      <div className="text-xs font-medium mt-0.5">RTO Rate</div>
                    </div>
                  )}
                </div>

                {data.codFunnel.placed > 0 && (
                  <div className="mt-6 grid grid-cols-3 gap-4 max-w-md mx-auto">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        {Math.round((data.codFunnel.delivered / data.codFunnel.placed) * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">Delivery Rate</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-emerald-700">
                        {data.codFunnel.delivered > 0
                          ? Math.round((data.codFunnel.collected / data.codFunnel.delivered) * 100)
                          : 0}
                        %
                      </div>
                      <div className="text-xs text-gray-500">Collection Rate</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-rose-600">
                        {Math.round((data.codFunnel.rto / data.codFunnel.placed) * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">RTO Rate</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
