"use client";

import { useEffect, useState, useCallback } from "react";
import ReviewCard from "./ReviewCard";
import ReviewStats from "./ReviewStats";
import { motion } from "framer-motion";

interface Review {
  _id: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: {
    name?: string;
    phone: string;
  };
}

interface ReviewStatsType {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface ReviewListProps {
  productId: string;
  currentUserId?: string; // To identify own reviews
}

type SortOption = "recent" | "rating-high" | "rating-low";

export default function ReviewList({ productId, currentUserId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews/${productId}`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const response = await fetch(`/api/reviews/user/${reviewId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Review deleted successfully!");
        fetchReviews(); // Refresh list
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case "rating-high":
        return b.rating - a.rating;
      case "rating-low":
        return a.rating - b.rating;
      case "recent":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent"></div>
        <p className="mt-4 text-slate-600">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      {stats && <ReviewStats stats={stats} />}

      {/* Sort & Filter */}
      {reviews.length > 0 && (
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">
            All Reviews ({reviews.length})
          </h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="recent">Most Recent</option>
            <option value="rating-high">Highest Rating</option>
            <option value="rating-low">Lowest Rating</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {sortedReviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-slate-50 rounded-xl"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-16 h-16 mx-auto text-slate-400 mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
              />
            </svg>
            <p className="text-lg font-semibold text-slate-700">No reviews yet</p>
            <p className="text-slate-500 mt-2">Be the first to share your experience!</p>
          </motion.div>
        ) : (
          sortedReviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              isOwnReview={currentUserId === review.user.phone}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}