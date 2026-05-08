"use client";

import { CheckCircle2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function MasterclassModules({ modules }: { modules: any[] }) {
  if (!modules || modules.length === 0) return null;

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -translate-x-1/2 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-[hsl(var(--swago-purple))]/10 text-[hsl(var(--swago-purple))] font-black text-[10px] uppercase tracking-widest mb-4"
          >
            Detailed Curriculum
          </motion.div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            The Learning Roadmap
          </h2>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto">
            A comprehensive, step-by-step program designed to transform your child's communication skills over several weeks of intensive training.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {modules.map((mod: any, idx: number) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-[32px] p-8 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative"
            >
              {/* Module Number/Indicator */}
              <div className="absolute top-8 right-8 text-4xl font-black text-slate-100 transition-colors group-hover:text-slate-200">
                0{idx + 1}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="px-4 py-1.5 rounded-xl bg-white shadow-sm border border-slate-100 text-[hsl(var(--swago-purple))] font-black text-[11px] uppercase tracking-wider">
                  {mod.duration || `Week ${idx + 1}`}
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight leading-tight group-hover:text-[hsl(var(--swago-purple))] transition-colors">
                {mod.title}
              </h3>
              
              <p className="text-slate-500 text-sm mb-8 font-medium leading-relaxed">
                {mod.description}
              </p>
              
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Core Highlights</p>
                {(mod.highlights || mod.points || []).map((point: string, pIdx: number) => (
                  <div key={pIdx} className="flex items-center gap-3 group/item">
                    <div className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-green-500 shadow-sm group-hover/item:border-green-200 group-hover/item:bg-green-50 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-slate-700 font-bold text-sm tracking-tight">{point}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
