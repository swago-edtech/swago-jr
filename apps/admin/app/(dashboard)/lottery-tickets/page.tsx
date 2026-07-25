"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Ticket as TicketIcon, ChevronLeft, ChevronRight, RefreshCw, X, Calendar, User as UserIcon } from "lucide-react";

type Ticket = {
  _id: string;
  code: string;
  productName: string;
  shortForm: string;
  redeemedAt: string;
  kidProfile: {
    _id: string;
    name: string;
  } | null;
  parent: {
    name: string;
    phone: string;
    email: string;
  } | null;
};

type PaginationMeta = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
};

export default function LotteryTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
  });

  const fetchTickets = useCallback(async (targetPage: number, searchVal: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: "20",
      });
      if (searchVal) {
        params.set("search", searchVal);
      }

      const res = await fetch(`/api/lottery-tickets?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setTickets(data.tickets || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets(page, activeSearch);
  }, [page, activeSearch, fetchTickets]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchTerm.trim());
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setActiveSearch("");
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900">All Redeemed Tickets</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
              {pagination.totalCount} Total
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            View and search all claimed lottery codes across customer accounts
          </p>
        </div>

        <button
          onClick={() => fetchTickets(page, activeSearch)}
          disabled={loading}
          className="self-start sm:self-auto p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by ticket code, product name, kid name, or parent contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 text-sm font-medium mt-3">Loading tickets data...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center">
            <TicketIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-700 font-semibold text-base">No redeemed tickets found</p>
            <p className="text-gray-400 text-xs mt-1">
              {activeSearch
                ? `No results matching "${activeSearch}". Try another search term.`
                : "No lottery codes have been redeemed yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ticket Code
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User / Kid Name
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Redeemed At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                        {ticket.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <p className="font-medium text-gray-900">{ticket.productName}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        Form: {ticket.shortForm}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400 flex-none" />
                        <span className="font-medium text-gray-900">
                          {ticket.kidProfile?.name || ticket.parent?.name || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <p className="text-gray-900 font-medium">{ticket.parent?.name || "-"}</p>
                      <div className="text-xs text-gray-400 space-x-1.5 mt-0.5">
                        {ticket.parent?.phone && <span>{ticket.parent.phone}</span>}
                        {ticket.parent?.phone && ticket.parent?.email && <span>•</span>}
                        {ticket.parent?.email && <span>{ticket.parent.email}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {formatDate(ticket.redeemedAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50 px-6 py-3.5 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-medium">
              Showing page <span className="font-semibold text-gray-900">{pagination.currentPage}</span> of{" "}
              <span className="font-semibold text-gray-900">{pagination.totalPages}</span> ({pagination.totalCount} total results)
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 transition-all flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages || loading}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 transition-all flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
