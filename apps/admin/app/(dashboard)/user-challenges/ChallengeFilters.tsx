"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

export default function ChallengeFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      createQueryString("q", searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      
      // Reset page when filters change
      if (name !== 'page') {
        params.delete('page');
      }
      
      router.push(pathname + "?" + params.toString());
    },
    [searchParams, pathname, router]
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex-1 w-full relative">
        <input
          type="text"
          placeholder="Search Kid Name or Parent Phone..."
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

      <div className="flex gap-4 w-full md:w-auto">
        <select
          value={searchParams.get("status") || ""}
          onChange={(e) => createQueryString("status", e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="completed">Fully Completed</option>
          <option value="pending_reel">Pending Reel Submission</option>
          <option value="pending_brain_gym">Pending Brain Gym</option>
          <option value="brand_ambassador">Brand Ambassadors</option>
        </select>
        
        <select
          value={searchParams.get("sort") || "newest"}
          onChange={(e) => createQueryString("sort", e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest_sd">Highest Swago Money</option>
        </select>
      </div>
    </div>
  );
}
