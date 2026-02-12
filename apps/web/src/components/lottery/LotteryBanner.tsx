// apps/web/src/components/lottery/LotteryBanner.tsx

"use client";

import { motion } from "framer-motion";
import CountdownTimer from ".//CountdownTimer";

export default function LotteryBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8 bg-[hsl(var(--swago-purple))]/10 py-10"
    >

      <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">
        <span className="text-[hsl(var(--swago-purple))]">Claim Your Swago</span>
        <br />
        Lottery Ticket
      </h1>

      <p className="text-slate-600 text-lg max-w-2xl mx-auto py-6">
        Claim your ticket before <span className="font-bold text-[hsl(var(--swago-purple))]">Wednesday 8:00 PM IST</span> to be eligible for this week&apos;s Friday draw.
        <br />
        <span className="text-sm mt-2 block">
          Enter your box code to earn <span className="font-bold text-[hsl(var(--swago-orange))]">10 Swago Dollars</span> instantly!
        </span>
      </p>

      <CountdownTimer />
    </motion.div>
  );
}
