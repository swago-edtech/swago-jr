"use client";

import { motion } from "framer-motion";

interface SwagoMoneyWidgetProps {
  balance: number;
}

export default function SwagoMoneyWidget({ balance }: SwagoMoneyWidgetProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-xl p-6 text-white"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="text-4xl">💰</div>
        <div>
          <p className="text-sm opacity-90 font-medium">Swago Money</p>
          <motion.p
            key={balance}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-3xl font-bold"
          >
            {balance}
          </motion.p>
        </div>
      </div>
      <div className="bg-white/20 backdrop-blur rounded-lg p-3 text-xs">
        <p className="font-medium">
          💡 Use Swago Money for discounts, blind bags & special rewards.
        </p>
      </div>
    </motion.div>
  );
}
