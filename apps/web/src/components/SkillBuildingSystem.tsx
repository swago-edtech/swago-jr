"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function SkillBuildingSystem() {
  return (
    <section className="py-10 md:py-14 bg-[#FFFBF7] overflow-hidden relative">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          
          {/* Left Column: Video Card */}
          <div className="w-full lg:w-[45%]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] overflow-hidden border border-white"
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
                  <div className="w-24 h-24 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110">
                    <div className="w-0 h-0 border-t-[14px] border-t-transparent border-l-[24px] border-l-slate-800 border-b-[14px] border-b-transparent ml-2" />
                  </div>
                </div>

                {/* Logo Overlay */}
                <div className="absolute top-6 left-6">
                   <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-white/50">
                      <Image src="/Swago_logo.png" alt="SWAGO" width={90} height={30} className="object-contain" />
                   </div>
                </div>

                {/* Video Info Overlay (bottom) */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                      <div className="h-full bg-white w-1/3 rounded-full" />
                    </div>
                    <span className="text-white text-[10px] font-bold whitespace-nowrap">0:00 / 2:20</span>
                  </div>
                  <div className="flex gap-3 ml-4">
                    <div className="w-3 h-3 border border-white rounded-sm" />
                    <div className="w-3 h-3 border border-white rounded-sm" />
                  </div>
                </div>
              </div>

              {/* Quote Section */}
              <div className="p-10 pt-8 bg-white border-t border-slate-50">
                <div className="relative">
                  <span className="absolute -top-4 -left-2 text-5xl text-slate-100 font-serif">&ldquo;</span>
                  <p className="text-xl md:text-2xl font-medium text-slate-600 leading-relaxed italic text-center relative z-10 px-4">
                    Every child deserves the confidence to say &quot;Yes, I Can.&quot;
                  </p>
                </div>
                <div className="mt-8 text-center">
                  <p className="text-[hsl(var(--swago-purple))] font-black text-sm md:text-base tracking-widest uppercase">
                    &mdash; Swati Goyal
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Text Content */}
          <div className="w-full lg:w-[55%] text-left">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl"
            >
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.05] mb-8 tracking-tight">
                More Than Toys. <br />
                <span className="text-[hsl(var(--swago-purple))]">A Skill-Building System.</span>
              </h2>
              
              <div className="space-y-6 text-slate-500 font-bold text-lg md:text-xl leading-relaxed">
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

              <div className="mt-12">
                <button className="bg-[hsl(var(--swago-purple))] hover:bg-purple-600 text-white font-black px-12 py-5 rounded-2xl text-base md:text-lg uppercase tracking-widest shadow-[0_20px_40px_-10px_rgba(124,93,250,0.3)] transition-all hover:-translate-y-1 active:scale-95">
                  Explore the SWAGO System
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none overflow-hidden hidden md:block">
        <div className="container mx-auto px-4 max-w-7xl h-full relative">
          {/* Mascot peaking */}
          <div className="absolute bottom-0 left-1/2 translate-x-[150px] w-48 h-48">
            <Image src="/images/home/aga_profile.png" alt="" fill className="object-contain object-bottom opacity-20" />
          </div>
          
          {/* Balloons/Shapes placeholders based on design */}
          <div className="absolute bottom-12 left-1/2 translate-x-[350px] w-12 h-12 bg-red-400/20 rounded-full" />
          <div className="absolute bottom-4 left-1/2 translate-x-[420px] w-16 h-16 bg-blue-400/20 rounded-full" />
          <div className="absolute bottom-24 left-1/2 translate-x-[480px] w-8 h-8 bg-amber-400/20 rounded-full" />
          
          {/* Trophy placeholder */}
          <div className="absolute bottom-8 left-1/2 translate-x-[280px] w-16 h-16 opacity-10">
             <svg viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
               <path d="M18 2h-1V1h-2v1H9V1H7v1H6C4.9 2 4 2.9 4 4v3c0 2.2 1.8 4 4 4h1.1l1.1 2.2c-.4.7-.6 1.4-.2 2.3.4.9 1.2 1.5 2 1.5H12c.3 0 .5-.2.5-.5s-.2-.5-.5-.5h-.1c-.4 0-.8-.3-1-.8-.2-.4-.1-.8.1-1.2l1.5-3h-.9l-1.1-2.2c-.4-.7-.6-1.4-.2-2.3.4-.9 1.2-1.5 2-1.5h1.2l1.1 2.2c.4.7.6 1.4.2 2.3-.4.9-1.2 1.5-2 1.5H12c-.3 0-.5.2-.5.5s.2.5.5.5h.1c.4 0 .8.3 1 .8.2.4.1.8-.1 1.2l-1.5 3h.9l1.1 2.2c.4.7.6 1.4.2 2.3-.4.9-1.2 1.5-2 1.5H12c.3 0 .5-.2.5-.5s-.2-.5-.5-.5h-.1c-.4 0-.8-.3-1-.8-.2-.4-.1-.8.1-1.2l1.5-3h-.9l-1.1-2.2c-.4-.7-.6-1.4-.2-2.3.4-.9 1.2-1.5 2-1.5h1.2" />
             </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
