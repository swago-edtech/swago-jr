"use client";

import { CheckCircle2, Star, Play, Users, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function MasterclassHero({ hero }: { hero: any }) {
  if (!hero || (!hero.headline && !hero.videoUrl)) return null;

  return (
    <section className="relative w-full bg-slate-50 pt-12 pb-20 sm:pt-20 sm:pb-32 overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-[hsl(var(--swago-purple))]/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 -left-24 w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-8 sm:space-y-12">
          
          {/* Trust Badge / Eyebrow */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
              ))}
            </div>
            <span className="text-xs font-black text-slate-900 tracking-wider uppercase">Joined by 10k+ Students</span>
          </motion.div>

          {/* Headline Section */}
          <div className="space-y-6 max-w-4xl">
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight"
            >
              {hero.headline}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed"
            >
              {hero.subheadline}
            </motion.p>
          </div>

          {/* Main Content Area: Video & Stats */}
          <div className="w-full flex flex-col items-center gap-12">
            
            {/* Premium Video Container */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", damping: 20 }}
              className="relative w-full max-w-5xl group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--swago-purple))] to-blue-500 rounded-[32px] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
              
              <div className="relative aspect-video w-full rounded-[32px] overflow-hidden shadow-2xl border-4 border-white bg-slate-900">
                {hero.videoUrl ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${hero.videoUrl}?rel=0&modestbranding=1`}
                    title="Masterclass Video"
                    className="w-full h-full absolute inset-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/40 space-y-4">
                    <Play className="w-16 h-16" />
                    <p className="font-bold tracking-widest uppercase">Preview Coming Soon</p>
                  </div>
                )}
              </div>

              {/* Floating Stat Badges */}
              <div className="hidden lg:flex absolute -left-12 top-12 flex-col gap-4 animate-float">
                <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600">
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-900 leading-none">4.9/5</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Student Rating</p>
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex absolute -right-12 bottom-12 flex-col gap-4 animate-float-delayed">
                <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-900 leading-none">12k+</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Active Alumni</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Mobile Stats & CTA */}
            <div className="flex flex-col items-center gap-8 w-full max-w-md">
              <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                {hero.stats?.map((stat: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center">
                    <span className="text-2xl font-black text-slate-900 leading-none">{stat.value}</span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">{stat.label}</span>
                  </div>
                ))}
              </div>

              <div className="w-full space-y-4">
                <a 
                  href="#sessions" 
                  className="btn-shine w-full flex items-center justify-center bg-[hsl(var(--swago-purple))] text-white font-black px-8 py-5 rounded-[22px] text-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:-translate-y-1 active:scale-[0.98]"
                >
                  Explore Sessions
                </a>
                
                {hero.guaranteeBadge && (
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500">
                    <Award className="w-4 h-4 text-green-500" />
                    <span>{hero.guaranteeBadge}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 5s ease-in-out infinite; }
      `}</style>
    </section>
  );
}
