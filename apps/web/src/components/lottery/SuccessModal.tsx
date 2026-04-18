// apps/web/src/components/lottery/SuccessModal.tsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import confetti from "canvas-confetti";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    ticket: {
      code: string;
      ticketType: string;
      productName: string;
      swagoMoneyEarned: number;
    };
    kidProfile: {
      name: string;
      newBalance: number;
      totalTickets: number;
    };
  };
}

export default function SuccessModal({ isOpen, onClose, data }: SuccessModalProps) {
  // Trigger confetti on mount
  useEffect(() => {
    if (isOpen) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#8B5CF6', '#EC4899', '#F59E0B'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#8B5CF6', '#EC4899', '#F59E0B'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden"
            >
              {/* Decorative Background */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-pink))] opacity-10"></div>

              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="text-8xl mb-4"
                >
                  🎉
                </motion.div>

                {/* Title */}
                <h2 className="text-3xl font-black text-slate-800 mb-2">
                  Ticket Claimed!
                </h2>
                <p className="text-slate-600 mb-6">
                  Good luck, {data.kidProfile.name}!
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Swago Money */}
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                    <p className="text-3xl font-black text-[hsl(var(--swago-orange))]">
                      +{data.ticket.swagoMoneyEarned}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">Swago Money</p>
                    <p className="text-xs text-slate-500 mt-1">
                      New: {data.kidProfile.newBalance}
                    </p>
                  </div>

                  {/* Total Tickets */}
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                    <p className="text-3xl font-black text-[hsl(var(--swago-purple))]">
                      {data.kidProfile.totalTickets}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">Total Tickets</p>
                    <p className="text-xs text-slate-500 mt-1">
                      This week
                    </p>
                  </div>
                </div>

                {/* Ticket Info */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    {data.ticket.ticketType}
                  </p>
                  <code className="text-xs font-mono bg-white px-3 py-1 rounded border border-slate-200">
                    {data.ticket.code}
                  </code>
                </div>

                {/* Close Button - Changed to Navigate to My Tickets */}
                <a
                  href="/lottery-code/my-tickets"
                  className="w-full block text-center bg-[hsl(var(--swago-orange))] text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl hover:opacity-90 transition-all"
                >
                  View My Tickets
                </a>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
