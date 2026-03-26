"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function SkillBuildingSystem() {
  return (
    <section className="py-8 md:py-10 bg-[#FFFBF7] overflow-hidden relative">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-center">
          
          {/* Left Column: Video Card */}
          <div className="w-full lg:w-[40%]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white rounded-[2rem] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.06)] overflow-hidden border border-white"
            >
              {/* Video/Image Container */}
              <div className="relative aspect-[1.1/1] w-full overflow-hidden group cursor-pointer">
                <Image
                  src="/images/SwatiGoyal.jpeg"
                  alt="Swati Goyal - Founder"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110">
                    <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-slate-800 border-b-[12px] border-b-transparent ml-2" />
                  </div>
                </div>

                {/* Logo Overlay */}
                <div className="absolute top-5 left-5">
                   <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-white/50">
                      <Image src="/Swago_logo.png" alt="SWAGO" width={75} height={25} className="object-contain" />
                   </div>
                </div>

                {/* Video Info Overlay (bottom) */}
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                      <div className="h-full bg-white w-1/3 rounded-full" />
                    </div>
                    <span className="text-white text-[9px] font-bold whitespace-nowrap">0:00 / 2:20</span>
                  </div>
                </div>
              </div>

              {/* Quote Section */}
              <div className="p-8 pt-6 bg-white border-t border-slate-50">
                <div className="relative">
                  <span className="absolute -top-3 -left-1 text-4xl text-slate-100 font-serif">&ldquo;</span>
                  <p className="text-lg md:text-xl font-medium text-slate-600 leading-relaxed italic text-center relative z-10 px-2">
                    Every child deserves the confidence to say &quot;Yes, I Can.&quot;
                  </p>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-[hsl(var(--swago-purple))] font-black text-xs md:text-sm tracking-widest uppercase">
                    &mdash; Swati Goyal
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Text Content */}
          <div className="w-full lg:w-[60%] text-left">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="max-w-xl"
            >
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
                More Than Toys. <br />
                <span className="text-[hsl(var(--swago-purple))]">A Skill-Building System.</span>
              </h2>
              
              <div className="space-y-4 text-slate-500 font-bold text-base md:text-lg leading-relaxed">
                <p>
                  Kids today face challenges we never did growing up &ndash; short attention spans, 
                  low confidence, and too much passive screen time.
                </p>
                <p>
                  That&apos;s why we created SWAGO &ndash; to turn playtime into growth time. Each kit 
                  is designed to build essential life skills through engaging activities, 
                  challenges, and missions.
                </p>
                <p>
                  From confidence and focus to creativity and social skills, SWAGO helps kids build real 
                  abilities that last a lifetime.
                </p>
              </div>

              <div className="mt-10">
                <button className="bg-[hsl(var(--swago-purple))] hover:bg-purple-600 text-white font-black px-10 py-4 rounded-xl text-sm md:text-base uppercase tracking-widest shadow-[0_15px_30px_-5px_rgba(124,93,250,0.3)] transition-all hover:-translate-y-1 active:scale-95">
                  Explore the SWAGO System
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Decorative Elements - Smaller versions */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none overflow-hidden hidden md:block">
        <div className="container mx-auto px-4 max-w-6xl h-full relative">
          
          <div className="absolute bottom-8 left-1/2 translate-x-[300px] w-10 h-10 bg-red-400/15 rounded-full" />
          <div className="absolute bottom-3 left-1/2 translate-x-[360px] w-14 h-14 bg-blue-400/15 rounded-full" />
        </div>
      </div>
    </section>
  );
}
