"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MasterclassFAQ({ faqs }: { faqs: any[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="py-20 bg-[#f8f8fc] relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest mb-4"
          >
            FAQ
          </motion.div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 font-medium max-w-lg mx-auto">
            Everything you need to know before enrolling. Can&apos;t find your answer?{" "}
            <a href="/contact" className="text-orange-500 hover:underline font-bold">
              Ask us directly.
            </a>
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
                className={`rounded-2xl border transition-all duration-200 ${
                  isOpen
                    ? "border-orange-200 bg-white shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-5 flex items-start justify-between text-left gap-4"
                >
                  <span className={`font-black text-base sm:text-lg leading-snug transition-colors ${
                    isOpen ? "text-orange-600" : "text-slate-900"
                  }`}>
                    {faq.question}
                  </span>
                  <div className={`shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isOpen
                      ? "bg-orange-400 text-white rotate-180"
                      : "bg-slate-100 text-slate-400"
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-0 border-t border-orange-100 mt-0">
                        <p className="text-slate-600 font-medium leading-relaxed pt-4">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA — white card instead of dark */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 p-8 sm:p-10 rounded-2xl bg-white border border-slate-200 shadow-sm text-center"
        >
          <p className="font-black text-xl text-slate-900 mb-2">
            Communication is a very important skill in life.
          </p>
          <p className="text-slate-500 text-sm font-medium mb-6">
            Hone it and your chances of succeeding increase proportionately.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#sessions"
              className="inline-flex items-center gap-2 bg-[hsl(var(--swago-purple))] text-white font-black px-8 py-4 rounded-full text-base shadow-[0_8px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 transition-all duration-300"
            >
              Enroll Now →
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 font-semibold text-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Have a question?
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-400 font-medium">
            Got a question? We&apos;d love to hear from you.{" "}
            <a href="/contact" className="text-orange-500 hover:underline">Contact us</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
