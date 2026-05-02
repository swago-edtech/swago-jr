"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type FAQ = {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const CATEGORIES = {
  general: "General",
  shipping: "Shipping & Delivery",
  payment: "Payment & Pricing",
  products: "Products & Usage",
  returns: "Returns & Refunds",
  account: "Account & Login",
};

export default function FAQsPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch FAQs
  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("isActive", statusFilter);

      const res = await fetch(`/api/faqs?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setFaqs(data.faqs);
      } else {
        console.error("Failed to fetch FAQs");
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, [search, categoryFilter, statusFilter]);

  // Delete FAQ
  const handleDelete = async (faqId: string, question: string) => {
    if (!confirm(`Are you sure you want to delete this FAQ?\n\n"${question}"`)) return;

    try {
      setDeleting(faqId);
      const res = await fetch(`/api/faqs/${faqId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        alert("FAQ deleted successfully");
        fetchFAQs();
      } else {
        alert("Failed to delete FAQ");
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      alert("Error deleting FAQ");
    } finally {
      setDeleting(null);
    }
  };

  // Toggle active status
  const toggleActive = async (faqId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/faqs/${faqId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await res.json();

      if (data.success) {
        fetchFAQs();
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Category badge colors
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-gray-100 text-gray-700",
      shipping: "bg-blue-100 text-blue-700",
      payment: "bg-green-100 text-green-700",
      products: "bg-purple-100 text-purple-700",
      returns: "bg-orange-100 text-orange-700",
      account: "bg-pink-100 text-pink-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FAQs</h1>
          <p className="text-gray-600 mt-1">Manage frequently asked questions</p>
        </div>
        <Link
          href="/faqs/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add New FAQ
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              id="search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All FAQs</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Showing {faqs.length} FAQs</span>
          <button
            onClick={() => {
              setSearch("");
              setCategoryFilter("all");
              setStatusFilter("all");
            }}
            className="text-blue-600 hover:underline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* FAQs List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading FAQs...</p>
        </div>
      ) : faqs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">No FAQs found</p>
          <Link href="/faqs/new" className="text-blue-600 hover:underline">
            Add your first FAQ
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Question
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {faqs.map((faq) => (
                <tr key={faq._id} className="hover:bg-gray-50">
                  {/* Order */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {faq.order}
                    </span>
                  </td>

                  {/* Question */}
                  <td className="px-4 py-3">
                    <div className="max-w-md">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {faq.question}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {faq.answer}
                      </p>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 text-xs rounded ${getCategoryColor(faq.category)}`}>
                      {CATEGORIES[faq.category as keyof typeof CATEGORIES]}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                        faq.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {faq.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/faqs/${faq._id}/edit`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => toggleActive(faq._id, faq.isActive)}
                        className="text-sm text-gray-600 hover:underline"
                      >
                        {faq.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(faq._id, faq.question)}
                        disabled={deleting === faq._id}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
                      >
                        {deleting === faq._id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
