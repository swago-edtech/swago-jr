'use client';

import { useState } from 'react';

interface WaitlistEntry {
  _id: string;
  kidName: string;
  kidAge: number;
  parentEmail: string;
  parentPhone: string;
  notified: boolean;
  createdAt: string;
}

interface WaitlistTableProps {
  initialWaitlist: WaitlistEntry[];
}

export default function WaitlistTable({ initialWaitlist }: WaitlistTableProps) {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(initialWaitlist);
  const [notifiedFilter, setNotifiedFilter] = useState<string>('all');
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Filter waitlist
  const filteredWaitlist = waitlist.filter((entry) => {
    if (notifiedFilter === 'notified' && !entry.notified) return false;
    if (notifiedFilter === 'not_notified' && entry.notified) return false;
    if (ageFilter !== 'all' && entry.kidAge !== parseInt(ageFilter)) return false;
    return true;
  });

  // Handle notify toggle
  const handleNotifyToggle = async (id: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ambassadors/waitlist/${id}/notify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notified: !currentStatus }),
      });

      if (response.ok) {
        setWaitlist(
          waitlist.map((entry) =>
            entry._id === id ? { ...entry, notified: !currentStatus } : entry
          )
        );
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update notification status');
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
          {/* Notified Filter */}
          <div>
            <label htmlFor="notified-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Notification Status
            </label>
            <select
              id="notified-filter"
              value={notifiedFilter}
              onChange={(e) => setNotifiedFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="not_notified">Not Notified</option>
              <option value="notified">Notified</option>
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
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
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
              Showing {filteredWaitlist.length} of {waitlist.length} entries
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
                  Entry ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kid Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notified
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined On
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWaitlist.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No waitlist entries found
                  </td>
                </tr>
              ) : (
                filteredWaitlist.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        #{entry._id.slice(-6)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{entry.kidName}</div>
                      <div className="text-xs text-gray-500">{entry.kidAge} years old</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{entry.parentEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entry.parentPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.notified ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Yes
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleNotifyToggle(entry._id, entry.notified)}
                        disabled={loading}
                        className={`font-medium ${
                          entry.notified
                            ? 'text-yellow-600 hover:text-yellow-800'
                            : 'text-green-600 hover:text-green-800'
                        } disabled:opacity-50`}
                      >
                        {entry.notified ? 'Mark Unnotified' : 'Mark Notified'}
                      </button>
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
