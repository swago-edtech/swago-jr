"use client";

import React from "react";
import { motion } from "framer-motion";

export default function HeroJourneyIntro() {
  return (
    <section className="py-10 px-4 bg-gradient-to-br from-purple-50 via-white to-orange-50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
            What is the Swago Ambassador Journey?
          </h2>
          
          <div className="max-w-6xl mx-auto space-y-4 text-lg text-slate-700 leading-relaxed text-left">
            <p>
              The <strong className="text-[hsl(var(--swago-orange))]">Swago Ambassador Journey</strong> is a path where children learn to believe in themselves through small real actions.
            </p>
            
            <p>
              Through simple challenges, expression, and play, children slowly shift from{" "}
              <span className="font-semibold text-slate-500">&quot;I&apos;m not sure&quot;</span> to{" "}
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-orange))]">
                &quot;Yes, I can.&quot;
              </span>
            </p>
            
            <p>
              As they grow in confidence, courage, and effort, they move closer to becoming a{" "}
              <strong className="text-[hsl(var(--swago-purple))]">Swago Kid Brand Ambassador</strong> , a child who tries, speaks up, and believes in themselves.
            </p>
            
            <div className="bg-[hsl(var(--swago-purple))]/10 rounded-xl p-6 mt-8">
              <p className="text-slate-800 font-medium ">
                This is not about being perfect.<br />
                It&apos;s about becoming <strong className="text-[hsl(var(--swago-purple))]">your best growing self</strong>.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
