"use client";

import { motion } from "framer-motion";

interface Badge {
  name: string;
  awardedAt: Date | string;
}

interface BadgeDisplayProps {
  badges: Badge[];
}

const badgeEmojis: { [key: string]: string } = {
  "Swago Saviour": "🦸",
  "Entry Master": "🎬",
  "Brain Champion": "🧠",
  "Brand Ambassador": "⭐",
};

export default function BadgeDisplay({ badges }: BadgeDisplayProps) {
  if (!badges || badges.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>🏆</span> Your Badges
      </h3>
      
      <div className="flex flex-wrap gap-4">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.name}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: index * 0.1, type: "spring" }}
            className="relative group"
          >
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-4 flex flex-col items-center gap-2 min-w-[120px] border-2 border-purple-300 hover:border-purple-500 transition-all hover:scale-105 cursor-pointer">
              <div className="text-4xl">
                {badgeEmojis[badge.name] || "🎖️"}
              </div>
              <p className="text-xs font-bold text-gray-800 text-center">
                {badge.name}
              </p>
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Awarded on {new Date(badge.awardedAt).toLocaleDateString()}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
