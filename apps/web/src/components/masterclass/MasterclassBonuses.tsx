"use client";

import { Gift, Star, CheckCircle2, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function MasterclassBonuses({ bonuses }: { bonuses: any[] }) {
  if (!bonuses || bonuses.length === 0) return null;

  return (
    <section className="py-20 bg-[#fffbf0] relative overflow-hidden">
      {/* Very subtle warm pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-yellow-100/60 rounded-full blur-[120px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-orange-100/50 rounded-full blur-[100px] translate-x-1/4 translate-y-1/3" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-14 space-y-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 font-bold px-5 py-2 rounded-full border border-yellow-200 text-xs uppercase tracking-widest"
          >
            <Gift className="w-4 h-4" />
            Exclusive Enrollment Bonus
          </motion.div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Unlock Bonuses Worth{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
              Thousands for Free
            </span>
          </h2>

          <p className="text-slate-500 max-w-xl mx-auto font-medium">
            Enroll during this limited-time offer and gain instant access to exclusive resources to accelerate learning.
          </p>
        </div>

        {/* Bonus Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bonuses.map((bonus: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white border border-yellow-100 rounded-2xl p-6 hover:border-yellow-300 hover:shadow-[0_8px_30px_rgba(251,191,36,0.12)] transition-all duration-300 flex flex-col"
            >
              {/* Value badge */}
              {bonus.value && (
                <div className="self-start mb-4 bg-yellow-400 text-slate-900 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                  Worth {bonus.value}
                </div>
              )}

              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 mb-4">
                <Zap className="w-5 h-5" />
              </div>

              <h3 className="text-slate-900 font-black text-lg leading-snug mb-2">{bonus.title}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed flex-1">{bonus.description}</p>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-xs text-green-600 font-bold">Included Free with Enrollment</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <a
            href="#sessions"
            className="inline-flex items-center justify-center gap-2 bg-[hsl(var(--swago-purple))] text-white font-black px-10 py-4 rounded-full text-base shadow-[0_8px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 transition-all duration-300"
          >
            Claim Your Bonuses →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
