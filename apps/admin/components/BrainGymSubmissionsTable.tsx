'use client';

import { useState } from 'react';
import { ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface Submission {
  _id: string;
  name: string;
  email: string;
  phone: string;
  age?: number;
  gender?: string;
  ambassador: {
    swagoMoney: number;
    brainGym: {
      reelUrl: string;
      submittedAt: string;
      reviewedAt?: string;
      status: 'pending' | 'approved' | 'rejected';
      reviewNotes?: string;
      completed: boolean;
    };
  };
}

interface BrainGymSubmissionsTableProps {
  initialSubmissions: Submission[];
}

export default function BrainGymSubmissionsTable({ initialSubmissions }: BrainGymSubmissionsTableProps) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    userId: string | null;
    action: 'approve' | 'reject' | null;
    notes: string;
  }>({
    isOpen: false,
    userId: null,
    action: null,
    notes: '',
  });

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    if (statusFilter !== 'all' && sub.ambassador.brainGym?.status !== statusFilter) return false;
    return true;
  });

  // Handle approve
  const handleApprove = async () => {
    if (!reviewModal.userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/ambassador/brain-gym/${reviewModal.userId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reviewModal.notes }),
      });

      if (response.ok) {
        const data = await response.json();
        
        setSubmissions(
          submissions.map((sub) =>
            sub._id === reviewModal.userId
              ? {
                  ...sub,
                  ambassador: {
                    ...sub.ambassador,
                    swagoMoney: data.swagoMoney || sub.ambassador.swagoMoney,
                    brainGym: {
                      ...sub.ambassador.brainGym,
                      status: 'approved',
                      reviewedAt: new Date().toISOString(),
                      reviewNotes: reviewModal.notes,
                    },
                  },
                }
              : sub
          )
        );
        
        alert('✅ Brain Gym Challenge approved! User earned 15 Swago Dollars!');
        closeModal();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve Brain Gym');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!reviewModal.userId || !reviewModal.notes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/ambassador/brain-gym/${reviewModal.userId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reviewModal.notes }),
      });

      if (response.ok) {
        setSubmissions(
          submissions.map((sub) =>
            sub._id === reviewModal.userId
              ? {
                  ...sub,
                  ambassador: {
                    ...sub.ambassador,
                    brainGym: {
                      ...sub.ambassador.brainGym,
                      status: 'rejected',
                      reviewedAt: new Date().toISOString(),
                      reviewNotes: reviewModal.notes,
                    },
                  },
                }
              : sub
          )
        );
        
        alert('❌ Brain Gym rejected. User can resubmit.');
        closeModal();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject Brain Gym');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (userId: string, action: 'approve' | 'reject') => {
    setReviewModal({
      isOpen: true,
      userId,
      action,
      notes: '',
    });
  };

  const closeModal = () => {
    setReviewModal({
      isOpen: false,
      userId: null,
      action: null,
      notes: '',
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label htmlFor="status-filter" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Filter by Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="all">All Submissions</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User Details</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Parent Details</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Challenge Reel</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Submitted On</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">No Brain Gym submissions found</td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{sub.name}</div>
                      <div className="text-xs text-gray-400">{sub.age ? `${sub.age} yrs` : ''} {sub.gender ? `• ${sub.gender}` : ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 font-medium">{sub.email || sub.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={sub.ambassador.brainGym.reelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                      >
                        View Submission <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${getStatusClassName(sub.ambassador.brainGym.status)}`}>
                        {sub.ambassador.brainGym.status === 'pending' && <Clock className="w-3 h-3" />}
                        {sub.ambassador.brainGym.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        {sub.ambassador.brainGym.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {sub.ambassador.brainGym.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 font-medium">
                        {new Date(sub.ambassador.brainGym.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                        {new Date(sub.ambassador.brainGym.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {sub.ambassador.brainGym.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openModal(sub._id, 'approve')}
                            className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-all shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openModal(sub._id, 'reject')}
                            className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-400 font-bold italic max-w-[120px] ml-auto truncate" title={sub.ambassador.brainGym.reviewNotes}>
                          {sub.ambassador.brainGym.reviewNotes || 'Reviewed'}
                        </div>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase italic tracking-tighter">
              {reviewModal.action === 'approve' ? '✨ Approve Challenge' : '⚠️ Reject Challenge'}
            </h3>
            
            <p className="text-sm font-medium text-gray-500 mb-6">
              {reviewModal.action === 'approve'
                ? 'Great work! The user will receive 15 Swago Dollars and will be notified of their success.'
                : 'Please explain why the submission was rejected so the user can fix it and try again.'}
            </p>

            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Review Notes</label>
            <textarea
              value={reviewModal.notes}
              onChange={(e) => setReviewModal({ ...reviewModal, notes: e.target.value })}
              rows={4}
              className="w-full border-2 border-slate-100 rounded-xl p-4 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all resize-none mb-6 font-semibold text-gray-700"
              placeholder={reviewModal.action === 'approve' ? 'Optional: Well done! Great focus.' : 'Required: Video is too short or not clear.'}
              required={reviewModal.action === 'reject'}
            />

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-6 py-3 text-gray-500 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={reviewModal.action === 'approve' ? handleApprove : handleReject}
                disabled={loading}
                className={`flex-1 px-6 py-3 text-white font-black uppercase tracking-widest rounded-xl disabled:opacity-50 shadow-lg ${
                  reviewModal.action === 'approve'
                    ? 'bg-green-500 hover:bg-green-600 shadow-green-200'
                    : 'bg-red-500 hover:bg-red-600 shadow-red-200'
                }`}
              >
                {loading ? 'Wait...' : reviewModal.action === 'approve' ? 'Confirm' : 'Reject'}
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
    pending: 'bg-yellow-50 text-yellow-600 border border-yellow-100',
    approved: 'bg-green-50 text-green-600 border border-green-100',
    rejected: 'bg-red-50 text-red-600 border border-red-100',
  };
  return statusClasses[status] || statusClasses.pending;
}
