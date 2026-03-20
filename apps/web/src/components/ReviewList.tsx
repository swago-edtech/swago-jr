"use client";

import { useEffect, useState, useCallback } from "react";
import ReviewCard from "./ReviewCard";
import ReviewStats from "./ReviewStats";
import { motion } from "framer-motion";
import StarRating from "./StarRating";

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
    <div className="space-y-6">
      {/* Reviews List & Stats in a single card */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="mb-6">
          <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight mb-1">
            How do you like our product?
          </h3>
          <p className="text-slate-400 font-medium text-sm">Read what other parents are saying</p>
        </div>

        {/* Stats Section moved inside or simplified */}
        {stats && (
          <div className="mb-8 pb-8 border-b border-slate-50">
            <ReviewStats stats={stats} />
          </div>
        )}

        {/* Sort & Filter */}
        {reviews.length > 0 && (
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 border-l-4 border-[hsl(var(--swago-purple))] pl-3">
              All Reviews ({reviews.length})
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[hsl(var(--swago-purple))] transition-all cursor-pointer shadow-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="rating-high">Highest Rating</option>
                <option value="rating-low">Lowest Rating</option>
              </select>
            </div>
          </div>
        )}

        {/* Individual Reviews */}
        <div className="space-y-6">
          {sortedReviews.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-gradient-to-b from-purple-50/50 to-transparent rounded-3xl border-2 border-dashed border-purple-100"
            >
              <div className="flex justify-center mb-6">
                <StarRating rating={0} size="lg" />
              </div>
              <p className="text-xl font-bold text-slate-900 px-4">
                Be the first parent to review this smart box.
              </p>
              <p className="text-slate-500 mt-3 px-6 max-w-md mx-auto">
                Your feedback helps other parents choose the perfect learning experience for their kids.
              </p>
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
    </div>
  );
}