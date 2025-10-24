"use client";

import { motion } from "framer-motion";
import StarRating from "./StarRating";
import Image from "next/image";

interface ReviewCardProps {
  review: {
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
  };
  onEdit?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
  isOwnReview?: boolean;
}

export default function ReviewCard({
  review,
  onEdit,
  onDelete,
  isOwnReview = false,
}: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const maskPhone = (phone: string) => {
    // Show only last 4 digits: +91 9999999999 -> +91 ****9999
    return phone.replace(/(\+\d{2})\s?(\d+)(\d{4})/, "$1 ****$3");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
            {review.user.name ? review.user.name[0].toUpperCase() : "U"}
          </div>
          
          <div>
            <p className="font-semibold text-slate-900">
              {review.user.name || "Anonymous"}
            </p>
            <p className="text-xs text-slate-500">{maskPhone(review.user.phone)}</p>
          </div>
        </div>

        {/* Actions for own review */}
        {isOwnReview && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(review._id)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(review._id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rating & Date */}
      <div className="flex items-center gap-3 mb-3">
        <StarRating rating={review.rating} size="sm" />
        <span className="text-sm text-slate-500">{formatDate(review.createdAt)}</span>
        {review.isVerifiedPurchase && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
            ✓ Verified Purchase
          </span>
        )}
      </div>

      {/* Review Title */}
      <h3 className="font-bold text-lg text-slate-900 mb-2">{review.title}</h3>

      {/* Review Comment */}
      <p className="text-slate-700 leading-relaxed mb-4">{review.comment}</p>

      {/* Review Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-3 overflow-x-auto">
          {review.images.map((img, index) => (
            <div
              key={index}
              className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200"
            >
              <Image
                src={img}
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