"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function MasterclassBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/masterclass/bookings?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      } else {
        console.error("Failed to fetch bookings");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Masterclass Bookings</h1>
          <p className="text-gray-600 mt-1">View all user bookings</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, name, email, phone..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
            >
              <option value="all">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No bookings found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Masterclass</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Child Info</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent Info</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm text-gray-900">
                {bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-blue-600">{booking.bookingId || booking._id.substring(0,8)}</td>
                    <td className="px-4 py-3">{new Date(booking.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}</td>
                    <td className="px-4 py-3">
                      <div>{booking.masterclassId?.title || 'Unknown Masterclass'}</div>
                      <div className="text-xs text-gray-500">Session ID: {booking.sessionId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-black">{booking.childName}</div>
                      <div className="text-xs text-gray-600">Age: {booking.childAge} yrs | {booking.childGrade || 'N/A'}</div>
                      <div className="text-xs text-gray-500 italic mt-0.5">{booking.schoolName || 'No school specified'}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">{booking.city || 'N/A'}, {booking.state || 'N/A'}</div>
                      {booking.goals && (
                        <div className="text-[10px] text-purple-600 font-medium mt-1 leading-tight max-w-[150px]">
                          Goal: {booking.goals}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>{booking.parentName}</div>
                      <div className="text-xs text-gray-500">{booking.parentPhone}</div>
                      <div className="text-xs text-gray-500">{booking.parentEmail}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold">₹{booking.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                        booking.status === 'Paid' ? 'bg-green-100 text-green-700' :
                        booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
