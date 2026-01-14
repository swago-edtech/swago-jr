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
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={star <= rating ? "currentColor" : "none"}
            stroke="currentColor"
            className={`w-5 h-5 ${
              star <= rating ? "text-yellow-500" : "text-slate-300"
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
      className="border border-slate-200 rounded-xl p-6 bg-white hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-800">
              {review.user.name || "Anonymous"}
            </h4>
            {review.isVerifiedPurchase && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                ✓ Verified Purchase
              </span>
            )}
          </div>
          {renderStars(review.rating)}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">
            {formatDate(review.createdAt)}
          </span>
          {isOwnReview && (
            <button
              onClick={() => onDelete(review._id)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
              aria-label="Delete review"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      {review.title && (
        <h5 className="font-semibold text-slate-900 mb-2">{review.title}</h5>
      )}

      {/* Comment */}
      <p className="text-slate-700 leading-relaxed mb-3">{review.comment}</p>

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {review.images.map((image, index) => (
            <div
              key={index}
              className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200"
            >
              <Image
                src={image}
                alt={`Review image ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
