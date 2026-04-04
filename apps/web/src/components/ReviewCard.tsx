"use client";

import Image from "next/image";
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

interface ReviewCardProps {
  review: Review;
  isOwnReview: boolean;
  onDelete: (reviewId: string) => Promise<void>;
}

export default function ReviewCard({ review, isOwnReview, onDelete }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={star <= rating ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={star <= rating ? 1 : 2}
            className={`w-4 h-4 sm:w-5 sm:h-5 ${star <= rating ? "text-yellow-400" : "text-slate-200"
              }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
            />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-50 border border-slate-100 rounded-2xl p-5 sm:p-6 shadow-inner"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
        <div className="flex flex-col items-start gap-2">
          {renderStars(review.rating)}
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-black text-slate-800 tracking-tight text-sm sm:text-base">
              {review.user.name || "Anonymous"}
            </h4>
            {review.isVerifiedPurchase && (
              <span className="text-[9px] sm:text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-200 sm:border-none pt-3 sm:pt-0 mt-1 sm:mt-0">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 tracking-wide uppercase">
            {formatDate(review.createdAt)}
          </span>
          {isOwnReview && (
            <button
              onClick={() => onDelete(review._id)}
              className="text-[10px] font-black text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg transition-colors uppercase tracking-widest border border-rose-100"
              aria-label="Delete review"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-sm">
        {review.title && (
          <h5 className="font-black text-slate-900 mb-2 tracking-wide uppercase text-xs sm:text-sm">{review.title}</h5>
        )}
        <p className="text-sm text-slate-600 font-semibold leading-relaxed tracking-tight">{review.comment}</p>
      </div>

      {review.images && review.images.length > 0 && (
        <div className="flex gap-2.5 flex-wrap mt-4">
          {review.images.map((image, index) => (
            <div
              key={index}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm group"
            >
              <Image
                src={image}
                alt={`Review image ${index + 1}`}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
