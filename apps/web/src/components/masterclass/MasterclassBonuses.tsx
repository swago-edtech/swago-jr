"use client";

import Image from "next/image";
import { Gift, Sparkles, ChevronRight, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function MasterclassBonuses({ bonuses }: { bonuses: any[] }) {
  if (!bonuses || bonuses.length === 0) return null;

  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-20 space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 font-black px-6 py-2 rounded-full border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
          >
            <Gift className="w-5 h-5 animate-bounce" />
            <span className="text-xs uppercase tracking-[0.2em]">Exclusive Enrollment Bonus</span>
          </motion.div>
          
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">
            Unlock Bonuses Worth<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-300 to-yellow-500">
              Thousands for Free
            </span>
          </h2>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Enroll during this limited-time offer and gain instant access to a suite of professional resources to boost your child's journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {bonuses.map((bonus: any, idx: number) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="relative group h-full"
            >
              <div className="absolute inset-0 bg-yellow-500/20 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              
              <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-[32px] overflow-hidden flex flex-col h-full hover:border-yellow-500/30 hover:bg-slate-800 transition-all duration-500">
                {bonus.image && (
                  <div className="relative h-56 w-full overflow-hidden bg-slate-700">
                    <Image 
                      src={bonus.image} 
                      alt={bonus.title} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                    
                    <div className="absolute top-4 right-4 bg-yellow-500 text-slate-900 font-black px-4 py-1.5 rounded-full text-xs shadow-xl">
                      {bonus.value}
                    </div>
                  </div>
                )}
                
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                      <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight">{bonus.title}</h3>
                  </div>
                  
                  <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8 flex-1">
                    {bonus.description}
                  </p>
                  
                  <div className="flex items-center text-yellow-400 text-xs font-black uppercase tracking-widest gap-2 group/link">
                    <span>Includes Guidebook</span>
                    <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-20 text-center">
          <a 
            href="#sessions" 
            className="btn-shine inline-flex items-center justify-center bg-white text-slate-900 font-black px-12 py-5 rounded-[22px] text-xl hover:bg-yellow-500 hover:text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-1 group"
          >
            <span>Claim Your Bonuses</span>
            <Sparkles className="w-6 h-6 ml-3 text-yellow-600 group-hover:rotate-12 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}
