"use client";

import { useRef } from "react";
import { Video, Clock, CheckCircle2, BookOpen } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

const ModuleCard = ({ mod, idx, total, progress }: { mod: any, idx: number, total: number, progress: any }) => {
  const points = mod.highlights || mod.points || [];
  
  // Calculate relative progress for this specific card
  // When scroll passes this card, it scales down slightly
  const targetScale = 1 - ((total - idx) * 0.02);
  const scale = useTransform(progress, [idx / total, 1], [1, targetScale]);
  
  return (
    <motion.div
      style={{
        scale,
        top: `calc(12vh + ${idx * 15}px)`
      }}
      className="sticky w-full rounded-[32px] border border-purple-100 bg-white shadow-[0_12px_40px_rgba(124,58,237,0.08)] overflow-hidden mb-6 sm:mb-12 origin-top"
    >
      <div className="p-8 sm:p-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          {/* Left Column: Title & Meta */}
          <div className="lg:w-1/3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 font-black text-xl mb-6 border border-orange-100">
              {String(idx + 1).padStart(2, "0")}
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-4">
              {mod.title}
            </h3>
            
            <div className="flex flex-col gap-3">
              {points.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold">
                  <Video className="w-4 h-4 text-orange-400" />
                  {points.length} lessons
                </div>
              )}
              {mod.duration && (
                <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold">
                  <Clock className="w-4 h-4 text-orange-400" />
                  {mod.duration}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Details & Highlights */}
          <div className="lg:w-2/3">
            {mod.description && (
              <p className="text-slate-600 font-medium text-base sm:text-lg leading-relaxed mb-8">
                {mod.description}
              </p>
            )}
            
            {points.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  Key Takeaways
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  {points.map((point: string, pIdx: number) => (
                    <div key={pIdx} className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-slate-700 font-medium text-sm leading-relaxed">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function MasterclassModules({ modules }: { modules: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  if (!modules || modules.length === 0) return null;

  return (
    <section ref={containerRef} className="py-24 bg-slate-50 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 font-bold text-xs uppercase tracking-widest mb-4 border border-orange-100"
          >
            Course Curriculum
          </motion.div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            What You'll Learn
          </h2>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto text-base sm:text-xl">
            A structured, step-by-step journey that transforms your child's communication, confidence, and leadership skills.
          </p>
        </div>

        {/* Stacking Cards Container */}
        <div className="relative pb-24">
          {modules.map((mod: any, idx: number) => (
            <ModuleCard 
              key={idx}
              mod={mod}
              idx={idx}
              total={modules.length}
              progress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
