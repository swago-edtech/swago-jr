"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface StepProps {
  onNext: () => void;
}

export default function Step1Intro({ onNext }: StepProps) {
  return (
    /* Main container: pt-2 keeps it tight to the top header on mobile */
    <div className="flex-1 flex flex-col w-full min-h-screen md:min-h-full relative overflow-x-hidden bg-white px-4 pt-2 md:pt-0">
      
      <div className="flex-1 flex flex-col md:flex-row w-full h-full max-w-7xl mx-auto items-center justify-center">
        
        {/* LEFT: Character & Speech Bubble Section */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center z-20">
          
          {/* Speech Bubble: -mt-8 removes the gap at the top of the screen */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full max-w-[320px] md:max-w-[450px] -mt-8 mb-[-10px] md:mb-[-20px] z-30"
          >
            {/* Full viewBox ensures the top stroke of the bubble is NOT cut off */}
            <svg 
              viewBox="0 0 440 330" 
              className="w-full h-auto drop-shadow-sm" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="white"
                stroke="#3d2112"
                strokeWidth="8"
                strokeLinejoin="round"
                d="M140,255 C170,275 240,275 270,255 C300,275 360,265 360,225 C410,245 430,165 380,135 C420,45 290,-5 270,75 C240,25 170,15 140,65 C80,15 20,75 60,145 C10,215 80,285 140,255 Z"
              />
              {/* The "thinking" bubbles */}
              <circle cx="98" cy="282" r="12" fill="white" stroke="#3d2112" strokeWidth="3" />
              <circle cx="74" cy="306" r="8" fill="white" stroke="#3d2112" strokeWidth="2.5" />
            </svg>
            
            {/* Text overlaid on the SVG bubble */}
            <div className="absolute inset-0 flex items-center justify-center px-12 pb-14">
                <p className="text-slate-800 font-black text-[13px] md:text-[18px] leading-tight text-center">
                 Hey smart kid, I am Gogo! Wondering what to do here? I&apos;ve got a mission for you... that can earn you <span className="text-[hsl(var(--swago-purple))]">20 Swago Dollars!</span>
              </p>
            </div>
          </motion.div>

          {/* Gogo Mascot: Size matched to the other screens (160px on mobile) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-[160px] md:max-w-[320px]"
          >
            <Image
              src="/images/home/step-one-Photoroom.png"
              alt="Gogo the Mascot"
              width={400}
              height={500}
              className="w-full h-auto object-contain animate-float"
              priority
            />
          </motion.div>
        </div>

        {/* RIGHT: Action Section (Headline & Button) */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left py-5 md:py-0 md:pl-12">
          
          {/* Desktop-only secondary headline for better balance */}
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-2 hidden md:block">
            Mission <br /> <span className="text-[hsl(var(--swago-purple))]">Inbound!</span>
          </h1>

          <div className="w-full px-2">
            <button
              onClick={onNext}
              className="w-full md:w-fit px-5 md:px-12 py-5 bg-[hsl(var(--swago-purple))] text-white font-black tracking-widest rounded-2xl shadow-xl shadow-purple-900/20 hover:brightness-110 active:scale-95 transition-all btn-shine"
            >
              <span>Yes! Show me the mission</span>
            </button>
            
          
          </div>
        </div>
      </div>
    </div>
  );
}
