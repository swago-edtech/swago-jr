"use client";

import { CheckCircle2, Target, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function MasterclassAudience({ audience }: { audience: any[] }) {
  if (!audience || audience.length === 0) return null;

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-50 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/2 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-start gap-16 lg:gap-24">
          
          <div className="lg:w-5/12 space-y-8 sticky top-32">
            <div className="w-16 h-16 rounded-[24px] bg-[hsl(var(--swago-purple))]/5 flex items-center justify-center text-[hsl(var(--swago-purple))]">
              <Target className="w-8 h-8" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
                Designed for the <span className="text-[hsl(var(--swago-purple))]">Next Generation</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-md">
                Our curriculum is meticulously crafted to bridge the gap between classroom learning and real-world leadership.
              </p>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 w-max">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-bold text-slate-700">Perfect for ages 6 to 15</span>
            </div>
          </div>

          <div className="lg:w-7/12 space-y-6">
            {audience.map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group flex items-start gap-6 p-8 rounded-[32px] bg-white border border-slate-100 hover:border-slate-200 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-500"
              >
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 group-hover:scale-110 group-hover:bg-green-500 group-hover:text-white transition-all duration-500">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight group-hover:text-[hsl(var(--swago-purple))] transition-colors duration-500">{item.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
