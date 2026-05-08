"use client";

import Image from "next/image";
import { BadgeCheck, Quote } from "lucide-react";
import { motion } from "framer-motion";

export default function MasterclassMentor({ mentor }: { mentor: any }) {
  if (!mentor || (!mentor.name && !mentor.bio)) return null;

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100/50 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-100/50 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Mentor Visual Image Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full lg:w-5/12 relative"
          >
            <div className="absolute inset-0 bg-[hsl(var(--swago-purple))] rounded-[40px] rotate-3 opacity-5 translate-y-4" />
            
            <div className="relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-square w-full rounded-[40px] overflow-hidden shadow-2xl border-8 border-white bg-white group">
              {mentor.image ? (
                <Image 
                  src={mentor.image} 
                  alt={mentor.name} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700" 
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold bg-slate-50 uppercase tracking-widest">
                  The Mentor
                </div>
              )}
              
              {/* Floating Profile Details Badge */}
              <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/90 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none mb-1">{mentor.name}</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{mentor.title || mentor.role}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--swago-purple))] flex items-center justify-center text-white">
                  <BadgeCheck className="w-6 h-6" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mentor Bio Content */}
          <div className="w-full lg:w-7/12 space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Quote className="w-10 h-10 text-[hsl(var(--swago-purple))] opacity-20" />
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Guided by an Expert
                </h2>
              </div>
              
              <div className="prose prose-slate prose-lg">
                {mentor.bio?.split('\n').map((paragraph: string, idx: number) => (
                  <p key={idx} className="text-slate-600 font-medium leading-relaxed mb-6">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Accomplishments / Stats Grid */}
            {mentor.stats && mentor.stats.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {mentor.stats.map((stat: any, idx: number) => {
                  const isString = typeof stat === 'string';
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50 flex items-center gap-4 group hover:border-[hsl(var(--swago-purple))]/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[hsl(var(--swago-purple))]/5 flex items-center justify-center text-[hsl(var(--swago-purple))] group-hover:scale-110 transition-transform">
                        <BadgeCheck className="w-5 h-5" />
                      </div>
                      <div>
                        {isString ? (
                          <p className="font-black text-slate-900 text-sm tracking-tight">{stat}</p>
                        ) : (
                          <>
                            <p className="text-2xl font-black text-slate-900 leading-none">{stat.count}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{stat.platform}</p>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
