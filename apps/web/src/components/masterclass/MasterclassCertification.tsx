"use client";

import Image from "next/image";
import { Award, CheckCircle2, Star, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function MasterclassCertification({ certification }: { certification: any }) {
  if (!certification || (!certification.title && !certification.image)) return null;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-[48px] p-8 md:p-16 lg:p-20 border border-slate-100 overflow-hidden"
        >
          {/* Decorative background splashes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[hsl(var(--swago-purple))]/5 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100/40 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 bg-white px-5 py-2 rounded-full shadow-sm border border-slate-100">
                  <Award className="w-5 h-5 text-[hsl(var(--swago-purple))]" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Official Certification</span>
                </div>
                
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
                  {certification.title || "Get Certified"}
                </h2>
                
                {certification.description && (
                  <p className="text-lg sm:text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
                    {certification.description}
                  </p>
                )}
              </div>

              {certification.points && certification.points.length > 0 && (
                <div className="grid grid-cols-1 gap-5">
                  {certification.points.map((point: string, idx: number) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="flex items-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[hsl(var(--swago-purple))] shadow-sm group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="text-slate-800 font-bold text-lg tracking-tight">{point}</span>
                    </motion.div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-2 px-6 py-3 bg-[hsl(var(--swago-purple))]/10 rounded-2xl w-max">
                <Sparkles className="w-5 h-5 text-[hsl(var(--swago-purple))]" />
                <span className="text-sm font-black text-[hsl(var(--swago-purple))] uppercase tracking-widest">Globally Recognized Credentials</span>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 2 }}
              viewport={{ once: true }}
              transition={{ type: "spring", damping: 15 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-slate-900/5 rounded-3xl translate-x-4 translate-y-4 blur-xl group-hover:translate-x-6 group-hover:translate-y-6 transition-transform" />
              
              {certification.image ? (
                <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden shadow-2xl border-[12px] border-white bg-white group-hover:rotate-0 transition-all duration-700">
                  <Image 
                    src={certification.image} 
                    alt="Certificate" 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="aspect-[4/3] w-full rounded-3xl border-4 border-dashed border-slate-200 flex items-center justify-center text-slate-300 bg-white font-black uppercase tracking-widest">
                  Preview Certificate
                </div>
              )}
              
              {/* Floating element */}
              <div className="absolute -bottom-10 -right-10 hidden sm:flex flex-col items-center justify-center w-28 h-28 bg-white rounded-full shadow-2xl border-4 border-slate-50 rotate-12 group-hover:rotate-0 transition-all duration-700">
                <Star className="w-10 h-10 text-yellow-500 fill-yellow-500" />
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter mt-1">Certified</span>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
