"use client";

import { CheckCircle2, Star, Play, Users, Shield, Clock, Video } from "lucide-react";
import { motion } from "framer-motion";

export default function MasterclassHero({ hero }: { hero: any }) {
  if (!hero || (!hero.headline && !hero.videoUrl)) return null;

  const trustItems = [
    { icon: Video, text: "13+ Hrs of Video Content" },
    { icon: Users, text: "Live Sessions for 1 Year" },
    { icon: Shield, text: "7-Day Risk Free Refund" },
  ];

  return (
    <>
      {/* TOP TRUST BAR — thin yellow accent strip */}
      <div className="w-full bg-[#fff8e1] border-b border-yellow-200 py-2.5 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-1.5">
          {trustItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <item.icon className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="relative w-full bg-white overflow-hidden">
        {/* Subtle warm background tint */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-yellow-50 rounded-full blur-[120px] opacity-70" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-orange-50 rounded-full blur-[80px] opacity-50" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 pt-14 pb-10 sm:pt-20 sm:pb-14">

          {/* Star rating badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-8"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-50 border border-slate-200 shadow-sm">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-700">
                {hero.stats?.[0]?.label ?? "14k+ reviews (4.9 of 5)"}
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <div className="text-center space-y-5 mb-10">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.08] tracking-tight"
            >
              {hero.headline}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed"
            >
              {hero.subheadline}
            </motion.p>

            {/* Bullet trust items under headline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-1"
            >
              {trustItems.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3"
            >
              <a
                href="#sessions"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[hsl(var(--swago-purple))] text-white font-black px-10 py-4 rounded-full text-lg shadow-[0_8px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.5)] hover:-translate-y-1 transition-all duration-300 active:scale-95"
              >
                Enroll Now
              </a>
              {hero.guaranteeBadge && (
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>{hero.guaranteeBadge}</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Video embed */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, type: "spring", damping: 20 }}
            className="relative w-full max-w-3xl mx-auto group"
          >
            {/* Subtle glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-200/60 via-orange-100/40 to-yellow-200/60 rounded-3xl blur-2xl opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-100">
              {hero.videoUrl ? (
                <iframe
                  src={`https://www.youtube.com/embed/${hero.videoUrl}?rel=0&modestbranding=1`}
                  title="Masterclass Introduction"
                  className="w-full h-full absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                  <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                    <Play className="w-10 h-10 ml-1 text-slate-400" />
                  </div>
                  <p className="font-bold tracking-widest uppercase text-xs text-slate-400">Video Preview Coming Soon</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Stats Bar */}
        {hero.stats && hero.stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="border-t border-slate-100 bg-slate-50"
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
              <div className="flex flex-wrap justify-center sm:justify-around gap-8">
                {hero.stats.map((stat: any, idx: number) => (
                  <div key={idx} className="text-center">
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                      {stat.value || stat.label}
                    </p>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1.5">
                      {stat.label || stat.subtext}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </section>
    </>
  );
}
