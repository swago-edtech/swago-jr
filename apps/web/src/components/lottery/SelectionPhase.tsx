// apps/web/src/components/lottery/SelectionPhase.tsx

"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface SelectionPhaseProps {
  onNext: (ticketType: 'SSR' | 'SDC') => void;
}

export default function SelectionPhase({ onNext }: SelectionPhaseProps) {
  const [selectedTicket, setSelectedTicket] = useState<'SSR' | 'SDC' | null>(null);

  const handleNext = () => {
    if (selectedTicket) {
      onNext(selectedTicket);
    }
  };

  const canProceed = !!selectedTicket;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6"
    >
      {/* Ticket Type Dropdown */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Select Ticket Type
        </label>
        <select
          value={selectedTicket || ''}
          onChange={(e) => setSelectedTicket(e.target.value as 'SSR' | 'SDC')}
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 bg-white font-medium text-black focus:border-[hsl(var(--swago-purple))] focus:ring-2 focus:ring-[hsl(var(--swago-purple))]/20 outline-none transition-all"
        >
          <option value="">Choose your ticket type...</option>
          <option value="SSR">💎 Diamond Ticket </option>
          <option value="SDC">🏆 Golden Ticket </option>
        </select>
      </div>

      {/* Next Button */}
      <motion.button
        whileHover={canProceed ? { scale: 1.02 } : {}}
        whileTap={canProceed ? { scale: 0.98 } : {}}
        onClick={handleNext}
        disabled={!canProceed}
        className={`
          w-full py-4 rounded-xl font-black text-lg shadow-lg transition-all
          ${canProceed
            ? 'bg-[hsl(var(--swago-orange))] text-white hover:shadow-xl cursor-pointer'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }
        `}
      >
        {!selectedTicket
          ? 'Select A Ticket Type'
          : 'Next: Enter Code →'
        }
      </motion.button>
    </motion.div>
  );
}
