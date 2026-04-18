// apps/web/src/components/lottery/CountdownTimer.tsx

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();

      // Target: Next Friday 7:00 PM IST (13:30 UTC)
      const nextCutoff = new Date();

      // Calculate days until Friday (5 = Friday)
      const daysUntilFriday = (5 - now.getDay() + 7) % 7;
      nextCutoff.setDate(now.getDate() + daysUntilFriday);

      // Set to 7 PM (19:00) IST
      nextCutoff.setHours(19, 0, 0, 0);

      // If we're past Friday 7 PM today, move to next Friday
      if (nextCutoff <= now) {
        nextCutoff.setDate(nextCutoff.getDate() + 7);
      }

      const difference = nextCutoff.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100 p-5 md:p-8 shadow-sm"
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 md:gap-8">
          {/* Days */}
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="bg-[hsl(var(--swago-purple))] text-white rounded-xl px-4 py-3 md:px-6 md:py-4 shadow-md">
              <span className="text-2xl md:text-4xl font-black">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
            </div>
            <span className="text-xs md:text-sm font-medium text-slate-600 mt-2">
              Days
            </span>
          </div>

          <span className="text-2xl md:text-3xl font-bold text-slate-400">:</span>

          {/* Hours */}
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="bg-[hsl(var(--swago-purple))] text-white rounded-xl px-4 py-3 md:px-6 md:py-4 shadow-md">
              <span className="text-2xl md:text-4xl font-black">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
            </div>
            <span className="text-xs md:text-sm font-medium text-slate-600 mt-2">
              Hours
            </span>
          </div>

          <span className="text-2xl md:text-3xl font-bold text-slate-400">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="bg-[hsl(var(--swago-purple))] text-white rounded-xl px-4 py-3 md:px-6 md:py-4 shadow-md">
              <span className="text-2xl md:text-4xl font-black">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
            </div>
            <span className="text-xs md:text-sm font-medium text-slate-600 mt-2">
              Minutes
            </span>
          </div>

          <span className="text-2xl md:text-3xl font-bold text-slate-400">:</span>

          {/* Seconds */}
          <div className="flex flex-col items-center min-w-[50px] md:min-w-[80px]">
            <div className="bg-[hsl(var(--swago-purple))] text-white rounded-xl px-4 py-3 md:px-6 md:py-4 shadow-md">
              <span className="text-2xl md:text-4xl font-black">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
            <span className="text-xs md:text-sm font-medium text-slate-600 mt-2">
              Seconds
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
