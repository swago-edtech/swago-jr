"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Users, Gift } from "lucide-react";

export default function AmbassadorCTA() {
  return (
    <section className="w-full bg-slate-50 py-8 md:py-8 px-5">
      
      <div className="w-full text-center">
        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-6"
        >
          Start Your Child&apos;s SWAGO Journey Today
        </motion.h2>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed mb-12"
        >
          Give your child screen-free learning that builds real-life skills. Join thousands of happy families.
        </motion.p>

        {/* 3 BUTTON GROUP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col md:flex-row items-center justify-center gap-4 mb-10"
        >
          {/* Primary Action: Buy */}
          <Link
            href="/products"
            className="w-full md:w-auto inline-flex items-center justify-center gap-3 bg-[hsl(var(--swago-purple))] hover:bg-[#605291] text-white font-bold text-lg px-5 py-3 rounded-2xl transition-all shadow-xl shadow-purple-900/10 hover:shadow-purple-900/20 active:scale-95 group"
          >
            <ShoppingBag className="w-5 h-5" />
            Buy SWAGO Smart Box
          </Link>

          {/* Secondary Action: Community */}
          <Link
            href="https://whatsapp.com/channel/0029VbCEELmATRSt1LCXtP0w"
            className="w-full md:w-auto inline-flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:border-[#7464a9] text-slate-700 hover:text-[#7464a9] font-bold text-lg px-5 py-3 rounded-2xl transition-all active:scale-95"
          >
            <Users className="w-5 h-5" />
            Join Our Whatsapp Community
          </Link>

        </motion.div>

        {/* Footer Text */}
        {/* <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-xs font-bold text-slate-400 uppercase tracking-widest"
        >
          First box ships within 5-7 business days
        </motion.p> */}
      </div>
    </section>
  );
}