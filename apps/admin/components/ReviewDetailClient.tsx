'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReviewDetailClientProps {
  reviewId: string;
  currentStatus: 'pending' | 'approved' | 'rejected';
}

export default function ReviewDetailClient({
  reviewId,
  currentStatus,
}: ReviewDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this review?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}/approve`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Review approved successfully!');
        router.refresh(); // Refresh the page to show updated status
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

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this review?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}/reject`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Review rejected successfully!');
        router.refresh(); // Refresh the page to show updated status
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to DELETE this review? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Review deleted successfully!');
        router.push('/reviews'); // Redirect back to reviews list
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete review');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
      <div className="space-y-3">
        {/* Approve Button */}
        {currentStatus !== 'approved' && (
          <button
            onClick={handleApprove}
            disabled={loading}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {loading ? 'Processing...' : 'Approve Review'}
          </button>
        )}

        {/* Reject Button */}
        {currentStatus !== 'rejected' && (
          <button
            onClick={handleReject}
            disabled={loading}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {loading ? 'Processing...' : 'Reject Review'}
          </button>
        )}

        {/* Current Status Info */}
        {currentStatus === 'approved' && (
          <div className="text-center py-2 text-sm text-green-700 bg-green-50 rounded-lg border border-green-200">
            ✓ This review is approved
          </div>
        )}
        
        {currentStatus === 'rejected' && (
          <div className="text-center py-2 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
            ✗ This review is rejected
          </div>
        )}

        {/* Delete Button (Destructive) */}
        <div className="pt-3 border-t border-gray-200">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full px-4 py-3 bg-gray-100 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
            {loading ? 'Deleting...' : 'Delete Review'}
          </button>
        </div>
      </div>
    </div>
  );
}