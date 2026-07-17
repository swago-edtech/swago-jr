"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Suspense } from "react";
import { Feedback } from "@/lib/feedback";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const method = searchParams.get("method") || "razorpay";
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    Feedback.playSuccess();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[hsl(var(--swago-purple))] px-6 py-8 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="relative z-10"
            >
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>

              <h1 className="text-2xl font-black text-white mb-1">
                Order Placed!
              </h1>
              <p className="text-white/80 text-sm font-medium">
                {method === "cod"
                  ? "Your COD order has been confirmed"
                  : "Payment successful"}
              </p>
            </motion.div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Order ID */}
            {orderId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100"
              >
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                  Order ID
                </p>
                <p className="text-lg font-black text-slate-900 tracking-wider">
                  {orderId}
                </p>
              </motion.div>
            )}

            {/* Info Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              <div className="flex items-start gap-3 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <span className="text-lg">📧</span>
                <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                  A confirmation email has been sent to your email address with your order details.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-3 border border-blue-100">
                <span className="text-lg">🔑</span>
                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                  You can track your order anytime by logging in with your phone number. No password needed — just use OTP!
                </p>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="space-y-3"
            >
              <Link
                href="/orders"
                className="block w-full text-center py-3.5 bg-[hsl(var(--swago-purple))] text-white font-black rounded-xl text-sm tracking-widest hover:brightness-110 transition-all active:scale-[0.98] shadow-lg shadow-[hsl(var(--swago-purple))/0.2]"
              >
                View My Orders
              </Link>

              <Link
                href="/products"
                className="block w-full text-center py-3 bg-white text-slate-700 font-bold rounded-xl text-sm border border-slate-200 hover:bg-slate-50 transition-all"
              >
                Continue Shopping
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex items-center justify-center gap-6 mt-6 text-slate-400"
        >
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            SECURE
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.127V11.25M7.5 7.5h7.875c.621 0 1.125.504 1.125 1.125v1.5" />
            </svg>
            FAST DELIVERY
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.502-4.688-4.502-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.748 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            LOVED BY PARENTS
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function ExpressThankYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[hsl(var(--swago-purple))] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}
