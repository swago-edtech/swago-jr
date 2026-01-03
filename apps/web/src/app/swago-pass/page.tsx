"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSharedContext } from "@/context/SharedContext";
import { motion, AnimatePresence } from "framer-motion";

type Ticket = {
  code: string;
  productName: string;
  shortForm: string;
  redeemedAt: string;
};

export default function SwagoPassPage() {
  const { user, isLoadingUser } = useSharedContext();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Redemption state
  const [code, setCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState("");
  const [successTicket, setSuccessTicket] = useState<Ticket | null>(null);
  
  // My Tickets state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [showMyTickets, setShowMyTickets] = useState(false);

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

  // Fetch user's tickets
  useEffect(() => {
    if (user && mounted) {
      fetchMyTickets();
    }
  }, [user, mounted]);

  const fetchMyTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await fetch("/api/lottery/my-tickets");
      const data = await res.json();

      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Handle code redemption
  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessTicket(null);

    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedCode) {
      setError("Please enter a lottery code");
      return;
    }

    // Basic format validation
    if (!/^SWAGO-[A-Z0-9]{2,10}-[A-Z0-9]{6}$/.test(trimmedCode)) {
      setError("Invalid code format. Use format: SWAGO-XXX-XXXXXX");
      return;
    }

    try {
      setIsRedeeming(true);

      const res = await fetch("/api/lottery/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmedCode }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessTicket(data.ticket);
        setCode("");
        // Refresh tickets list
        fetchMyTickets();
      } else {
        setError(data.error || "Failed to redeem code");
      }
    } catch (err) {
      console.error("Error redeeming code:", err);
      setError("Failed to redeem code. Please try again.");
    } finally {
      setIsRedeeming(false);
    }
  };

  // Auto-format code input
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCode(value);
    setError("");
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
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-slate-800 mb-4">
            <span className="text-[hsl(var(--swago-purple))]">Swago Pass</span> Lottery
          </h1>
          <p className="text-slate-600 text-lg">
            Enter your lottery code to redeem prizes!
          </p>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {successTicket && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="mb-8 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">🎉 Code Redeemed Successfully!</h3>
                  <p className="text-green-50 mb-1">
                    <span className="font-semibold">Product:</span> {successTicket.productName}
                  </p>
                  <p className="text-green-50 mb-1">
                    <span className="font-semibold">Code:</span> {successTicket.code}
                  </p>
                  <p className="text-green-50 text-sm">
                    Redeemed on {new Date(successTicket.redeemedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSuccessTicket(null)}
                  className="flex-shrink-0 text-white hover:text-green-100 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Redemption Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Enter Lottery Code</h2>
          
          <form onSubmit={handleRedeem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Lottery Code
              </label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="SWAGO-XXX-XXXXXX"
                disabled={isRedeeming}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl font-mono text-lg text-slate-800 placeholder-slate-400 focus:border-[hsl(var(--swago-purple))] focus:outline-none focus:ring-4 focus:ring-purple-100 disabled:bg-slate-100 disabled:cursor-not-allowed transition"
              />
              <p className="text-xs text-slate-500 mt-2">
                Format: SWAGO-[SHORT_FORM]-[6_DIGITS] (e.g., SWAGO-TST-A1B2C3)
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isRedeeming || !code.trim()}
              className="w-full bg-gradient-to-r from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-pink))] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
              {isRedeeming ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Redeeming...
                </>
              ) : (
                <>
                  🎟️ Redeem Code
                </>
              )}
            </button>
          </form>
        </div>

        {/* My Tickets Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">My Lottery Tickets</h2>
            <button
              onClick={() => setShowMyTickets(!showMyTickets)}
              className="text-[hsl(var(--swago-purple))] font-semibold flex items-center gap-2 hover:underline"
            >
              {showMyTickets ? "Hide" : "Show"} ({tickets.length})
              <svg 
                className={`w-5 h-5 transition-transform ${showMyTickets ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {showMyTickets && (
            <div>
              {loadingTickets ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--swago-purple))] mx-auto"></div>
                  <p className="text-slate-600 mt-4">Loading tickets...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-medium">No tickets yet</p>
                  <p className="text-slate-500 text-sm mt-1">Redeem a lottery code to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-2 border-slate-200 rounded-xl p-4 hover:border-[hsl(var(--swago-purple))] hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-block px-3 py-1 bg-[hsl(var(--swago-purple))]/10 text-[hsl(var(--swago-purple))] rounded-full text-xs font-bold">
                              {ticket.shortForm}
                            </span>
                            <h3 className="font-bold text-slate-800">{ticket.productName}</h3>
                          </div>
                          <p className="font-mono text-sm text-slate-600 mb-1">{ticket.code}</p>
                          <p className="text-xs text-slate-500">
                            Redeemed on {new Date(ticket.redeemedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-pink))] rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
