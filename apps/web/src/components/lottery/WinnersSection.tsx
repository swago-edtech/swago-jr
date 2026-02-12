// apps/web/src/components/lottery/WinnersSection.tsx

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface Winner {
  name: string;
  city: string;
  prize: string;
  avatar: string;
  ticketCode: string;
}

export default function WinnersSection() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const res = await fetch("/api/lottery/winners");
        const data = await res.json();
        if (data.success) {
          setWinners(data.winners);
        }
      } catch (error) {
        console.error("Error fetching winners:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWinners();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-2xl shadow-lg p-6 md:p-8"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🏆</span>
        <h2 className="text-2xl font-bold text-slate-800">
          Lottery Winners
        </h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : winners.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-medium">First winner being selected this Friday!</p>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {winners.map((winner, index) => (
            <motion.div
              key={winner.ticketCode}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="flex items-center justify-between bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors border border-slate-100"
            >
              {/* Left: Avatar + Name */}
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 border-2 border-white shadow-sm font-bold text-[hsl(var(--swago-purple))] flex items-center justify-center text-xl">
                  {winner.name.charAt(0)}
                </div>

                <div>
                  <p className="font-bold text-slate-800 text-lg">
                    {winner.name}
                  </p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Winner #{winner.ticketCode.slice(-4)}
                  </p>
                  <div className="w-16 h-1 bg-[hsl(var(--swago-purple))]/20 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-[hsl(var(--swago-purple))] w-full"></div>
                  </div>
                </div>
              </div>

              {/* Right: Prize Badge */}
              <div className="bg-gradient-to-r from-[hsl(var(--swago-orange))] to-orange-400 text-white px-4 py-2 rounded-full text-xs font-black shadow-sm uppercase tracking-tighter">
                {winner.prize}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* View All Button */}
      <button
        className="w-full bg-[hsl(var(--swago-purple))] text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group mt-4"
      >
        <span className="group-hover:tracking-wider transition-all">ALL WINNERS</span>
        <svg
          className="w-5 h-5 group-hover:translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <p className="text-center text-xs text-slate-500 mt-2">
        Coming soon
      </p>
    </motion.div>
  );
}
