// apps/web/src/components/lottery/WinnersSection.tsx

"use client";

import { motion } from "framer-motion";
import Image from "next/image";

// Static mock winners (as requested)
const MOCK_WINNERS = [
  {
    name: "Riya",
    city: "Pune",
    prize: "Free Blind Bag",
    avatar: "/images/kid_girl1.png",
  },
  {
    name: "Aarav",
    city: "Pune",
    prize: "Free Blind Bag",
    avatar: "/images/kid_boy1.png",
  },
];

export default function WinnersSection() {
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

      {/* Winners List */}
      <div className="space-y-4 mb-6">
        {MOCK_WINNERS.map((winner, index) => (
          <motion.div
            key={winner.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="flex items-center justify-between bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors"
          >
            {/* Left: Avatar + Name */}
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                <Image
                  src={winner.avatar}
                  alt={winner.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/swoo.png";
                  }}
                />
              </div>
              
              <div>
                <p className="font-bold text-slate-800 text-lg">
                  {winner.name}
                </p>
                <p className="text-sm text-slate-600">
                  {winner.city}
                </p>
                {/* Progress bar (decorative) */}
                <div className="w-20 h-1 bg-slate-300 rounded-full mt-1"></div>
              </div>
            </div>

            {/* Right: Prize Badge */}
            <div className="bg-[hsl(var(--swago-orange))] text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
              {winner.prize}
            </div>
          </motion.div>
        ))}
      </div>

      {/* View All Button */}
      <button
        disabled
        className="w-full bg-[hsl(var(--swago-purple))] text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span>VIEW ALL WINNERS</span>
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <p className="text-center text-xs text-slate-500 mt-2">
        Coming soon
      </p>
    </motion.div>
  );
}
