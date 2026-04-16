"use client";

import { useState } from "react";
import StarRating from "./StarRating";
import { motion, AnimatePresence } from "framer-motion";
import { useSharedContext } from "@/context/SharedContext";

interface ReviewFormProps {
  productId: string;
  orderId?: string;
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
  const { user } = useSharedContext();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

    if (!user) {
      setError("Please log in to submit a review");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          orderId: orderId || "",
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          onSuccess();
        }, 2000);
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
    <>
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-2xl border border-slate-100 max-w-sm w-full text-center relative overflow-hidden"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-inner"
              >
                <svg
                  className="w-10 h-10 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-black text-slate-900 tracking-tight mb-2"
              >
                Review Submitted!
              </motion.h3>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm font-bold text-slate-500"
              >
                Thank you for sharing your experience.
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100"
      >
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter relative z-10">
            Write a Review
          </h3>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-colors border border-slate-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold tracking-widest flex items-center gap-3 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </motion.div>
        )}

        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-inner">
            <label className="block text-[10px] font-black text-slate-400 tracking-widest mb-3">
              Overall Rating <span className="text-rose-500">*</span>
            </label>
            <div className="flex">
              <StarRating
                rating={rating}
                size="lg"
                interactive
                onRatingChange={setRating}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 tracking-widest mb-2 pl-1">
              Review Title <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sum up your experience in one line"
                maxLength={100}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[hsl(var(--swago-purple))]/20 focus:border-[hsl(var(--swago-purple))] outline-none transition-all placeholder:text-slate-400 shadow-inner"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                {title.length}/100
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 tracking-widest mb-2 pl-1">
              Your Review <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us what you liked or didn't like"
                maxLength={1000}
                rows={4}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[hsl(var(--swago-purple))]/20 focus:border-[hsl(var(--swago-purple))] outline-none transition-all placeholder:text-slate-400 resize-none shadow-inner"
              />
              <span className="absolute right-4 bottom-4 text-[10px] font-bold text-slate-400 bg-white/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {comment.length}/1000
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[hsl(var(--swago-purple))] text-white font-black py-4 px-6 rounded-2xl text-sm hover:opacity-90 transition-opacity transform active:scale-[0.98] tracking-[0.15em] flex items-center justify-center gap-3 disabled:opacity-75 disabled:cursor-not-allowed shadow-md shadow-purple-100 group"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Review
                <div className="bg-white/20 p-1 rounded-xl group-hover:translate-x-1 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </>
            )}
          </button>
        </div>
      </motion.form>
    </>
  );
}