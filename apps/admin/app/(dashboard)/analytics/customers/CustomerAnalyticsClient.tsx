'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@swago/utils';
import DateRangeFilter, { DateRange, getDefaultDateRange } from '@/components/DateRangeFilter';
import AnalyticsCard from '@/components/AnalyticsCard';
import { getCustomerAnalytics, CustomerAnalyticsData, TopCustomer, CityCustomerRow } from './actions';
import { exportToCSV } from '@/lib/exportCsv';
import { Users, UserPlus, Repeat, TrendingUp, MapPin, Crown, Download } from 'lucide-react';

export default function CustomerAnalyticsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [data, setData] = useState<CustomerAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

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
          <p className="text-gray-500 text-sm mt-1">New vs repeat buyers, top spenders &amp; demographics</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV('top_customers', data?.topCustomers || [])}
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
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading customer data...</p>
          </div>
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnalyticsCard title="Total Customers" value={data.totalCustomers} icon={Users} color="bg-blue-500" />
            <AnalyticsCard title="New Customers" value={data.newCustomers} subtitle="First-time buyers" icon={UserPlus} color="bg-green-500" />
            <AnalyticsCard title="Repeat Customers" value={data.repeatCustomers} subtitle="Ordered 2+ times" icon={Repeat} color="bg-purple-500" />
            <AnalyticsCard
              title="Repeat Rate"
              value={`${data.repeatRate}%`}
              subtitle="Repeat ÷ total customers"
              icon={TrendingUp}
              color="bg-teal-600"
              textColor={data.repeatRate >= 20 ? 'text-teal-700' : 'text-amber-600'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 10 Customers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  Top 10 Spenders
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['#', 'Customer', 'Orders', 'Total Spend', 'Payment'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.topCustomers.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">No customer data</td></tr>
                    ) : (
                      data.topCustomers.map((c: TopCustomer, i: number) => (
                        <tr key={c.userId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'
                            }`}>
                              {i + 1}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{c.name}</div>
                            <div className="text-xs text-gray-400">{c.phone}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{c.orderCount}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-emerald-700">{formatPrice(c.totalSpend)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              c.paymentPreference === 'cod' ? 'bg-amber-100 text-amber-700'
                              : c.paymentPreference === 'mixed' ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                            }`}>
                              {c.paymentPreference === 'cod' ? 'COD' : c.paymentPreference === 'mixed' ? 'Mixed' : 'Prepaid'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Demographics */}
            <div className="space-y-6">
              {/* Age Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Age Distribution</h3>
                {data.ageDistribution.length > 0 ? (
                  <div className="space-y-3">
                    {data.ageDistribution.map(a => {
                      const maxCount = Math.max(...data.ageDistribution.map(d => d.count));
                      const width = maxCount > 0 ? Math.max(8, (a.count / maxCount) * 100) : 0;
                      return (
                        <div key={a.label} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-600 w-16">{a.label} yrs</span>
                          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full flex items-center justify-end pr-2 transition-all"
                              style={{ width: `${width}%` }}
                            >
                              {a.count > 0 && <span className="text-xs font-bold text-white">{a.count}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No age data available</p>
                )}
              </div>

              {/* Gender Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Gender Distribution</h3>
                {data.genderDistribution.length > 0 ? (
                  <div className="flex gap-4">
                    {data.genderDistribution.map(g => {
                      const total = data.genderDistribution.reduce((s, d) => s + d.count, 0);
                      const pct = total > 0 ? Math.round((g.count / total) * 100) : 0;
                      const colors: Record<string, string> = {
                        Boy: 'bg-blue-100 text-blue-700 border-blue-200',
                        Girl: 'bg-pink-100 text-pink-700 border-pink-200',
                        Other: 'bg-purple-100 text-purple-700 border-purple-200',
                        Unknown: 'bg-gray-100 text-gray-600 border-gray-200',
                      };
                      return (
                        <div key={g.label} className={`flex-1 rounded-xl border p-4 text-center ${colors[g.label] || colors.Unknown}`}>
                          <div className="text-2xl font-bold">{g.count}</div>
                          <div className="text-xs font-medium mt-0.5">{g.label}</div>
                          <div className="text-xs opacity-70 mt-0.5">{pct}%</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No gender data available</p>
                )}
              </div>
            </div>
          </div>

          {/* City-wise Customers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                City-wise Customers
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['City', 'State', 'Customers', 'Orders', 'Revenue'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.cityBreakdown.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">No city data</td></tr>
                  ) : (
                    data.cityBreakdown.slice(0, 20).map((c: CityCustomerRow) => (
                      <tr key={`${c.city}-${c.state}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{c.city}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{c.state}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">{c.customers}</td>
                        <td className="px-5 py-3 text-sm text-gray-700">{c.orders}</td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{formatPrice(c.revenue)}</td>
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
