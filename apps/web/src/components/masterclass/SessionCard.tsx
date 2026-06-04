"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Calendar, Users, CheckCircle2, ChevronRight, Zap, Shield } from "lucide-react";
import { formatPrice } from "@/hooks/useCurrency";
import { motion } from "framer-motion";

interface SessionCardProps {
  session: any;
  currency?: string;
  onBook?: () => void;
}

export default function SessionCard({ session, currency = "INR", onBook }: SessionCardProps) {
  const isFullyBooked = session.bookedSeats >= session.maxSeats;
  const spotsLeft = Math.max(0, session.maxSeats - session.bookedSeats);
  const pctBooked = Math.min(100, Math.round((session.bookedSeats / session.maxSeats) * 100));

  let activePricing = session.pricing?.find((p: any) => p.currency === currency);
  if (!activePricing && session.pricing?.length > 0) {
    activePricing = session.pricing.find((p: any) => p.currency === "INR") || session.pricing[0];
  }

  const displayPrice = activePricing?.price ?? session.price;
  const displayOriginalPrice = activePricing?.originalPrice ?? session.originalPrice;
  const displayCurrency = activePricing?.currency || currency;
  const discount = displayOriginalPrice && displayPrice
    ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
    : 0;

  const sessionSlug = session.title 
    ? encodeURIComponent(session.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')) 
    : session._id;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <div className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col h-full relative
        ${isFullyBooked
          ? "border-slate-200 opacity-75"
          : "border-slate-200 hover:border-purple-300 hover:shadow-[0_12px_40px_rgba(124,58,237,0.12)]"
        }`}
      >
        {/* Fully Booked Overlay */}
        {isFullyBooked && (
          <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-white px-6 py-3 rounded-2xl shadow-xl border border-red-100 -rotate-3">
              <span className="text-lg font-black text-red-600 uppercase tracking-widest">Fully Booked</span>
            </div>
          </div>
        )}

        {/* Thumbnail */}
        <div className="relative aspect-video w-full bg-slate-100 overflow-hidden shrink-0">
          {session.thumbnail ? (
            <Image
              src={session.thumbnail}
              alt={session.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2 bg-gradient-to-br from-purple-50 to-indigo-50">
              <Zap className="w-10 h-10 text-purple-200" />
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">Premium Session</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Age badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur text-slate-800 text-[10px] font-black px-3 py-1 rounded-full shadow-sm uppercase tracking-wide">
              {session.ageGroup}
            </span>
          </div>

          {/* Discount badge */}
          {discount > 0 && !isFullyBooked && (
            <div className="absolute top-3 right-3">
              <span className="bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm uppercase tracking-wide">
                {discount}% OFF
              </span>
            </div>
          )}

          {/* Spots left warning */}
          {spotsLeft <= 5 && !isFullyBooked && (
            <div className="absolute bottom-3 left-3">
              <span className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse">
                ⚡ Only {spotsLeft} spots left!
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-xl font-black text-slate-900 mb-3 leading-tight tracking-tight line-clamp-2 group-hover:text-purple-700 transition-colors">
            {session.title}
          </h3>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-5">
            {session.schedule && (
              <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                {session.schedule}
              </span>
            )}
            {session.duration && (
              <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                {session.duration}
              </span>
            )}
          </div>

          {/* Highlights */}
          {session.highlights && session.highlights.length > 0 && (
            <ul className="space-y-2 mb-6 flex-1">
              {session.highlights.slice(0, 3).map((h: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-600 font-medium leading-snug">{h}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Seats progress */}
          {!isFullyBooked && session.maxSeats > 0 && (
            <div className="mb-5">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {session.bookedSeats} / {session.maxSeats} enrolled
                </span>
                <span className="text-[11px] font-black text-orange-500">{spotsLeft} left</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${pctBooked}%` }}
                />
              </div>
            </div>
          )}

          {/* Price + CTA */}
          <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between gap-3">
            <div>
              {displayOriginalPrice && (
                <p className="text-xs text-slate-400 line-through font-semibold mb-0.5">
                  {formatPrice(displayOriginalPrice, displayCurrency)}
                </p>
              )}
              <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">
                {formatPrice(displayPrice, displayCurrency)}
              </p>
            </div>

            <button
              onClick={(e) => {
                if (onBook) { e.preventDefault(); onBook(); }
              }}
              disabled={isFullyBooked}
              className={`shrink-0 flex items-center gap-1.5 px-5 py-3 rounded-xl font-black text-sm transition-all duration-200 ${
                isFullyBooked
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-[hsl(var(--swago-purple))] text-white shadow-[0_8px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 active:scale-95"
              }`}
            >
              {isFullyBooked ? "Sold Out" : "Enroll"}
              {!isFullyBooked && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Guarantee note */}
          {!isFullyBooked && (
            <p className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-3">
              <Shield className="w-3 h-3 text-green-400" />
              7-Day Risk Free Refund
            </p>
          )}
        </div>

        {/* View Details link */}
        <Link
          href={`/masterclass/sessions/${sessionSlug}`}
          className="block mx-6 mb-5 text-center text-orange-500 hover:text-orange-700 text-xs font-bold underline underline-offset-2 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          View Full Details
        </Link>
      </div>
    </motion.div>
  );
}
