"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

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
  downloadedBy?: string;
  sentForPrintingAt?: string;
  sentForPrintingBy?: string;
  printedAt?: string;
  printedBy?: string;
  notes?: string;
};

type LotteryCode = {
  _id: string;
  code: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
};

type CodeStats = {
  total: number;
  used: number;
  unused: number;
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

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [codes, setCodes] = useState<LotteryCode[]>([]);
  const [codeStats, setCodeStats] = useState<CodeStats>({ total: 0, used: 0, unused: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showAllCodes, setShowAllCodes] = useState(false);

  // Fetch batch details
  const fetchBatchDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/lottery-batches/${batchId}`);
      const data = await res.json();

      if (data.success) {
        setBatch(data.batch);
        setCodes(data.codes);
        setCodeStats(data.codeStats);
      } else {
        alert("Error: " + data.error);
        router.push("/lottery-batches");
      }
    } catch (error) {
      console.error("Error fetching batch:", error);
      alert("Failed to fetch batch details");
      router.push("/lottery-batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchDetail();
  }, [batchId]);

  // Download CSV
  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/lottery-batches/${batchId}/download`);

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${batch?.batchNumber}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        // Refresh to show updated status
        fetchBatchDetail();
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

  // Update status
  const handleUpdateStatus = async (newStatus: string) => {
    if (!confirm(`Change status to "${STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS]}"?`)) {
      return;
    }

    setUpdatingStatus(true);

    try {
      const res = await fetch(`/api/lottery-batches/${batchId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Status updated successfully!");
        fetchBatchDetail();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get available status transitions
  const getAvailableTransitions = (currentStatus: string) => {
    const transitions: { [key: string]: string[] } = {
      pending: ["downloaded", "sent_for_printing"],
      downloaded: ["sent_for_printing", "printed"],
      sent_for_printing: ["printed"],
      printed: [],
    };
    return transitions[currentStatus] || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Batch not found</p>
        <button
          onClick={() => router.push("/lottery-batches")}
          className="mt-4 text-blue-600 hover:underline"
        >
          ← Back to Batches
        </button>
      </div>
    );
  }

  const displayedCodes = showAllCodes ? codes : codes.slice(0, 50);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push("/lottery-batches")}
            className="text-blue-600 hover:underline text-sm mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Batches
          </button>
          <h1 className="text-3xl font-bold text-gray-900 font-mono">{batch.batchNumber}</h1>
          <p className="text-gray-600 mt-1">{batch.productName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-lg text-sm font-semibold border ${STATUS_COLORS[batch.status]}`}>
            {STATUS_LABELS[batch.status]}
          </span>
          <button
            onClick={handleDownload}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium"
          >
            📥 Download CSV
          </button>
        </div>
      </div>

      {/* Batch Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Product</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{batch.productName}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Short Form</p>
          <p className="text-lg font-mono font-bold text-gray-900 mt-1">{batch.shortForm}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Codes</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{batch.quantity.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Generated By</p>
          <p className="text-lg font-medium text-gray-900 mt-1">{batch.generatedBy}</p>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Status Timeline</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-32 text-sm font-medium text-gray-700">Generated:</div>
            <div className="flex-1 text-sm text-gray-900">
              {formatDate(batch.generatedAt)} by {batch.generatedBy}
            </div>
          </div>
          {batch.downloadedAt && (
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-gray-700">Downloaded:</div>
              <div className="flex-1 text-sm text-gray-900">
                {formatDate(batch.downloadedAt)} by {batch.downloadedBy}
              </div>
            </div>
          )}
          {batch.sentForPrintingAt && (
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-gray-700">Sent for Printing:</div>
              <div className="flex-1 text-sm text-gray-900">
                {formatDate(batch.sentForPrintingAt)} by {batch.sentForPrintingBy}
              </div>
            </div>
          )}
          {batch.printedAt && (
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-gray-700">Printed:</div>
              <div className="flex-1 text-sm text-gray-900">
                {formatDate(batch.printedAt)} by {batch.printedBy}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Actions */}
      {getAvailableTransitions(batch.status).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Update Status</h2>
          <div className="flex items-center gap-3">
            {getAvailableTransitions(batch.status).map((status) => (
              <button
                key={status}
                onClick={() => handleUpdateStatus(status)}
                disabled={updatingStatus}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                Mark as {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Code Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-gray-400">
          <p className="text-sm text-gray-600">Total Codes</p>
          <p className="text-3xl font-bold text-gray-900">{codeStats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-green-400">
          <p className="text-sm text-gray-600">Redeemed</p>
          <p className="text-3xl font-bold text-green-600">{codeStats.used}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-orange-400">
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-3xl font-bold text-orange-600">{codeStats.unused}</p>
        </div>
      </div>

      {/* Codes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Lottery Codes</h2>
          {codes.length > 50 && (
            <button
              onClick={() => setShowAllCodes(!showAllCodes)}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              {showAllCodes ? "Show Less" : `Show All (${codes.length})`}
            </button>
          )}
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Redeemed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedCodes.map((code, index) => (
                <tr key={code._id} className={code.isUsed ? "bg-green-50" : ""}>
                  <td className="px-6 py-3 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-3 text-sm font-mono font-semibold text-gray-900">
                    {code.code}
                  </td>
                  <td className="px-6 py-3">
                    {code.isUsed ? (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                        Redeemed
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                        Available
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {code.usedAt ? formatDate(code.usedAt) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!showAllCodes && codes.length > 50 && (
          <div className="bg-gray-50 px-6 py-3 text-center text-sm text-gray-600 border-t">
            Showing 50 of {codes.length} codes
          </div>
        )}
      </div>
    </div>
  );
}
