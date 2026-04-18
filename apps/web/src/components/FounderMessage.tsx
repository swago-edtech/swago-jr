"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Mic2, Users, Heart } from "lucide-react"; // npm install lucide-react

export default function FounderMessage() {
  return (
    <section className="w-full bg-white font-poppins overflow-hidden">
      <div className="flex flex-col lg:flex-row items-start">
        
        {/* Left Side - Full Portrait */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="w-full lg:w-1/2 relative h-[600px] lg:h-[85vh] bg-slate-100"
        >
          <Image
            src="/images/home/founder.jpeg" 
            alt="Swati Goyal - Founder of Swago"
            fill
            className="object-cover object-top"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </motion.div>

        {/* Right Side - Clean Editorial with Purple Accents */}
        <div className="w-full lg:w-1/2 py-4 px-6 md:px-8 lg:px-10 xl:px-12 flex flex-col justify-start bg-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-xl w-full"
          >

            <div className="space-y-3 text-[18px] leading-[1.7] lg:mt-12 text-slate-700 font-normal tracking-tight">
              <p className="text-3xl text-slate-900 font-bold tracking-tighter mb-3">
                Dear Parents,
              </p>

              <p>
                Swago began with a question I asked myself as a mother: 
                <span className="italic font-medium text-slate-900 ml-1"> 
                  &quot;What if learning could make a child believe Yes, I can?&quot;
                </span>
              </p>

              <p>
                My son is dyslexic. Traditional learning often focused on what he couldn&apos;t do, so we chose a path rooted in movement, play, and patience. Before he mastered sums, he started <span className="text-slate-900 font-semibold border-b border-slate-100">solving problems</span>. Before he scored marks, he started <span className="text-slate-900 font-semibold border-b border-slate-100">believing in himself.</span>
              </p>

              <p>
                That transformation is the foundation of Swago. Through gamification, we teach children how to think, adapt, and figure things out turning them into problem solvers who face life with confidence.
              </p>

              <p>
                In an AI-driven world, the most vital skill a child can possess is the courage to say:
              </p>

              <div className="">
                <span className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter block">
                  &quot;Yes, I can.&quot;
                </span>
              </div>

              {/* Tagline Promise - Purple with Icon */}
              <p className="text-xl font-bold text-[hsl(var(--swago-purple))] flex items-center gap-2">
                That&apos;s not just our tagline. It&apos;s our promise. <Heart className="fill-[#7464a9] h-6 w-6" />
              </p>

              {/* Signature Block */}
              <div className=" mt-1 border-t border-slate-100 italic">
                <p className="text-slate-600 text-md ">With purpose and heart,</p>
                
                  <p className="text-md  text-slate-600 tracking-tighter">Swati Goyal</p>
                  <p className="text-md text-slate-600">Founder, Swago</p>
              </div>
              {/* The Accolades - The Purple Focus */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#7464a9]/5 border border-[#7464a9]/10 text-[11px] font-bold  tracking-[0.2em] text-[#7464a9]">
                <Mic2 size={14} className="opacity-80" /> TEDx Speaker
              </span>
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#7464a9]/5 border border-[#7464a9]/10 text-[11px] font-bold  tracking-[0.2em] text-[#7464a9]">
                <Users size={14} className="opacity-80" /> Trusted by 500k+ Parents
              </span>
            </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}