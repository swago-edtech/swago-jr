"use client";

import { useEffect, useState, useCallback } from "react";
import ReviewCard from "./ReviewCard";
import ReviewStats from "./ReviewStats";
import ReviewForm from "./ReviewForm";
import { motion } from "framer-motion";
import StarRating from "./StarRating";
import { useSharedContext } from "@/context/SharedContext";

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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { user } = useSharedContext();

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

  const handleReviewSuccess = () => {
    setShowReviewModal(false);
    fetchReviews();
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

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-transparent max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ReviewForm
              productId={productId}
              onSuccess={handleReviewSuccess}
              onCancel={() => setShowReviewModal(false)}
            />
          </div>
        </div>
      )}

      {/* Reviews List & Stats in a single card */}
      <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        {reviews.length > 0 && (
          <>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-1">
                  How do you like our product?
                </h3>
                <p className="text-slate-400 font-medium text-sm">Read what other parents are saying</p>
              </div>
              {user && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="bg-[hsl(var(--swago-purple))] text-white px-6 py-3 rounded-xl font-black tracking-widest text-xs hover:opacity-90 shadow-sm transition-transform active:scale-95"
                >
                  Write a Review
                </button>
              )}
            </div>

            {/* Stats Section moved inside or simplified */}
            {stats && stats.totalReviews > 0 && (
              <div className="mb-8 pb-8 border-b border-slate-50">
                <ReviewStats stats={stats} />
              </div>
            )}
          </>
        )}

        {reviews.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pt-6 border-t border-slate-100 mt-2">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 w-1.5 h-6 sm:h-8 rounded-full" />
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                All Reviews <span className="text-slate-400">({reviews.length})</span>
              </h3>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <span className="text-xs font-black text-slate-400 tracking-widest pl-3 hidden sm:block">Sort :</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-800 tracking-widest outline-none focus:ring-2 focus:ring-[hsl(var(--swago-purple))]/20 focus:border-[hsl(var(--swago-purple))] transition-all cursor-pointer shadow-sm appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '12px' }}
              >
                <option value="recent">Most Recent</option>
                <option value="rating-high">Highest Rating</option>
                <option value="rating-low">Lowest Rating</option>
              </select>
            </div>
          </div>
        )}

        {/* Individual Reviews */}
        <div className="space-y-4">
          {sortedReviews.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 px-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner"
            >
              <div className="flex justify-center mb-5">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <StarRating rating={0} size="lg" />
                </div>
              </div>
              <h4 className="text-xl font-black text-slate-900 tracking-tight mb-3 px-4">
                Be the first parent to review!
              </h4>
              <p className="text-slate-500 font-bold text-sm max-w-sm mx-auto mb-6">
                Your feedback helps other parents choose the perfect learning experience for their kids.
              </p>
              {user && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="bg-[hsl(var(--swago-purple))] text-white px-8 py-4 rounded-xl font-black tracking-widest text-sm hover:scale-105 shadow-md shadow-purple-100 transition-all active:scale-95 inline-block"
                >
                  Drop a Review
                </button>
              )}
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