'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@swago/utils';
import DateRangeFilter, { DateRange, getDefaultDateRange } from '@/components/DateRangeFilter';
import AnalyticsCard from '@/components/AnalyticsCard';
import { getLocationAnalytics, LocationAnalyticsData, LocationRow } from './actions';
import { exportToCSV } from '@/lib/exportCsv';
import { MapPin, ShoppingBag, IndianRupee, Truck, AlertTriangle, RotateCcw, Download } from 'lucide-react';

export default function LocationAnalyticsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [data, setData] = useState<LocationAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'city' | 'state'>('state');

  const fetchData = useCallback(async (range: DateRange) => {
    setLoading(true);
    try {
      const result = await getLocationAnalytics(range.from, range.to);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch location analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateRange);
  }, [dateRange, fetchData]);

  const rows = data ? (view === 'state' ? data.statesSummary : data.locations) : [];
  const riskyCount = rows.filter(r => r.isRisky).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Location Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Geographic performance, COD risk zones &amp; RTO hotspots</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(`location_${view}_analytics`, view === 'state' ? data?.statesSummary || [] : data?.locations || [])}
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
            <p className="text-sm text-gray-500">Loading location data...</p>
          </div>
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <AnalyticsCard title="Total Orders" value={data.totals.totalOrders} icon={ShoppingBag} color="bg-blue-500" />
            <AnalyticsCard title="Total Revenue" value={formatPrice(data.totals.totalRevenue)} icon={IndianRupee} color="bg-emerald-600" />
            <AnalyticsCard title="COD Orders" value={data.totals.totalCod} icon={Truck} color="bg-amber-500" />
            <AnalyticsCard title="RTO Orders" value={data.totals.totalRto} icon={RotateCcw} color="bg-rose-500" />
            <AnalyticsCard
              title="Risk Zones"
              value={riskyCount}
              subtitle="COD >60% + RTO >15%"
              icon={AlertTriangle}
              color={riskyCount > 0 ? 'bg-red-500' : 'bg-green-500'}
              textColor={riskyCount > 0 ? 'text-red-600' : 'text-green-600'}
            />
          </div>

          {/* Risk Alert */}
          {riskyCount > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {riskyCount} {view === 'state' ? 'state(s)' : 'city/cities'} flagged as COD risk zones
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    High COD percentage (&gt;60%) combined with high RTO rate (&gt;15%). Consider disabling COD or adding prepaid incentives for these areas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* View Toggle + Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                {view === 'state' ? 'State-wise' : 'City-wise'} Breakdown
              </h2>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setView('state')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    view === 'state' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  By State
                </button>
                <button
                  onClick={() => setView('city')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    view === 'city' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  By City
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      view === 'state' ? 'State' : 'City',
                      ...(view === 'city' ? ['State'] : []),
                      'Orders', 'Revenue', 'COD %', 'RTO %', 'Risk'
                    ].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.length === 0 ? (
                    <tr><td colSpan={view === 'city' ? 7 : 6} className="px-6 py-8 text-center text-gray-400 text-sm">No location data</td></tr>
                  ) : (
                    rows.map((r: LocationRow, i: number) => (
                      <tr
                        key={`${r.state}-${r.city}-${i}`}
                        className={`hover:bg-gray-50 transition-colors ${r.isRisky ? 'bg-red-50/50' : ''}`}
                      >
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">
                          {view === 'state' ? r.state : r.city}
                        </td>
                        {view === 'city' && (
                          <td className="px-5 py-3 text-sm text-gray-500">{r.state}</td>
                        )}
                        <td className="px-5 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{r.orders}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatPrice(r.revenue)}</td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full">
                              <div
                                className={`h-1.5 rounded-full ${r.codPercent > 60 ? 'bg-amber-500' : 'bg-blue-400'}`}
                                style={{ width: `${Math.min(100, r.codPercent)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold ${r.codPercent > 60 ? 'text-amber-600' : 'text-gray-600'}`}>
                              {r.codPercent}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full">
                              <div
                                className={`h-1.5 rounded-full ${r.rtoPercent > 15 ? 'bg-red-500' : 'bg-green-400'}`}
                                style={{ width: `${Math.min(100, r.rtoPercent)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold ${r.rtoPercent > 15 ? 'text-red-600' : 'text-gray-600'}`}>
                              {r.rtoPercent}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          {r.isRisky ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              RISKY
                            </span>
                          ) : (
                            <span className="text-xs text-green-600 font-medium">OK</span>
                          )}
                        </td>
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
