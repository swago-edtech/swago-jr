"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import React from "react";
import FounderMessage from "@/components/FounderMessage";
import AboutSwagoSection from "@/components/AboutSwagoSection";
import AmbassadorCTA from "@/components/AmbassadorCTA";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const swagoLetters = [
  { letter: "S", word: "Smart Tech", image: "/images/mascots/S.jpg.jpeg", desc: "Upskilling in AI & future technology", color: "from-[#b251a2] to-[#b251a2]" },
  { letter: "W", word: "Willpower", image: "/images/mascots/W.png", desc: "Building resilience and discipline", color: "from-[#7bc4c3] to-[#7bc4c3]" },
  { letter: "A", word: "Ambition", image: "/images/mascots/A.png", desc: "Developing leadership qualities", color: "from-[#568dca] to-[#568dca]" },
  { letter: "G", word: "Growth", image: "/images/mascots/g(1).png", desc: "Confident communication and expression", color: "from-[#e0914c] to-[#e0914c]" },
  { letter: "O", word: "Optimization", image: "/images/mascots/O.png", desc: "Optimizing brain power and focus", color: "from-[#7464a9] to-[#7464a9]" },
];

export default function AboutPage() {
  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden pb-12">

      {/* 1) Founder Message Section */}
      <AnimateOnScroll>
        <FounderMessage />
      </AnimateOnScroll>

      {/* 2) What is SWAGO Section */}
      <AnimateOnScroll>
        <AboutSwagoSection />
      </AnimateOnScroll>

      {/* 3) Core Skills Section - White Background */}
      <section className="w-full px-4 lg:px-8 pt-8 md:pt-10 pb-12 md:pb-20 bg-white border-t border-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12 md:mb-20 w-full"
        >
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6">
            Swago Core <span className="text-[hsl(var(--swago-purple))]">Skills</span>
          </h2>

          <p className="max-w-4xl mx-auto text-[18px] md:text-xl text-slate-600 leading-relaxed font-medium px-4">
            Every SWAGO Smart Box works on one core Super Skill that cannot be replaced by AI.
          </p>
        </motion.div>

        {/* MOBILE: Horizontal Scroll (Snap-to-Center)
            DESKTOP: Balanced Flex Row
            CSS: Added 'scrollbar-hide' to remove gray bars
        */}
        <div className="w-full max-w-6xl mx-auto flex overflow-x-auto md:overflow-visible snap-x snap-mandatory scrollbar-hide items-start justify-start md:justify-center gap-8 px-6 md:px-4  ">
          {swagoLetters.map((item, index) => (
            <motion.div
              key={item.letter}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative min-w-[85%] md:min-w-0 md:flex-1 flex flex-col items-center snap-center"
            >
              {/* Card - Premium White with subtle depth */}
              <div className="relative aspect-square w-full max-w-[240px] md:max-w-[200px] mb-8 rounded-[40px] bg-white p-6 shadow-[0_15px_45px_rgba(0,0,0,0.05)] border border-slate-50 transition-all duration-500 ease-out group-hover:shadow-[0_25px_50px_rgba(116,100,169,0.12)] md:group-hover:-translate-y-3">
                
                {/* Interactive Glow */}
                <div className={`absolute inset-0 rounded-[40px] opacity-0 blur-3xl transition-opacity duration-500 bg-gradient-to-br ${item.color} group-hover:opacity-10`} />

                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={item.image}
                    alt={`${item.letter} for ${item.word}`}
                    fill
                    className="object-contain drop-shadow-2xl transition-transform duration-500 ease-out group-hover:scale-110"
                    priority={index === 0}
                  />
                </div>

                {/* Overlaid Badge */}
                <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-[18px] bg-white shadow-2xl border border-slate-50 flex items-center justify-center z-20">
                  <span className={`text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br ${item.color}`}>
                    {item.letter}
                  </span>
                </div>
              </div>

              {/* Skill Labels */}
              <div className="text-center px-4">
                <h3 className="text-2xl md:text-xl font-black text-slate-800 mb-2">{item.word}</h3>
                <p className="text-[15px] text-slate-500 font-medium leading-relaxed max-w-[220px] mx-auto">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4) Ambassador CTA Section */}
      <AnimateOnScroll>
        <div className="w-full bg-white py-2  border-t border-slate-50">
          <AmbassadorCTA />
        </div>
      </AnimateOnScroll>

    </div>
  );
}