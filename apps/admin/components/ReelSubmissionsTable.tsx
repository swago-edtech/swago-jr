'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface Submission {
  _id: string;
  username: string;
  age: number;
  gender: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  ambassador: {
    swagoMoney: number;
    entryChallenge: {
      reelUrl: string;
      submittedAt: string;
      reviewedAt?: string;
      status: 'pending' | 'approved' | 'rejected';
      reviewNotes?: string;
    };
  };
}

interface ReelSubmissionsTableProps {
  initialSubmissions: Submission[];
}

export default function ReelSubmissionsTable({ initialSubmissions }: ReelSubmissionsTableProps) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    kidProfileId: string | null;
    action: 'approve' | 'reject' | null;
    notes: string;
  }>({
    isOpen: false,
    kidProfileId: null,
    action: null,
    notes: '',
  });

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    if (statusFilter !== 'all' && sub.ambassador.entryChallenge.status !== statusFilter) return false;
    return true;
  });

  // Handle approve
  const handleApprove = async () => {
    if (!reviewModal.kidProfileId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/ambassador/reels/${reviewModal.kidProfileId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNotes: reviewModal.notes }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        setSubmissions(
          submissions.map((sub) =>
            sub._id === reviewModal.kidProfileId
              ? {
                  ...sub,
                  ambassador: {
                    ...sub.ambassador,
                    swagoMoney: data.updatedProfile.ambassador.swagoMoney,
                    entryChallenge: {
                      ...sub.ambassador.entryChallenge,
                      status: 'approved',
                      reviewedAt: new Date().toISOString(),
                      reviewNotes: reviewModal.notes,
                    },
                  },
                }
              : sub
          )
        );
        
        alert('✅ Reel approved! Kid earned 100 Swago Money and Brain Gym is unlocked!');
        closeModal();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve reel');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!reviewModal.kidProfileId || !reviewModal.notes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/ambassador/reels/${reviewModal.kidProfileId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNotes: reviewModal.notes }),
      });

      if (response.ok) {
        // Update local state
        setSubmissions(
          submissions.map((sub) =>
            sub._id === reviewModal.kidProfileId
              ? {
                  ...sub,
                  ambassador: {
                    ...sub.ambassador,
                    entryChallenge: {
                      ...sub.ambassador.entryChallenge,
                      status: 'rejected',
                      reviewedAt: new Date().toISOString(),
                      reviewNotes: reviewModal.notes,
                    },
                  },
                }
              : sub
          )
        );
        
        alert('❌ Reel rejected. Kid can resubmit.');
        closeModal();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject reel');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (kidProfileId: string, action: 'approve' | 'reject') => {
    setReviewModal({
      isOpen: true,
      kidProfileId,
      action,
      notes: '',
    });
  };

  const closeModal = () => {
    setReviewModal({
      isOpen: false,
      kidProfileId: null,
      action: null,
      notes: '',
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <p className="text-sm text-gray-600">
              Showing {filteredSubmissions.length} of {submissions.length} submissions
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kid Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reel URL
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Swago Money
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted On
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No reel submissions found
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{sub.username}</div>
                      <div className="text-xs text-gray-500">
                        {sub.age} years • {sub.gender}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{sub.userId.name}</div>
                      <div className="text-xs text-gray-500">{sub.userId.email}</div>
                      <div className="text-xs text-gray-500">{sub.userId.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={sub.ambassador.entryChallenge.reelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Reel <ExternalLink className="w-4 h-4" />
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-purple-600">
                        ₹{sub.ambassador.swagoMoney}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusClassName(sub.ambassador.entryChallenge.status)}`}>
                        {sub.ambassador.entryChallenge.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(sub.ambassador.entryChallenge.submittedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(sub.ambassador.entryChallenge.submittedAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {sub.ambassador.entryChallenge.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openModal(sub._id, 'approve')}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openModal(sub._id, 'reject')}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {sub.ambassador.entryChallenge.status !== 'pending' && (
                        <span className="text-gray-400 text-xs">
                          {sub.ambassador.entryChallenge.reviewNotes || 'No notes'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {reviewModal.action === 'approve' ? '✅ Approve Reel' : '❌ Reject Reel'}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              {reviewModal.action === 'approve'
                ? 'Kid will receive 100 Swago Money and Brain Gym will be unlocked.'
                : 'Kid will be able to resubmit the reel with corrections.'}
            </p>

            <textarea
              value={reviewModal.notes}
              onChange={(e) => setReviewModal({ ...reviewModal, notes: e.target.value })}
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 resize-none mb-4"
              placeholder={reviewModal.action === 'approve' ? 'Add review notes (optional)' : 'Explain why reel was rejected (required)'}
              required={reviewModal.action === 'reject'}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={reviewModal.action === 'approve' ? handleApprove : handleReject}
                disabled={loading}
                className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                  reviewModal.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading ? 'Processing...' : reviewModal.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusClassName(status: string): string {
  const statusClasses: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return statusClasses[status] || statusClasses.pending;
}
