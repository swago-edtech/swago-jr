"use client";

import SessionCard from "./SessionCard";
import { useCurrency } from "@/hooks/useCurrency";
import { motion } from "framer-motion";

interface SessionGalleryProps {
  sessions: any[];
  onBookSession?: (session: any, currency: string) => void;
}

export default function SessionGallery({ sessions, onBookSession }: SessionGalleryProps) {
  const { currency } = useCurrency();

  if (!sessions || sessions.length === 0) return null;

  return (
    <section id="sessions" className="py-20 bg-[#f8f8fc] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs uppercase tracking-widest mb-4"
          >
            Pricing &amp; Sessions
          </motion.div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3">
            Choose Your Session
          </h2>
          <p className="text-slate-500 font-medium max-w-lg mx-auto">
            Select the batch that's perfect for your child's age group and schedule. Limited seats available.
          </p>
        </div>

        {/* Session Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {sessions.map((session, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <SessionCard
                session={session}
                currency={currency}
                onBook={onBookSession ? () => onBookSession(session, currency) : undefined}
              />
            </motion.div>
          ))}
        </div>

        {/* Guarantee footer bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 px-6 bg-white rounded-2xl border border-slate-100 shadow-sm"
        >
          {[
            "✅ 7-Day Risk Free Refund",
            "🔒 Secure Checkout",
            "📱 Instant Access After Enrollment",
            "🏆 Certificate of Completion",
          ].map((item, i) => (
            <span key={i} className="text-sm text-slate-500 font-semibold">{item}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
