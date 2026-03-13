"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function SkillBuildingSystem() {
  const mascots = [
    { name: "Aga", trait: "Smart Tech", image: "/images/home/aga_profile.png", color: "text-blue-500" },
    { name: "Woo", trait: "Willpower", image: "/images/home/woo_profile.png", color: "text-orange-500" },
    { name: "Gogo", trait: "Ambition", image: "/images/home/gogo_profile.png", color: "text-amber-500" },
    { name: "Op", trait: "Growth", image: "/images/home/op_profile.png", color: "text-pink-500" },
    { name: "Skoo", trait: "OptimiZation", image: "/images/home/skoo_profile.png", color: "text-green-600" },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#FFFBF7] overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center mb-20 md:mb-32">
          
          {/* Left Column: Video Card */}
          <div className="w-full lg:w-1/2">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[3rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.06)] p-6 md:p-10 border border-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-50 rounded-bl-[100%] -mr-20 -mt-20 opacity-50" />
              
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-inner">
                <Image
                  src="/images/home/video_thumbnail.png"
                  alt="Skill Building System Presentation"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-110">
                    <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-[hsl(var(--swago-purple))] border-b-[12px] border-b-transparent ml-2" />
                  </div>
                </div>
                {/* Logo Overlay */}
                <div className="absolute top-6 left-6 w-24">
                   <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm">
                      <Image src="/Swago_logo.png" alt="SWAGO" width={80} height={30} className="object-contain" />
                   </div>
                </div>
                {/* Video Controls Mock */}
                <div className="absolute bottom-4 left-4 right-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-[hsl(var(--swago-purple))] w-[40%] rounded-full shadow-[0_0_10px_#7c5dfa]" />
                </div>
              </div>

              {/* Quote Section */}
              <div className="mt-10 text-center px-4 relative">
                <blockquote className="text-xl md:text-[1.75rem] font-medium text-slate-800 leading-relaxed italic">
                  <span className="text-5xl text-slate-200 absolute -top-4 left-0 select-none">“</span>
                  Every child deserves the confidence to say &quot;Yes, I Can.&quot;
                </blockquote>
                <p className="mt-6 text-[hsl(var(--swago-purple))] font-black text-xl md:text-2xl uppercase tracking-widest">
                  — Swati Goyal
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Text Content */}
          <div className="w-full lg:w-1/2 text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-10 tracking-tight">
                More Than Toys. <br />
                <span className="text-[hsl(var(--swago-purple))]">A Skill-Building System.</span>
              </h2>
              
              <div className="space-y-8 text-slate-500 font-bold text-lg md:text-xl leading-relaxed max-w-xl">
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

              <div className="mt-14">
                <button className="bg-[hsl(var(--swago-purple))] hover:bg-purple-600 text-white font-black px-12 py-6 rounded-2xl text-xl uppercase tracking-widest shadow-[0_20px_50px_-10px_rgba(124,93,250,0.4)] transition-all hover:-translate-y-1 active:scale-95">
                  Explore the SWAGO System
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Part: Mascots & Playgroup */}
        <div className="flex flex-col lg:flex-row items-end gap-12 lg:gap-20">
          
          {/* Mascot Profiles Row */}
          <div className="w-full lg:w-auto flex flex-wrap lg:flex-nowrap justify-center lg:justify-start gap-8 md:gap-10 pb-4">
             {mascots.map((mascot, idx) => (
               <motion.div 
                 key={mascot.name}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 viewport={{ once: true }}
                 className="flex flex-col items-center text-center group"
               >
                 <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-6 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.1)] border-4 border-white group-hover:scale-110 transition-transform duration-300">
                   <Image 
                     src={mascot.image} 
                     alt={mascot.name} 
                     fill 
                     className="object-cover"
                   />
                 </div>
                 <h4 className={`text-2xl md:text-3xl font-black ${mascot.color} tracking-tight mb-1`}>{mascot.name}</h4>
                 <p className="text-sm md:text-base text-slate-400 font-bold uppercase tracking-[0.15em]">{mascot.trait}</p>
               </motion.div>
             ))}
          </div>

          {/* Large Playgroup Illustration */}
          <div className="flex-1 w-full relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative w-full aspect-[4/3] md:aspect-[1.8/1]"
            >
              <Image 
                src="/images/home/mascots_playgroup.png" 
                alt="Kids playing with SWAGO mascots" 
                fill
                className="object-contain object-right-bottom"
              />
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
