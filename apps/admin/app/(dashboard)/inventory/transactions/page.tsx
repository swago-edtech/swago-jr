"use client";

import React, { useState, useEffect } from "react";
import { Download, Search, Filter, ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default function TransactionsLog() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filterType) query.append("type", filterType);
      if (searchQuery) query.append("search", searchQuery);
      if (startDate) query.append("startDate", startDate);
      if (endDate) query.append("endDate", endDate);
      query.append("page", page.toString());
      query.append("limit", "20");
      
      const res = await fetch(`/api/inventory/transactions?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filterType, searchQuery, startDate, endDate, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterType, searchQuery, startDate, endDate]);

  const handleExport = () => {
    const csvRows = [];
    const headers = ["Date", "Item", "Type", "Quantity", "Previous Stock", "New Stock", "Reason", "User"];
    csvRows.push(headers.join(","));

    for (const tx of transactions) {
      csvRows.push([
        `"${new Date(tx.createdAt).toISOString()}"`,
        `"${tx.inventoryItemName || ""}"`,
        `"${tx.type || ""}"`,
        tx.quantity,
        tx.previousStock,
        tx.newStock,
        `"${tx.reason || ""}"`,
        `"${tx.performedBy || ""}"`
      ].join(","));
    }

    const csvData = csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Audit Log</h1>
          <p className="text-gray-500 mt-1">Complete history of all inventory stock movements</p>
        </div>
        <button 
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" /> Export View to CSV
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row flex-wrap gap-4 items-center justify-between">
        
        <div className="flex flex-wrap gap-4 items-center flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm text-black focus:ring-2 focus:ring-indigo-500 outline-none w-64 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm font-medium text-gray-700">
              <Filter className="w-4 h-4 mr-1.5 text-gray-400" /> Type:
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-black focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm bg-white"
            >
              <option value="">All Movements</option>
              <option value="addition">Additions</option>
              <option value="deduction">Deductions</option>
              <option value="adjustment">Adjustments</option>
              <option value="discard">Discards</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4 mr-1.5 text-gray-400" /> Dates:
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-black focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-black focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {loading ? (
          <div className="text-center py-16"><div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-4"></div><p className="text-gray-500 font-medium">Loading history...</p></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No transactions found matching your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Change</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason / Order</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {transactions.map((tx: any) => (
                  <tr key={tx._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                      {new Date(tx.createdAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 max-w-[150px] sm:max-w-xs md:max-w-sm truncate" title={tx.inventoryItemName}>
                      {tx.inventoryItemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full ${
                        tx.type === 'addition' ? 'bg-green-100 text-green-800 border border-green-200' :
                        tx.type === 'deduction' ? 'bg-red-100 text-red-800 border border-red-200' :
                        tx.type === 'discard' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                        'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-gray-900">
                      {tx.type === 'addition' ? '+' : tx.type === 'deduction' || tx.type === 'discard' ? '-' : ''}{tx.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-500">
                      {tx.previousStock} → {tx.newStock}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={tx.reason}>
                      {tx.reason || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.performedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">
              Showing page {page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
