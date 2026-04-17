"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AmbassadorCTA() {
  return (
    <section className="bg-white py-0 md:py-4 px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-8"
        >
          Start Your Child&apos;s Skill Journey Today
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

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-[#7464a9] hover:bg-[#605291] text-white font-black text-xl md:text-2xl px-12 py-5 rounded-2xl transition-all shadow-xl shadow-purple-900/20 hover:shadow-purple-900/30 active:scale-95 group mb-8"
          >
            Get Started Now
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="currentColor"
              className="w-6 h-6 transform group-hover:translate-x-1 transition-transform"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </motion.div>

        {/* Footer Text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-sm font-semibold text-slate-400 uppercase tracking-widest"
        >
          First box ships within 5-7 business days
        </motion.p>
      </div>
    </section>
  );
}
