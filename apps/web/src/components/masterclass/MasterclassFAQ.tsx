"use client";

import { useState } from "react";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MasterclassFAQ({ faqs }: { faqs: any[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-20">
          <div className="w-16 h-16 bg-[hsl(var(--swago-purple))]/5 rounded-3xl flex items-center justify-center text-[hsl(var(--swago-purple))] mx-auto mb-6">
            <MessageCircleQuestion className="w-8 h-8" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Common Questions
          </h2>
          <p className="text-slate-500 font-medium max-w-xl mx-auto">
            Everything you need to know about the masterclass, enrollment, and what to expect during the sessions.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`group border rounded-[24px] transition-all duration-300 ${
                  isOpen 
                    ? "bg-slate-50/50 border-slate-200 shadow-sm" 
                    : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-8 py-7 flex items-center justify-between text-left group-hover:bg-slate-50/30 transition-colors rounded-[24px]"
                >
                  <span className={`text-lg font-black tracking-tight transition-colors ${
                    isOpen ? "text-[hsl(var(--swago-purple))]" : "text-slate-900"
                  }`}>
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isOpen ? "bg-[hsl(var(--swago-purple))] text-white rotate-180" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                  }`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-8 pt-2 text-slate-600 font-medium leading-relaxed">
                        <div className="w-full h-[1px] bg-slate-200/50 mb-6" />
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
        
        {/* Support CTA */}
        <div className="mt-16 text-center">
          <p className="text-sm font-bold text-slate-400">
            Still have questions? <a href="/contact" className="text-[hsl(var(--swago-purple))] hover:underline underline-offset-4">Chat with our team</a>
          </p>
        </div>
      </div>
    </section>
  );
}
