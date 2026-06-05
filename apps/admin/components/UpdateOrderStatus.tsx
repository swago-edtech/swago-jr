'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UpdateOrderStatusProps {
  orderId: string;
  currentStatus: string;
}

const statusOptions = [
  { value: 'Pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
  { value: 'Shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
  { value: 'Delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'Cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  { value: 'Failed', label: 'Failed', color: 'bg-red-100 text-red-800' },
  { value: 'Abandoned', label: 'Abandoned/Expired', color: 'bg-gray-100 text-gray-600' },
];

export default function UpdateOrderStatus({ orderId, currentStatus }: UpdateOrderStatusProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCodes, setGeneratedCodes] = useState<Array<{ productId: number; code: string }>>([]);
  const router = useRouter();

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;

    setLoading(true);
    setError('');
    setGeneratedCodes([]);

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setStatus(newStatus);

      // Show generated codes if any
      if (data.codesGenerated && data.codes) {
        setGeneratedCodes(data.codes);
      }

      router.refresh(); // Refresh the page data
    } catch (err: any) {
      setError(err.message);
      console.error('Status update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
        Update Status
      </label>
      <select
        id="status"
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={loading}
        className="block w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-medium"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value} className="text-gray-900">
            {option.label}
          </option>
        ))}
      </select>

      {loading && (
        <p className="text-sm text-blue-600">Updating status...</p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && status !== currentStatus && (
        <p className="text-sm text-green-600">✓ Status updated successfully</p>
      )}

      {/* Show generated codes */}
      {generatedCodes.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-semibold text-green-800 mb-2">
            🎉 Product Codes Generated!
          </h4>
          <p className="text-xs text-green-700 mb-3">
            Include these codes in the physical product boxes:
          </p>
          <div className="space-y-2">
            {generatedCodes.map((item, idx) => (
              <div key={idx} className="bg-white p-3 rounded border border-green-300">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Product ID: <strong>{item.productId}</strong>
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(item.code)}
                    className="text-xs text-blue-600 hover:underline"
                    title="Copy code"
                  >
                    Copy
                  </button>
                </div>
                <code className="block mt-1 text-lg font-mono font-bold text-green-800 tracking-wider">
                  {item.code}
                </code>
              </div>
            ))}
          </div>
          <p className="text-xs text-green-600 mt-3">
            💡 Tip: Print these codes and include them in the product packaging
          </p>
        </div>
      )}
    </div>
  );
}