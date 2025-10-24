"use client";

import { useState } from "react";
import StarRating from "./StarRating";
import { motion } from "framer-motion";

interface ReviewFormProps {
  productId: number;
  orderId: string;
  onSuccess: () => void;
  onCancel?: () => void;
  existingReview?: {
    rating: number;
    title: string;
    comment: string;
  };
}

export default function ReviewForm({
  productId,
  orderId,
  onSuccess,
  onCancel,
  existingReview,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters");
      return;
    }

    if (comment.trim().length < 10) {
      setError("Comment must be at least 10 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          orderId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Review submitted successfully!");
        onSuccess();
      } else {
        setError(data.error || "Failed to submit review");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-lg border border-slate-200"
    >
      <h3 className="text-2xl font-bold mb-6">Write a Review</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Rating */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">
          Your Rating <span className="text-red-500">*</span>
        </label>
        <StarRating
          rating={rating}
          size="lg"
          interactive
          onRatingChange={setRating}
        />
      </div>

      {/* Title */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">
          Review Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your experience in one line"
          maxLength={100}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <p className="text-xs text-slate-500 mt-1">{title.length}/100</p>
      </div>

      {/* Comment */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">
          Your Review <span className="text-red-500">*</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us what you liked or didn't like"
          maxLength={1000}
          rows={5}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">{comment.length}/1000</p>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 btn-shine bg-[hsl(var(--swago-purple))] text-white font-bold py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </motion.form>
  );
}