"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

export default function OrderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  
  const [dateRange, setDateRange] = useState(searchParams.get("dateRange") || "all");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      
      router.push(pathname + "?" + params.toString());
    },
    [searchParams, pathname, router]
  );

  // Debounce search query (fixed infinite loop)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get("q") || "";
      if (searchQuery !== currentQ) {
        createQueryString("q", searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, createQueryString, searchParams]);

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("dateRange");
      params.delete("startDate");
      params.delete("endDate");
    } else {
      params.set("dateRange", value);
      if (value !== "custom") {
        params.delete("startDate");
        params.delete("endDate");
      } else {
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
      }
    }
    router.push(pathname + "?" + params.toString());
  };

  const handleCustomDateChange = (type: "start" | "end", value: string) => {
    if (type === "start") setStartDate(value);
    else setEndDate(value);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("dateRange", "custom");
    if (type === "start" && value) params.set("startDate", value);
    if (type === "end" && value) params.set("endDate", value);
    if (type === "start" && !value) params.delete("startDate");
    if (type === "end" && !value) params.delete("endDate");
    
    router.push(pathname + "?" + params.toString());
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
      {/* Top Row: Search Inputs */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full relative">
          <input
            type="text"
            placeholder="Search by ID, Name, Phone, Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Dropdown Filters */}
      <div className="flex flex-wrap gap-4 w-full">
        <select
          value={searchParams.get("status") || ""}
          onChange={(e) => createQueryString("status", e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {searchParams.get("tab") === "abandoned" ? (
            <>
              <option value="abandoned">Abandoned</option>
              <option value="failed">Failed</option>
            </>
          ) : (
            <>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </>
          )}
        </select>

        <select
          value={searchParams.get("payment") || ""}
          onChange={(e) => createQueryString("payment", e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Payment Options</option>
          <option value="cod">Cash on Delivery</option>
          <option value="razorpay">Prepaid (Razorpay)</option>
          <option value="coupon_applied">Has Applied Coupon</option>
          <option value="coupon_none">No Coupon Applied</option>
        </select>

        <select
          value={searchParams.get("source") || ""}
          onChange={(e) => createQueryString("source", e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Sources</option>
          <option value="instagram">Instagram</option>
          <option value="google">Google</option>
          <option value="facebook">Facebook</option>
          <option value="standard">Standard Checkout</option>
          <option value="express">Express Checkout</option>
        </select>

        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === "custom" && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleCustomDateChange("start", e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleCustomDateChange("end", e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <select
          value={searchParams.get("sort") || "newest"}
          onChange={(e) => createQueryString("sort", e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 ml-auto"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Amount: High to Low</option>
          <option value="lowest">Amount: Low to High</option>
        </select>
      </div>
    </div>
  );
}
