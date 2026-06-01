"use client";

import { Star, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";

function StarRating({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
}

export default function MasterclassTestimonials({ testimonials }: { testimonials: any[] }) {
  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="py-20 bg-[#efe7de] relative overflow-hidden">
      {/* WhatsApp-style subtle dots */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #888 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-white/60 text-slate-700 font-bold text-xs uppercase tracking-widest mb-4"
          >
            Student Reviews
          </motion.div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
            Don't Just Take Our Word For It
          </h2>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2 text-sm font-black text-slate-700">4.9 / 5 from 14,000+ students</span>
          </div>
        </div>

        {/* Masonry-style chat bubbles */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {testimonials.map((t, index) => {
            const isRight = index % 3 !== 1; // alternate layout
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 3) * 0.08 }}
                className="break-inside-avoid"
              >
                <div
                  className={`relative p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 ${
                    isRight
                      ? "bg-[#dcf8c6] rounded-tr-none ml-4"
                      : "bg-white rounded-tl-none mr-4"
                  }`}
                >
                  {/* Bubble tail */}
                  <div
                    className={`absolute top-0 w-0 h-0 ${
                      isRight
                        ? "-right-[10px] border-l-[10px] border-l-[#dcf8c6] border-y-[10px] border-y-transparent"
                        : "-left-[10px] border-r-[10px] border-r-white border-y-[10px] border-y-transparent"
                    }`}
                  />

                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-black text-xs shrink-0 overflow-hidden">
                      {t.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        t.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 leading-none">{t.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{t.role || "Verified Student"}</p>
                    </div>
                  </div>

                  <StarRating rating={t.rating || 5} />

                  <p className="text-slate-700 text-sm leading-relaxed mt-2">
                    {t.content || t.message}
                  </p>

                  {/* WhatsApp double tick */}
                  <div className="flex items-center justify-end gap-1 mt-2">
                    <span className="text-[9px] text-slate-400">
                      {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
