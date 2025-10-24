"use client";

import StarRating from "./StarRating";
import { motion } from "framer-motion";

interface ReviewStatsProps {
  stats: {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
}

export default function ReviewStats({ stats }: ReviewStatsProps) {
  const { totalReviews, averageRating, ratingDistribution } = stats;

  const getPercentage = (count: number) => {
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
      <h3 className="text-xl font-bold mb-4">Customer Reviews</h3>

      {totalReviews === 0 ? (
        <p className="text-slate-500">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-4">
          {/* Average Rating */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900">
                {averageRating.toFixed(1)}
              </div>
              <StarRating rating={averageRating} size="sm" />
              <p className="text-sm text-slate-500 mt-1">
                {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingDistribution[star as keyof typeof ratingDistribution];
                const percentage = getPercentage(count);

                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-sm font-medium w-8">{star}★</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: star * 0.1 }}
                        className="h-full bg-yellow-400"
                      />
                    </div>
                    <span className="text-sm text-slate-600 w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}