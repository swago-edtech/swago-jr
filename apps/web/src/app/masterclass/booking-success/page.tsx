"use client";

import Link from "next/link";
import { CheckCircle, ArrowRight, Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 flex items-center justify-center relative overflow-hidden">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} gravity={0.15} />}
      
      <div className="max-w-md w-full mx-4 bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center relative z-10">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-2">Booking Confirmed!</h1>
        <p className="text-slate-600 mb-8 font-medium">
          Thank you for booking. Your child's spot is secured!
        </p>
        
        <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left border border-slate-100">
          <p className="text-sm text-slate-500 mb-1 font-medium uppercase tracking-wider">Booking Reference</p>
          <p className="font-bold text-slate-900 text-lg mb-4">{bookingId || "MC-XXXXXX"}</p>
          
          <div className="flex items-start gap-3 mt-4 pt-4 border-t border-slate-200">
            <Calendar className="w-5 h-5 text-[hsl(var(--swago-purple))] shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">
              We'll send you an email with the exact schedule, meeting link, and details shortly.
            </p>
          </div>
        </div>
        
        <Link 
          href="/masterclass"
          className="btn-shine inline-flex items-center justify-center gap-2 w-full bg-[hsl(var(--swago-purple))] text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-1"
        >
          Explore More Masterclasses <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
