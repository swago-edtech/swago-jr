'use client';

import { useState } from 'react';

interface Application {
  _id: string;
  kidName: string;
  kidAge: number;
  city: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  whyJoin?: string;
  status: 'pending' | 'under_review' | 'shortlisted' | 'selected' | 'rejected';
  consentGiven: boolean;
  adminNotes?: string;
  reviewedAt?: string;
  createdAt: string;
}

interface AmbassadorApplicationsTableProps {
  initialApplications: Application[];
}

export default function AmbassadorApplicationsTable({ initialApplications }: AmbassadorApplicationsTableProps) {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState<string>('');

  // Get unique cities for filter
  const cities = Array.from(new Set(applications.map((app) => app.city))).sort();

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (cityFilter !== 'all' && app.city !== cityFilter) return false;
    if (ageFilter !== 'all' && app.kidAge !== parseInt(ageFilter)) return false;
    return true;
  });

  // Handle status change
  const handleStatusChange = async (id: string, newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ambassadors/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setApplications(
          applications.map((app) => (app._id === id ? { ...app, status: newStatus as any } : app))
        );
        alert('Status updated successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle admin notes update
  const handleNotesUpdate = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ambassadors/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: applications.find(a => a._id === id)?.status,
          adminNotes: notesValue 
        }),
      });

      if (response.ok) {
        setApplications(
          applications.map((app) => (app._id === id ? { ...app, adminNotes: notesValue } : app))
        );
        setEditingNotes(null);
        setNotesValue('');
        alert('Notes updated successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update notes');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredApplications.map((a) => a._id));
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label htmlFor="city-filter" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <select
              id="city-filter"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Age Filter */}
          <div>
            <label htmlFor="age-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <select
              id="age-filter"
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Ages</option>
              {[7, 8, 9, 10, 11, 12, 13, 14].map((age) => (
                <option key={age} value={age}>
                  {age} years
                </option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <p className="text-sm text-gray-600">
              Showing {filteredApplications.length} of {applications.length} applications
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
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredApplications.length && filteredApplications.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                    aria-label="Select all applications"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kid Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied On
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No applications found
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(app._id)}
                        onChange={(e) => handleSelect(app._id, e.target.checked)}
                        className="rounded border-gray-300"
                        aria-label={`Select application ${app._id.slice(-6)}`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        #{app._id.slice(-6)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{app.kidName}</div>
                      <div className="text-xs text-gray-500">{app.kidAge} years old</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{app.parentName}</div>
                      <div className="text-xs text-gray-500">{app.parentEmail}</div>
                      <div className="text-xs text-gray-500">{app.parentPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{app.city}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app._id, e.target.value)}
                        disabled={loading}
                        aria-label={`Change status for ${app.kidName}'s application`}
                        className={`text-xs rounded-full px-3 py-1 border-0 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${getStatusClassName(app.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="selected">Selected</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(app.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setEditingNotes(app._id);
                          setNotesValue(app.adminNotes || '');
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {app.adminNotes ? 'Edit Notes' : 'Add Notes'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes Modal */}
      {editingNotes && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Admin Notes</h3>
            
            {/* Application Details */}
            {(() => {
              const app = applications.find((a) => a._id === editingNotes);
              return app ? (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Kid:</strong> {app.kidName} ({app.kidAge} years)
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Parent:</strong> {app.parentName}
                  </p>
                  {app.whyJoin && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Why Join:</strong> {app.whyJoin}
                    </p>
                  )}
                </div>
              ) : null;
            })()}

            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add internal notes about this application..."
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setEditingNotes(null);
                  setNotesValue('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleNotesUpdate(editingNotes)}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Notes'}
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
    under_review: 'bg-purple-100 text-purple-800',
    shortlisted: 'bg-indigo-100 text-indigo-800',
    selected: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return statusClasses[status] || statusClasses.pending;
}
