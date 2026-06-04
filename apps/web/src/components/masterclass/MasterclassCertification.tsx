"use client";

import { CheckCircle2, Award, Share2, Linkedin } from "lucide-react";
import { motion } from "framer-motion";

const certPoints = [
  { icon: Award, text: "Earn your credential of Expertise" },
  { icon: Share2, text: "Share your verified certificate" },
  { icon: Linkedin, text: "Add certificate to your LinkedIn" },
];

export default function MasterclassCertification({ certification }: { certification: any }) {
  if (!certification || (!certification.title && !certification.image)) return null;

  const points = certification.points && certification.points.length > 0
    ? certification.points.map((p: string) => ({ text: p }))
    : certPoints;

  return (
    <section className="py-20 bg-[#f8f8fc] relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        >
          {/* Text Content */}
          <div className="w-full lg:w-1/2 p-8 sm:p-12 space-y-8">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 font-bold text-xs uppercase tracking-widest mb-5 border border-purple-100"
              >
                <Award className="w-3.5 h-3.5" />
                Official Certification
              </motion.div>

              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-4">
                {certification.title || "Get Certified"}
              </h2>

              {certification.description && (
                <p className="text-slate-500 font-medium leading-relaxed">
                  {certification.description}
                </p>
              )}
            </div>

            {/* Certificate points */}
            <div className="space-y-4">
              {points.map((point: any, idx: number) => {
                const Icon = point.icon || CheckCircle2;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + idx * 0.08 }}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-slate-700 font-semibold text-sm sm:text-base">
                      {point.text}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <a
              href="#sessions"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 font-black px-8 py-4 rounded-full text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto"
            >
              Enroll Now →
            </a>
          </div>

          {/* Certificate Image */}
          <motion.div
            initial={{ opacity: 0, rotate: 3, scale: 0.95 }}
            whileInView={{ opacity: 1, rotate: 2, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", damping: 15 }}
            className="w-full lg:w-1/2 p-6 sm:p-10 flex items-center justify-center"
          >
            {certification.image ? (
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-8 border-slate-50 hover:rotate-0 transition-all duration-700 cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={certification.image}
                  alt="Certificate of Completion"
                  className="w-full h-full object-cover"
                />
                {/* Star badge */}
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full flex flex-col items-center justify-center shadow-xl rotate-12">
                  <Award className="w-7 h-7 text-slate-900" />
                  <span className="text-[8px] font-black text-slate-900 uppercase tracking-tight">Certified</span>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 gap-3 bg-slate-50">
                <Award className="w-12 h-12 opacity-40" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Certificate Preview</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
