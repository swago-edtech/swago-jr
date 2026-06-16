'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@swago/utils';
import AnalyticsCard from '@/components/AnalyticsCard';
import { getInventoryAnalytics, InventoryAnalyticsData, InventoryRow } from './actions';
import { exportToCSV } from '@/lib/exportCsv';
import { Package, AlertTriangle, XCircle, IndianRupee, Layers, Download } from 'lucide-react';

export default function InventoryAnalyticsClient() {
  const [data, setData] = useState<InventoryAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getInventoryAnalytics();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch inventory analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProducts = data?.products.filter(p => statusFilter === 'all' || p.status === statusFilter) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Health</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time stock value, out-of-stock &amp; low stock alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV('inventory_health', data?.products || [])}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading inventory data...</p>
          </div>
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <AnalyticsCard 
              title="Total Products" 
              value={data.totals.totalProducts} 
              icon={Package} 
              color="bg-blue-500" 
            />
            <AnalyticsCard 
              title="Items in Stock" 
              value={data.totals.totalAvailableItems} 
              icon={Layers} 
              color="bg-emerald-500" 
            />
            <AnalyticsCard 
              title="Stock Value" 
              value={formatPrice(data.totals.totalStockValue)} 
              icon={IndianRupee} 
              color="bg-indigo-500" 
              textColor="text-indigo-700"
            />
            <AnalyticsCard 
              title="Low Stock" 
              value={data.totals.lowStockCount} 
              subtitle="Below threshold"
              icon={AlertTriangle} 
              color="bg-amber-500" 
              textColor={data.totals.lowStockCount > 0 ? 'text-amber-600' : 'text-gray-500'}
            />
            <AnalyticsCard 
              title="Out of Stock" 
              value={data.totals.outOfStockCount} 
              subtitle="0 available"
              icon={XCircle} 
              color="bg-red-500" 
              textColor={data.totals.outOfStockCount > 0 ? 'text-red-600' : 'text-gray-500'}
            />
          </div>

          {/* Alerts Banner */}
          {(data.totals.outOfStockCount > 0 || data.totals.lowStockCount > 0) && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${data.totals.outOfStockCount > 0 ? 'bg-red-50 border-l-4 border-red-400' : 'bg-amber-50 border-l-4 border-amber-400'}`}>
              {data.totals.outOfStockCount > 0 ? (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-bold ${data.totals.outOfStockCount > 0 ? 'text-red-800' : 'text-amber-800'}`}>
                  Inventory Action Required
                </p>
                <p className={`text-xs mt-0.5 ${data.totals.outOfStockCount > 0 ? 'text-red-600' : 'text-amber-700'}`}>
                  {data.totals.outOfStockCount} products are out of stock and {data.totals.lowStockCount} products are running low. Restock to prevent revenue loss.
                </p>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                Product Stock Report
              </h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Products</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="In Stock">In Stock</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Product', 'Category', 'Status', 'Available Stock', 'Sold Today', 'Sold This Month', 'Price', 'Stock Value'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">No products found matching the filter</td></tr>
                  ) : (
                    filteredProducts.map((p: InventoryRow) => (
                      <tr key={p.productId} className={`hover:bg-gray-50 transition-colors ${p.status === 'Out of Stock' ? 'bg-red-50/30' : p.status === 'Low Stock' ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="text-sm font-medium text-gray-900">{p.name}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{p.category}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                            p.status === 'Out of Stock' ? 'bg-red-100 text-red-700' :
                            p.status === 'Low Stock' ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {p.status === 'Out of Stock' && <XCircle className="w-3 h-3" />}
                            {p.status === 'Low Stock' && <AlertTriangle className="w-3 h-3" />}
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className={`text-sm font-bold ${
                              p.availableStock === 0 ? 'text-red-600' :
                              p.status === 'Low Stock' ? 'text-amber-600' : 'text-gray-900'
                            }`}>
                              {p.availableStock}
                            </span>
                            {p.reservedStock > 0 && (
                              <span className="text-xs text-gray-400">
                                {p.reservedStock} reserved
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{p.soldToday}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{p.soldThisMonth}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{formatPrice(p.price)}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-indigo-700">{formatPrice(p.stockValue)}</td>
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
