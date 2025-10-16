'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UpdateOrderStatusProps {
  orderId: string;
  currentStatus: string;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

export default function UpdateOrderStatus({ orderId, currentStatus }: UpdateOrderStatusProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;

    setLoading(true);
    setError('');

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
      router.refresh(); // Refresh the page data
    } catch (err: any) {
      setError(err.message);
      console.error('Status update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentStatusConfig = statusOptions.find((opt) => opt.value === status);

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
        className="block w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
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
    </div>
  );
}