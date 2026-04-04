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
    <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-inner">
      {totalReviews > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">

            <div className="text-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm w-full sm:w-auto flex flex-col items-center justify-center">
              <div className="text-5xl font-black text-slate-900 tracking-tighter mb-2">
                {averageRating.toFixed(1)}
              </div>
              <StarRating rating={averageRating} size="sm" />
              <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mt-3">
                {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
              </p>
            </div>

            <div className="flex-1 space-y-3 w-full">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingDistribution[star as keyof typeof ratingDistribution];
                const percentage = getPercentage(count);

                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-8">
                      <span className="text-sm font-black text-slate-800">{star}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400">
                        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 h-3 bg-white border border-slate-200 rounded-full overflow-hidden shadow-inner p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: star * 0.1 }}
                        className="h-full bg-[hsl(var(--swago-purple))] rounded-full"
                      />
                    </div>
                    <span className="text-sm font-black text-slate-600 w-8 text-right tabular-nums">
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