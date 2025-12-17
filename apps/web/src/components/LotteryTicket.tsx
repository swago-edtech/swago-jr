"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface LotteryTicketProps {
  ticketNumber: string;
}

export default function LotteryTicket({ ticketNumber }: LotteryTicketProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ticketNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative"
    >
      {/* Ticket Card */}
      <div className="relative bg-gradient-to-br from-[hsl(var(--swago-purple))] via-[hsl(var(--swago-pink))] to-[hsl(var(--swago-orange))] p-1 rounded-3xl shadow-2xl">
        <div className="bg-white rounded-3xl p-8 md:p-12">
          
          {/* Ticket Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-pink))] text-white px-6 py-2 rounded-full font-bold text-sm mb-4">
              SWAGO PASS LOTTERY
            </div>
            <h2 className="text-2xl font-black text-slate-800">Your Lucky Ticket</h2>
          </div>

          {/* Ticket Number Display */}
          <div className="bg-slate-50 rounded-2xl p-6 mb-6 border-2 border-dashed border-[hsl(var(--swago-purple))]/30">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 text-center">Ticket Number</p>
            <p className="text-2xl md:text-3xl font-mono font-bold text-center text-slate-800 break-all">
              {ticketNumber}
            </p>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="w-full bg-gradient-to-r from-[hsl(var(--swago-teal))] to-[hsl(var(--swago-purple))] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Ticket Number
              </>
            )}
          </button>

          {/* Ticket Details */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <p className="text-slate-500 mb-1">Format</p>
                <p className="font-bold text-slate-700">YYYY-MM-W#-DDHHMM-HEX</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500 mb-1">Type</p>
                <p className="font-bold text-slate-700">Unlimited Draw</p>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-8 left-0 w-8 h-8 bg-white rounded-full -translate-x-1/2 border-4 border-[hsl(var(--swago-purple))]"></div>
          <div className="absolute top-8 right-0 w-8 h-8 bg-white rounded-full translate-x-1/2 border-4 border-[hsl(var(--swago-purple))]"></div>
          <div className="absolute bottom-8 left-0 w-8 h-8 bg-white rounded-full -translate-x-1/2 border-4 border-[hsl(var(--swago-pink))]"></div>
          <div className="absolute bottom-8 right-0 w-8 h-8 bg-white rounded-full translate-x-1/2 border-4 border-[hsl(var(--swago-pink))]"></div>

        </div>
      </div>

      {/* Success Confetti Effect (optional) */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 0] }}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute inset-0 pointer-events-none"
      >
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: -100 }}
            transition={{ duration: 1, delay: 0.2 + i * 0.05 }}
            className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
            style={{
              backgroundColor: ["hsl(var(--swago-purple))", "hsl(var(--swago-pink))", "hsl(var(--swago-orange))", "hsl(var(--swago-teal))"][i % 4],
              left: `${50 + (i - 6) * 8}%`,
            }}
          />
        ))}
      </motion.div>

    </motion.div>
  );
}
