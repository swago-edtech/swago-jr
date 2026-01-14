"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Batch = {
  _id: string;
  batchNumber: string;
  productId: {
    _id: string;
    name: string;
  };
  productName: string;
  shortForm: string;
  quantity: number;
  status: "pending" | "downloaded" | "sent_for_printing" | "printed";
  generatedAt: string;
  generatedBy: string;
  downloadedAt?: string;
  sentForPrintingAt?: string;
  printedAt?: string;
};

type Summary = {
  total: number;
  pending: number;
  downloaded: number;
  sent_for_printing: number;
  printed: number;
  totalCodes: number;
};

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  downloaded: "bg-blue-100 text-blue-800 border-blue-300",
  sent_for_printing: "bg-purple-100 text-purple-800 border-purple-300",
  printed: "bg-green-100 text-green-800 border-green-300",
};

const STATUS_LABELS = {
  pending: "Pending",
  downloaded: "Downloaded",
  sent_for_printing: "Sent for Printing",
  printed: "Printed",
};

export default function LotteryBatchesPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    pending: 0,
    downloaded: 0,
    sent_for_printing: 0,
    printed: 0,
    totalCodes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch batches
  const fetchBatches = async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/api/lottery-batches?status=${statusFilter}`
        : "/api/lottery-batches";

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setBatches(data.batches);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [statusFilter]);

  // Download CSV
  const handleDownload = async (batchId: string, batchNumber: string) => {
    try {
      const res = await fetch(`/api/lottery-batches/${batchId}/download`);

      if (res.ok) {
        // Trigger download
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${batchNumber}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        // Refresh batches to show updated status
        fetchBatches();
        alert("CSV downloaded successfully!");
      } else {
        const data = await res.json();
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Failed to download CSV");
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lottery Code Batches</h1>
          <p className="text-gray-600 mt-1">Manage and track lottery code batches</p>
        </div>
        <button
          onClick={() => router.push("/lottery-generator")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold shadow-lg"
        >
          + Generate New Batch
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-gray-400">
          <p className="text-sm text-gray-600">Total Batches</p>
          <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-yellow-400">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{summary.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-blue-400">
          <p className="text-sm text-gray-600">Downloaded</p>
          <p className="text-3xl font-bold text-blue-600">{summary.downloaded}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-purple-400">
          <p className="text-sm text-gray-600">Sent for Printing</p>
          <p className="text-3xl font-bold text-purple-600">{summary.sent_for_printing}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-green-400">
          <p className="text-sm text-gray-600">Printed</p>
          <p className="text-3xl font-bold text-green-600">{summary.printed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="downloaded">Downloaded</option>
            <option value="sent_for_printing">Sent for Printing</option>
            <option value="printed">Printed</option>
          </select>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter("")}
              className="text-sm text-blue-600 hover:underline"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading batches...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No batches found</p>
            <p className="text-gray-500 text-sm mt-1">
              {statusFilter ? "Try changing the filter" : "Generate your first batch to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Batch Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Short Form
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {batches.map((batch) => (
                  <tr key={batch._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/lottery-batches/${batch._id}`)}
                        className="font-mono text-sm font-semibold text-blue-600 hover:underline"
                      >
                        {batch.batchNumber}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {batch.productName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded font-mono text-xs font-semibold">
                        {batch.shortForm}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                      {batch.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[batch.status]}`}>
                        {STATUS_LABELS[batch.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(batch.generatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/lottery-batches/${batch._id}`)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          title="View Details"
                        >
                          View
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDownload(batch._id, batch.batchNumber)}
                          className="text-green-600 hover:text-green-800 font-medium text-sm"
                          title="Download CSV"
                        >
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Total Codes Info */}
      {summary.totalCodes > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Total Codes Generated:</span>{" "}
            {summary.totalCodes.toLocaleString()} lottery codes across all batches
          </p>
        </div>
      )}
    </div>
  );
}
