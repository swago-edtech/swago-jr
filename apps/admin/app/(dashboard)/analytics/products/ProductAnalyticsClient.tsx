'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@swago/utils';
import DateRangeFilter, { DateRange, getDefaultDateRange } from '@/components/DateRangeFilter';
import AnalyticsCard from '@/components/AnalyticsCard';
import { getProductAnalytics, ProductAnalyticsData, ProductSalesRow } from './actions';
import { exportToCSV } from '@/lib/exportCsv';
import { Package, ShoppingBag, CreditCard, Truck, IndianRupee, TrendingUp, RotateCcw, Download } from 'lucide-react';

export default function ProductAnalyticsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [data, setData] = useState<ProductAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
            <AnalyticsCard title="Products" value={data.products.length} icon={Package} color="bg-indigo-500" />
            <AnalyticsCard title="Total Orders" value={data.totals.totalOrders} icon={ShoppingBag} color="bg-blue-500" />
            <AnalyticsCard title="Qty Sold" value={data.totals.totalQty} icon={TrendingUp} color="bg-emerald-500" />
            <AnalyticsCard title="Paid Orders" value={data.totals.paidOrders} icon={CreditCard} color="bg-green-500" />
            <AnalyticsCard title="COD Orders" value={data.totals.codOrders} icon={Truck} color="bg-amber-500" />
            <AnalyticsCard title="Revenue" value={formatPrice(data.totals.totalRevenue)} icon={IndianRupee} color="bg-purple-500" textColor="text-purple-700" />
            <AnalyticsCard title="Net Revenue" value={formatPrice(data.totals.netRevenue)} icon={TrendingUp} color="bg-teal-600" textColor="text-teal-700" />
          </div>

          {/* Product Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                Product-wise Sales
                <span className="text-gray-400 font-normal text-sm ml-2">({data.products.length} products)</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['#', 'Product', 'Orders', 'Qty Sold', 'Paid', 'COD', 'Revenue', 'Refunds', 'Net Revenue'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.products.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-400 text-sm">
                        No product sales in selected period
                      </td>
                    </tr>
                  ) : (
                    data.products.map((p: ProductSalesRow, index: number) => (
                      <tr key={p.productId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 font-semibold text-xs">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 max-w-[200px] truncate" title={p.name}>
                            {p.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{p.orders}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-bold text-indigo-600">{p.qtySold}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600">{p.paidOrders}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-amber-600">{p.codOrders}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatPrice(p.revenue)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {p.refunds > 0 ? (
                            <span className="text-sm text-red-500">−{formatPrice(p.refunds)}</span>
                          ) : (
                            <span className="text-sm text-gray-300">₹0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-teal-700">{formatPrice(p.netRevenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {data.products.length > 0 && (
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr className="font-semibold">
                      <td className="px-4 py-3 text-sm text-gray-900" colSpan={2}>Total</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{data.totals.totalOrders}</td>
                      <td className="px-4 py-3 text-sm text-indigo-700">{data.totals.totalQty}</td>
                      <td className="px-4 py-3 text-sm text-blue-700">{data.totals.paidOrders}</td>
                      <td className="px-4 py-3 text-sm text-amber-700">{data.totals.codOrders}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(data.totals.totalRevenue)}</td>
                      <td className="px-4 py-3 text-sm text-red-600">−{formatPrice(data.totals.totalRefunds)}</td>
                      <td className="px-4 py-3 text-sm text-teal-700">{formatPrice(data.totals.netRevenue)}</td>
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
