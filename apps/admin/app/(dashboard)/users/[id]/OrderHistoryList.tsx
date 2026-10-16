'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@swago/utils';

const PAGE_SIZE = 5;

export interface OrderHistoryItem {
  _id: string;
  status?: string;
  createdAt?: string;
  total?: number;
}

// Paginates the already-loaded order list client-side (no extra queries).
export default function OrderHistoryList({ orders }: { orders: OrderHistoryItem[] }) {
  const [page, setPage] = useState(1);

  const total = orders.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleOrders = orders.slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = total === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + PAGE_SIZE, total);

  if (total === 0) {
    return <div className="px-6 py-8 text-center text-gray-500">No orders yet</div>;
  }

  return (
    <>
      <div className="divide-y divide-gray-200">
        {visibleOrders.map((order) => (
          <Link
            key={order._id}
            href={`/orders/${order._id}`}
            className="block px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    Order #{String(order._id).slice(-8)}
                  </span>
                  <StatusBadge status={order.status || 'pending'} />
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {formatPrice(order.total || 0)}
                </div>
                <div className="text-xs text-blue-600 mt-1">View Details →</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium text-gray-900">{showingFrom}</span>–
            <span className="font-medium text-gray-900">{showingTo}</span> of{' '}
            <span className="font-medium text-gray-900">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-600 whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
    shipped: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Shipped' },
    delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
