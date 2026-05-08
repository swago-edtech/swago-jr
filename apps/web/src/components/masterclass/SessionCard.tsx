"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Calendar, Users, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/hooks/useCurrency";

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
    <Link href={`/masterclass/sessions/${session._id}`} className="block h-full">
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 flex flex-col h-full hover:shadow-xl transition-shadow group relative">
        {/* Thumbnail */}
        <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
          {session.thumbnail ? (
            <Image
              src={session.thumbnail}
              alt={session.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              No Image
            </div>
          )}
          
          {/* Age Badge */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[hsl(var(--swago-purple))] shadow-sm">
            {session.ageGroup}
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight line-clamp-2">
            {session.title}
          </h3>
          
          {/* Key Info */}
          <div className="space-y-2 mb-4 text-sm text-slate-600">
            {session.schedule && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[hsl(var(--swago-purple))]" />
                <span>{session.schedule}</span>
              </div>
            )}
            {session.duration && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[hsl(var(--swago-purple))]" />
                <span>{session.duration}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[hsl(var(--swago-purple))]" />
              <span>
                {isFullyBooked ? (
                  <span className="text-red-500 font-medium">Fully Booked</span>
                ) : (
                  <span className="text-green-600 font-medium">{spotsLeft} spots left</span>
                )}
              </span>
            </div>
          </div>

          {/* Highlights */}
          {session.highlights && session.highlights.length > 0 && (
            <div className="mb-6 space-y-1.5 flex-1">
              {session.highlights.slice(0, 3).map((highlight: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{highlight}</span>
                </div>
              ))}
            </div>
          )}

          {/* Price & Action */}
          <div className="pt-4 border-t border-slate-100 flex items-end justify-between mt-auto">
            <div>
              {displayOriginalPrice && (
                <p className="text-sm text-slate-400 line-through mb-0.5">{formatPrice(displayOriginalPrice, displayCurrency)}</p>
              )}
              <p className="text-2xl font-black text-slate-900">{formatPrice(displayPrice, displayCurrency)}</p>
            </div>
            
            <button
              onClick={(e) => {
                if (onBook) {
                  e.preventDefault(); // Prevent navigating to detail page if clicked directly
                  onBook();
                }
              }}
              disabled={isFullyBooked}
              className={`btn-shine font-bold py-2.5 px-6 rounded-xl transition-all ${
                isFullyBooked 
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-[hsl(var(--swago-purple))] text-white hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5"
              }`}
            >
              {isFullyBooked ? "Sold Out" : onBook ? "Book Now" : "View Details"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
