"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSharedContext } from "@/context/SharedContext";
import LotteryTicket from "@/components/LotteryTicket";

export default function SwagoPassPage() {
  const { user, isLoadingUser } = useSharedContext(); // ✅ FIXED: Changed from 'loading' to 'isLoadingUser'
  const router = useRouter();
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !isLoadingUser && !user) {
      router.push("/login?redirect=/swago-pass");
    }
  }, [user, isLoadingUser, router, mounted]);

  // Generate ticket number
  const generateTicket = () => {
    setIsGenerating(true);

    // Simulate generation animation delay
    setTimeout(() => {
      const now = new Date();
      
      // YYYY
      const year = now.getFullYear();
      
      // MM (01-12)
      const month = String(now.getMonth() + 1).padStart(2, "0");
      
      // W# (week of month: 1-4)
      const day = now.getDate();
      const weekOfMonth = Math.ceil(day / 7);
      
      // DDHHMM
      const dateTime = 
        String(now.getDate()).padStart(2, "0") +
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0");
      
      // HEX8 (8 random hex characters)
      const hex = Array.from({ length: 8 }, () => 
        Math.floor(Math.random() * 16).toString(16).toUpperCase()
      ).join("");
      
      // Final ticket: YYYY-MM-W#-DDHHMM-HEX8
      const ticket = `${year}-${month}-${weekOfMonth}-${dateTime}-${hex}`;
      
      setTicketNumber(ticket);
      setIsGenerating(false);
    }, 800);
  };

  // Show loading state while checking authentication
  if (!mounted || isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--swago-purple))] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--swago-purple))] mx-auto"></div>
          <p className="mt-4 text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-slate-800 mb-4">
            Welcome to <span className="text-[hsl(var(--swago-purple))]">Swago Pass</span> Lottery
          </h1>
          <p className="text-slate-600 text-lg">
            Generate your lucky ticket and join the excitement!
          </p>
        </div>

        {/* Generate Button */}
        {!ticketNumber && (
          <div className="text-center mb-12">
            <button
              onClick={generateTicket}
              disabled={isGenerating}
              className="btn-shine bg-gradient-to-r from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-pink))] text-white font-bold px-12 py-6 rounded-full text-2xl shadow-2xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </span>
              ) : (
                "🎟️ Generate Ticket"
              )}
            </button>
          </div>
        )}

        {/* Lottery Ticket Display */}
        {ticketNumber && (
          <div className="space-y-8">
            <LotteryTicket ticketNumber={ticketNumber} />
            
            {/* Generate Another Button */}
            <div className="text-center">
              <button
                onClick={generateTicket}
                disabled={isGenerating}
                className="btn-shine bg-gradient-to-r from-[hsl(var(--swago-orange))] to-[hsl(var(--swago-pink))] text-white font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:scale-105 transition-transform"
              >
                Generate Another Ticket
              </button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-purple-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">How It Works</h2>
          <ul className="space-y-3 text-slate-700">
            <li className="flex items-start gap-3">
              <span className="text-[hsl(var(--swago-purple))] text-xl">✓</span>
              <span>Click &quot;Generate Ticket&quot; to create your unique Swago Pass number</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[hsl(var(--swago-purple))] text-xl">✓</span>
              <span>Each ticket is timestamped with year, month, week, and exact time</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[hsl(var(--swago-purple))] text-xl">✓</span>
              <span>Copy your ticket number and keep it safe for future draws!</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
