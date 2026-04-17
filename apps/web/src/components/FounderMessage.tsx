"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function FounderMessage() {
  return (
    <section className="w-full relative overflow-hidden bg-slate-50">
      <div className="w-full relative flex flex-col lg:flex-row items-stretch">
        {/* Left Side - Image */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-0 m-0">
          <div className="relative w-full h-[95%] max-h-full overflow-hidden">
            <Image
              src="/images/home/founder.jpeg"
              alt="Swati Goyal - Founder of Swago"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Right Side - Content */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 lg:p-12 xl:p-16"
        >
          <div className="max-w-2xl text-slate-600 leading-relaxed text-lg lg:text-[18px] space-y-4">
            <p className="font-bold text-slate-800 text-2xl tracking-tight mb-2">Dear Parents,</p>

            <p className="text-xl md:text-2xl font-semibold text-slate-800 leading-snug">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#b251a2] to-[#7464a9] font-black border-b-2 border-[#b251a2]/30 pb-0.5">Swago</span> began with a simple question I asked myself as a mother:
              <br />
              <span className="italic block mt-1.5 font-medium text-slate-600">What if learning could make a child believe — <span className="text-[#e0914c] font-black">&quot;Yes, I can&quot;</span>?</span>
            </p>

            <p>
              My son is dyslexic. Traditional learning often told him what he couldn&apos;t do. So we tried a different path — <strong className="text-[#7bc4c3] font-bold">movement, games, joy, and patience.</strong>
            </p>

            <div className="pl-6 py-1 border-l-4 border-[#568dca] bg-[#568dca]/5 rounded-r-xl">
              <p className="text-[#568dca] font-bold italic text-lg">
                Slowly, something powerful happened.
              </p>
            </div>

            <p>
              Before solving sums or writing answers, he started <strong className="text-slate-800">solving problems.</strong> Before scoring marks, he started <strong className="text-slate-800">believing in himself.</strong> And once that belief was in place, academics followed naturally.
            </p>

            <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#b251a2] to-[#7464a9]">
              That belief became the foundation of Swago.
            </p>

            <p>
              At Swago, every skill we teach leads to one outcome: <strong className="text-slate-800">strong problem solvers who face life with confidence.</strong>
            </p>

            <p>
              Through gamification and movement-based learning, children stay motivated, upbeat, and curious. They don&apos;t just learn what to think — <strong className="text-[#e0914c] font-bold">they learn how to think, adapt, and figure things out.</strong>
            </p>

            <p>
              Because in a world where AI can do many things, the most important skill a child can have is the courage to say —
            </p>

            <div className="py-1">
              <span className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#e0914c] via-[#b251a2] to-[#568dca] inline-block drop-shadow-sm transform -rotate-1">
                &quot;Yes, I can.&quot;
              </span>
            </div>

            <p className="text-xl font-medium text-slate-700">
              That&apos;s not just our tagline. <strong className="text-[#7464a9] border-b-2 border-[#7464a9]/40 pb-0.5">It&apos;s our promise.</strong>
            </p>

            {/* Signature Block */}
            <div className="pt-5 mt-4 border-t border-slate-100">
              <p className="italic text-slate-500 text-lg mb-0.5">
                With purpose and heart,
              </p>
              <div className="flex flex-col flex-wrap gap-x-6 gap-y-0.5">
                <p className="text-slate-900 font-black text-2xl flex items-center gap-2 leading-tight">Swati Goyal <span className="w-2 h-2 bg-[#7bc4c3] rounded-full mt-1 animate-pulse"></span></p>
                <div className="flex items-center gap-3">
                  <p className="text-[#7464a9] font-bold tracking-widest uppercase text-xs">Founder, Swago</p>
                  <span className="w-0.5 h-0.5 bg-slate-400 rounded-full" />
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Where your kid believes — <span className="text-[#e0914c]">Yes, I Can</span></p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}