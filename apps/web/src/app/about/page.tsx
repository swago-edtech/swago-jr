"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import React from "react";
import FounderMessage from "@/components/FounderMessage";
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

      {/* 1) Founder Message Section (Now at the very top, full width) */}
      <AnimateOnScroll>
        <FounderMessage />
      </AnimateOnScroll>

      {/* 2) Hero Section: SWAGO Acronym (Full width styling) */}
      <section className="w-full px-4 lg:px-8 pt-12 md:pt-16 pb-24 md:pb-32 bg-slate-50 border-t border-slate-100">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16 md:mb-24 w-full"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-100/50 border border-purple-200 mb-8 backdrop-blur-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span>
            <span className="text-sm font-bold tracking-widest text-purple-800 uppercase">Discover Our Method</span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-slate-900 tracking-tighter leading-none mb-8">
            We are <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-indigo-700">SWAGO</span>
          </h1>

          <p className="max-w-4xl mx-auto text-xl md:text-2xl text-slate-600 leading-relaxed font-medium">
            Every activity at Swago focuses on 5 super skills your kid will love. We believe in preparing children for tomorrow through a unique blend of learning and gamification.
          </p>
        </motion.div>

        {/* Mascot Letters Display (Full width row) */}
        <div className="w-full max-w-[2000px] mx-auto flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4 lg:gap-10 px-4 mb-12">
          {swagoLetters.map((item, index) => (
            <motion.div
              key={item.letter}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group relative w-full md:flex-1 flex flex-col items-center"
            >
              {/* Image Container with Glassmorphic Card effect */}
              <div className="relative aspect-square w-56 md:w-full max-w-[280px] mb-8 rounded-[40px] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 transition-all duration-500 ease-out group-hover:shadow-[0_20px_40px_rgb(99,102,241,0.15)] group-hover:-translate-y-4">
                {/* Background Glow */}
                <div className={`absolute inset-0 rounded-[40px] opacity-0 blur-3xl transition-opacity duration-500 bg-gradient-to-br ${item.color} group-hover:opacity-15`} />

                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={item.image}
                    alt={`${item.letter} for ${item.word}`}
                    fill
                    className="object-contain drop-shadow-2xl transition-transform duration-500 ease-out group-hover:scale-110"
                    priority={index < 3}
                  />
                </div>

                {/* Overlaid bold letter */}
                <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-[24px] bg-white shadow-2xl border border-slate-50 flex items-center justify-center z-20">
                  <span className={`text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br ${item.color}`}>
                    {item.letter}
                  </span>
                </div>
              </div>

              {/* Text Label */}
              <div className="text-center px-4">
                <h3 className="text-2xl font-black text-slate-800 mb-2">{item.word}</h3>
                <p className="text-base text-slate-500 font-medium leading-relaxed max-w-[250px] mx-auto">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Ambassador Call to Action */}
      <AnimateOnScroll>
        <div className="w-full bg-white pt-24 pb-12 px-4">
          <AmbassadorCTA />
        </div>
      </AnimateOnScroll>


    </div>
  );
}
