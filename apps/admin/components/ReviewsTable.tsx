'use client';

import { useState } from 'react';
import Link from 'next/link';
import { products } from '@swago/utils';

interface Review {
  _id: string;
  productId: number;
  rating: number;
  title: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  sentimentLabel: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  sentimentScore: number;
  createdAt: string;
  userId: {
    _id: string;
    name?: string;
    phone: string;
    email?: string;
  };
}

interface ReviewsTableProps {
  initialReviews: Review[];
}

export default function ReviewsTable({ initialReviews }: ReviewsTableProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Get product name by ID
  const getProductName = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : `Product #${productId}`;
  };

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    if (statusFilter !== 'all' && review.status !== statusFilter) return false;
    if (sentimentFilter !== 'all' && review.sentimentLabel !== sentimentFilter) return false;
    if (ratingFilter !== 'all' && review.rating !== parseInt(ratingFilter)) return false;
    return true;
  });

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredReviews.map((r) => r._id));
    } else {
      setSelectedIds([]);
    }
  };

  // Handle individual select
  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  // Handle single approve
  const handleApprove = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews/${id}/approve`, {
        method: 'PUT',
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(reviews.map((r) => (r._id === id ? { ...r, status: 'approved' } : r)));
        alert('Review approved successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve review');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle single reject
  const handleReject = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews/${id}/reject`, {
        method: 'PUT',
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(reviews.map((r) => (r._id === id ? { ...r, status: 'rejected' } : r)));
        alert('Review rejected successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject review');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk action
  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedIds.length === 0) {
      alert('Please select reviews first');
      return;
    }

    if (!confirm(`Are you sure you want to ${action} ${selectedIds.length} review(s)?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/reviews/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action }),
      });

      if (response.ok) {
        const data = await response.json();
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        setReviews(
          reviews.map((r) => (selectedIds.includes(r._id) ? { ...r, status: newStatus } : r))
        );
        setSelectedIds([]);
        alert(data.message);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update reviews');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Sentiment Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sentiment</label>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sentiment</option>
              <option value="POSITIVE">Positive</option>
              <option value="NEUTRAL">Neutral</option>
              <option value="NEGATIVE">Negative</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-end gap-2">
              <button
                onClick={() => handleBulkAction('approve')}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
              >
                Approve ({selectedIds.length})
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
              >
                Reject ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredReviews.length && filteredReviews.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sentiment
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No reviews found
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(review._id)}
                        onChange={(e) => handleSelect(review._id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        #{review._id.slice(-6)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {review.userId.name || 'Anonymous'}
                      </div>
                      <div className="text-xs text-gray-500">{review.userId.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{getProductName(review.productId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-sm font-medium text-gray-900">{review.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SentimentBadge sentiment={review.sentimentLabel} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={review.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Link
                        href={`/reviews/${review._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </Link>
                      {review.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(review._id)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(review._id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    approved: { bg: 'bg-green-100', text: 'text-green-800' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const sentimentConfig: Record<string, { bg: string; text: string }> = {
    POSITIVE: { bg: 'bg-green-100', text: 'text-green-800' },
    NEUTRAL: { bg: 'bg-gray-100', text: 'text-gray-800' },
    NEGATIVE: { bg: 'bg-red-100', text: 'text-red-800' },
  };

  const config = sentimentConfig[sentiment] || sentimentConfig.NEUTRAL;

  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
      {sentiment}
    </span>
  );
}