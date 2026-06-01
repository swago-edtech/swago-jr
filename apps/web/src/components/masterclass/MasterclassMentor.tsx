"use client";

import { BadgeCheck, Quote } from "lucide-react";
import { motion } from "framer-motion";

export default function MasterclassMentor({ mentor }: { mentor: any }) {
  if (!mentor || (!mentor.name && !mentor.bio)) return null;

  const stats = Array.isArray(mentor.stats) ? mentor.stats : [];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Light decorative blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-50 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-50 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section label */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 font-bold text-xs uppercase tracking-widest mb-4 border border-orange-100"
          >
            Meet Your Mentor
          </motion.div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Guided by an Expert
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-20">
          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full lg:w-5/12 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-3xl rotate-2 opacity-60 blur-sm" />
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] w-full border border-slate-200 shadow-xl bg-slate-100">
              {mentor.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mentor.image}
                  alt={mentor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-black text-xl tracking-widest uppercase">
                  Your Mentor
                </div>
              )}

              {/* Name badge overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 px-5 py-4 bg-white/90 backdrop-blur-sm border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-900 font-black text-lg leading-none">{mentor.name}</p>
                    <p className="text-slate-500 text-xs font-semibold mt-0.5">{mentor.title || mentor.role}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-orange-400 flex items-center justify-center shadow-md">
                    <BadgeCheck className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <div className="w-full lg:w-7/12 space-y-7">
            <Quote className="w-10 h-10 text-slate-200" />

            <div className="space-y-4">
              {mentor.bio?.split("\n").filter(Boolean).map((para: string, idx: number) => (
                <p key={idx} className="text-slate-600 font-medium leading-relaxed text-base sm:text-lg">
                  {para}
                </p>
              ))}
            </div>

            {/* Stats */}
            {stats.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {stats.map((stat: any, idx: number) => {
                  const isString = typeof stat === "string";
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.08 }}
                      className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 hover:border-orange-200 hover:bg-orange-50/30 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-100 transition-colors shrink-0">
                        <BadgeCheck className="w-5 h-5" />
                      </div>
                      <div>
                        {isString ? (
                          <p className="font-bold text-slate-900 text-sm">{stat}</p>
                        ) : (
                          <>
                            <p className="text-xl font-black text-slate-900 leading-none">{stat.count}</p>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{stat.platform}</p>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* CTA */}
            <motion.a
              href="#sessions"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-[hsl(var(--swago-purple))] text-white font-black px-8 py-4 rounded-full text-base shadow-[0_8px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 transition-all duration-300"
            >
              Enroll Now →
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  );
}
