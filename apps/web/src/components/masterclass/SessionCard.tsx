"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Calendar, Users, CheckCircle2, ChevronRight, Zap } from "lucide-react";
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

  // Find pricing for the selected currency
  let activePricing = session.pricing?.find((p: any) => p.currency === currency);
  if (!activePricing && session.pricing?.length > 0) {
    activePricing = session.pricing.find((p: any) => p.currency === "INR") || session.pricing[0];
  }

  // Fallback to top-level price if pricing array doesn't exist
  const displayPrice = activePricing?.price ?? session.price;
  const displayOriginalPrice = activePricing?.originalPrice ?? session.originalPrice;
  const displayCurrency = activePricing?.currency || currency;

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="h-full"
    >
      <Link href={`/masterclass/sessions/${session._id}`} className="block h-full">
        <div className="group bg-white rounded-[32px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 hover:border-slate-200 transition-all duration-500 flex flex-col h-full relative">
          
          {/* Status Overlay for Fully Booked */}
          {isFullyBooked && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
              <div className="bg-white px-6 py-3 rounded-2xl shadow-xl border border-red-100 transform -rotate-3">
                <span className="text-xl font-black text-red-600 uppercase tracking-widest">Fully Booked</span>
              </div>
            </div>
          )}

          {/* Thumbnail & Image Badge */}
          <div className="relative aspect-[16/10] w-full bg-slate-50 overflow-hidden">
            {session.thumbnail ? (
              <Image
                src={session.thumbnail}
                alt={session.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-200 gap-2">
                <Zap className="w-12 h-12" />
                <span className="text-[10px] font-black uppercase tracking-widest">Premium Session</span>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40" />

            {/* Floating Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-slate-900 shadow-sm border border-white/50 uppercase tracking-wider">
                {session.ageGroup}
              </div>
            </div>
            
            {spotsLeft <= 5 && !isFullyBooked && (
              <div className="absolute top-4 right-4 bg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-xl uppercase tracking-wider animate-pulse">
                {spotsLeft} Spots Left
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="p-8 flex flex-col flex-1">
            <h3 className="text-2xl font-black text-slate-900 mb-4 leading-tight group-hover:text-[hsl(var(--swago-purple))] transition-colors line-clamp-2 tracking-tight">
              {session.title}
            </h3>
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-2.5 text-slate-500">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[hsl(var(--swago-purple))]/5 group-hover:text-[hsl(var(--swago-purple))] transition-colors">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold truncate">{session.schedule}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-500">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[hsl(var(--swago-purple))]/5 group-hover:text-[hsl(var(--swago-purple))] transition-colors">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold truncate">{session.duration}</span>
              </div>
            </div>

            {/* Highlights Section */}
            {session.highlights && session.highlights.length > 0 && (
              <div className="mb-8 space-y-3 flex-1">
                {session.highlights.slice(0, 3).map((highlight: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 group/item">
                    <div className="w-5 h-5 rounded-lg bg-green-50 flex items-center justify-center text-green-500 group-hover/item:bg-green-500 group-hover/item:text-white transition-all">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                    <span className="text-sm font-bold text-slate-600 line-clamp-1 group-hover/item:text-slate-900 transition-colors tracking-tight">{highlight}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Price & Action Container */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-auto">
              <div>
                {displayOriginalPrice && (
                  <p className="text-[10px] text-slate-400 line-through font-black uppercase tracking-widest mb-1">
                    {formatPrice(displayOriginalPrice, displayCurrency)}
                  </p>
                )}
                <p className="text-3xl font-black text-slate-900 tracking-tight">
                  {formatPrice(displayPrice, displayCurrency)}
                </p>
              </div>
              
              <button
                onClick={(e) => {
                  if (onBook) {
                    e.preventDefault();
                    onBook();
                  }
                }}
                disabled={isFullyBooked}
                className={`flex items-center justify-center gap-2 sm:px-8 sm:py-4 px-4 py-2.5 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all duration-300 ${
                  isFullyBooked 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-[hsl(var(--swago-purple))] text-white hover:shadow-2xl hover:shadow-purple-500/40 hover:-translate-y-1 active:scale-95"
                }`}
              >
                <span>{isFullyBooked ? "Sold Out" : "Book Now"}</span>
                {!isFullyBooked && <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
