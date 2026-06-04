"use client";

import { CheckCircle2, Users, Briefcase, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

const ICONS = [Users, Briefcase, GraduationCap];
const COLORS = [
  { bg: "bg-blue-50", border: "border-blue-100", icon: "text-blue-600", accent: "bg-blue-600" },
  { bg: "bg-orange-50", border: "border-orange-100", icon: "text-orange-600", accent: "bg-orange-600" },
  { bg: "bg-purple-50", border: "border-purple-100", icon: "text-purple-600", accent: "bg-purple-600" },
];

export default function MasterclassAudience({ audience }: { audience: any[] }) {
  if (!audience || audience.length === 0) return null;

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-yellow-50 text-yellow-700 font-bold text-xs uppercase tracking-widest mb-4 border border-yellow-200"
          >
            Who Is This For?
          </motion.div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
            This Masterclass Is{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              Perfect For
            </span>
          </h2>
          <p className="text-slate-500 font-medium max-w-xl mx-auto">
            Whether your child is shy or a budding leader, this program is specifically designed to meet them where they are.
          </p>
        </div>

        {/* Audience Cards — horizontal on large, vertical on small */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {audience.map((item, index) => {
            const Icon = ICONS[index % ICONS.length];
            const color = COLORS[index % COLORS.length];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative group rounded-2xl border ${color.border} ${color.bg} p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Accent top strip */}
                <div className={`absolute top-0 left-8 right-8 h-1 rounded-b-full ${color.accent} opacity-60`} />

                <div className={`w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-5 ${color.icon}`}>
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-3 leading-tight">
                  {item.title}
                </h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-6 flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${color.icon}`} />
                  <span className={`text-xs font-bold ${color.icon}`}>Tailored for you</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
