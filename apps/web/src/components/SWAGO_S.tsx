"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { FiCpu, FiZap } from 'react-icons/fi';
import { HiLightBulb } from 'react-icons/hi';
import { IoMdSettings } from 'react-icons/io';
import { BsLightning } from 'react-icons/bs';

export default function SWAGO_S() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });
  const [key, setKey] = useState(0);
  const [showReplay, setShowReplay] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isInView && !shouldAnimate) {
      setShouldAnimate(true);
      setTimeout(() => setShowReplay(true), 13000);
    }
  }, [isInView, shouldAnimate]);

  const handleReplay = () => {
    setShowReplay(false);
    setShouldAnimate(false);
    setKey(prev => prev + 1);
    
    setTimeout(() => {
      setShouldAnimate(true);
      setTimeout(() => setShowReplay(true), 13000);
    }, 50);
  };

  return (
    <section ref={containerRef} className="py-12 md:py-20 bg-gradient-to-br from-teal-50 to-cyan-50 relative overflow-hidden">
      
      {/* Floating Tech Doodles - MORE VISIBLE ON MOBILE */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Far Left */}
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-[2%] md:top-20 md:left-[5%] text-teal-300 opacity-55 md:opacity-75"
        >
          <FiCpu className="w-12 h-12 md:w-[60px] md:h-[60px]" />
        </motion.div>
        
        {/* Left-Center - Now visible on mobile */}
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-[30%] left-[5%] md:top-[25%] md:left-[15%] text-cyan-300 opacity-45 md:opacity-65"
        >
          <HiLightBulb className="w-14 h-14 md:w-[80px] md:h-[80px]" />
        </motion.div>
        
        {/* Top-Right - Now visible on mobile */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[15%] right-[3%] md:top-[20%] md:right-[10%] text-teal-300 opacity-50 md:opacity-70"
        >
          <FiZap className="w-10 h-10 md:w-[50px] md:h-[50px]" />
        </motion.div>
        
        {/* Center-Top - Visible on tablet+ */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="hidden md:block absolute top-[15%] left-[45%] text-cyan-200 opacity-60"
        >
          <IoMdSettings size={70} />
        </motion.div>
        
        {/* Right-Center - Now visible on mobile */}
        <motion.div
          animate={{ y: [0, 15, 0], x: [0, 10, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute top-[45%] right-[5%] md:top-[50%] md:right-[8%] text-teal-200 opacity-48 md:opacity-65"
        >
          <BsLightning className="w-11 h-11 md:w-[55px] md:h-[55px]" />
        </motion.div>
        
        {/* Bottom-Left - Now visible on mobile */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[20%] left-[8%] md:bottom-[18%] md:left-[20%] text-cyan-300 opacity-40 md:opacity-65"
        >
          <IoMdSettings className="w-12 h-12 md:w-[65px] md:h-[65px]" />
        </motion.div>
        
        {/* Bottom-Right */}
        <motion.div
          animate={{ y: [0, -18, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[15%] right-[4%] md:bottom-[20%] md:right-[20%] text-teal-400 opacity-50 md:opacity-70"
        >
          <FiCpu className="w-11 h-11 md:w-[58px] md:h-[58px]" />
        </motion.div>
        
        {/* NEW: Top-Center - Mobile visible */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          className="absolute top-[5%] left-[35%] md:top-[12%] md:left-[40%] text-cyan-400 opacity-40 md:opacity-60"
        >
          <HiLightBulb className="w-10 h-10 md:w-[52px] md:h-[52px]" />
        </motion.div>
        
        {/* NEW: Bottom-Center - Mobile visible */}
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
          className="absolute bottom-[8%] left-[40%] md:bottom-[10%] md:left-[45%] text-teal-300 opacity-35 md:opacity-55"
        >
          <BsLightning className="w-9 h-9 md:w-[45px] md:h-[45px]" />
        </motion.div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-8 items-center">
          
          {/* Title - Top on mobile, Left on desktop */}
          <div className="w-full md:col-span-4 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">
                SMART TECH
              </h2>
              <div className="w-20 h-2 bg-[hsl(var(--swago-teal))] rounded-full mt-2 mx-auto md:mx-0"></div>
            </motion.div>
          </div>

          {/* Animation Box - Full width on mobile */}
          <div className="w-full md:col-span-8 relative h-[450px] md:h-[400px]">
            
            <div key={key}>
              {/* Scene 1: Swoo slides in (0-2s) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={shouldAnimate ? { opacity: [0, 1, 1, 0] } : {}}
                transition={{ duration: 2.5, times: [0, 0.1, 0.8, 1], delay: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <motion.div
                  initial={{ x: 100 }}
                  animate={shouldAnimate ? { x: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <Image 
                    src="/images/swoo.png" 
                    alt="Swoo" 
                    width={320} 
                    height={320} 
                    className="drop-shadow-2xl w-[200px] md:w-[280px] h-auto" 
                  />
                </motion.div>
              </motion.div>

              {/* Scene 2: First bubble (2-5s) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={shouldAnimate ? { opacity: [0, 1, 1, 0] } : {}}
                transition={{ duration: 3, times: [0, 0.1, 0.9, 1], delay: 2.5 }}
                className="absolute inset-0 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 px-4"
              >
                <Image 
                  src="/images/swoo.png" 
                  alt="Swoo" 
                  width={320} 
                  height={320} 
                  className="drop-shadow-2xl w-[180px] md:w-[280px] h-auto order-2 md:order-1" 
                />
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={shouldAnimate ? { scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 2.7 }}
                  className="relative bg-white rounded-3xl p-4 md:p-5 shadow-lg max-w-[280px] md:max-w-xs order-1 md:order-2"
                >
                  <div className="hidden md:block absolute -left-3 bottom-8"><div className="w-4 h-4 bg-white rounded-full"></div></div>
                  <div className="hidden md:block absolute -left-5 bottom-6"><div className="w-2 h-2 bg-white rounded-full"></div></div>
                  <p className="text-slate-800 text-sm md:text-base font-medium">Hi! I&apos;m Swoo...</p>
                </motion.div>
              </motion.div>

              {/* Scene 3: Second bubble (5-8s) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={shouldAnimate ? { opacity: [0, 1, 1, 0] } : {}}
                transition={{ duration: 3, times: [0, 0.1, 0.9, 1], delay: 5.5 }}
                className="absolute inset-0 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 px-4"
              >
                <motion.div
                  initial={{ x: 0 }}
                  animate={shouldAnimate ? { x: [-40, -40, -40] } : {}}
                  transition={{ duration: 0.5, delay: 5.7 }}
                  className="order-2 md:order-1"
                >
                  <Image 
                    src="/images/swoo.png" 
                    alt="Swoo" 
                    width={320} 
                    height={320} 
                    className="drop-shadow-2xl w-[180px] md:w-[280px] h-auto" 
                  />
                </motion.div>
                <motion.div
                  initial={{ x: 80, opacity: 0 }}
                  animate={shouldAnimate ? { x: 0, opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 5.7 }}
                  className="relative bg-white rounded-3xl p-4 md:p-5 shadow-lg max-w-[280px] md:max-w-xs order-1 md:order-2"
                >
                  <div className="hidden md:block absolute -left-3 bottom-8"><div className="w-4 h-4 bg-white rounded-full"></div></div>
                  <div className="hidden md:block absolute -left-5 bottom-6"><div className="w-2 h-2 bg-white rounded-full"></div></div>
                  <p className="text-slate-800 text-sm md:text-base font-medium">I love to explore tech...</p>
                </motion.div>
              </motion.div>

              {/* Scene 4: Third bubble (8-11s) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={shouldAnimate ? { opacity: [0, 1, 1, 0] } : {}}
                transition={{ duration: 3.5, times: [0, 0.1, 0.9, 1], delay: 8.5 }}
                className="absolute inset-0 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 px-4"
              >
                <motion.div
                  initial={{ x: -80, opacity: 0 }}
                  animate={shouldAnimate ? { x: 0, opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 8.7 }}
                  className="relative bg-white rounded-3xl p-4 md:p-5 shadow-lg max-w-[280px] md:max-w-xs order-1"
                >
                  <div className="hidden md:block absolute -right-3 bottom-8"><div className="w-4 h-4 bg-white rounded-full"></div></div>
                  <div className="hidden md:block absolute -right-5 bottom-6"><div className="w-2 h-2 bg-white rounded-full"></div></div>
                  <p className="text-slate-800 text-sm md:text-base font-medium">When I get a mechanical toy, I open it up to see how it works!</p>
                </motion.div>
                <motion.div
                  initial={{ x: 0 }}
                  animate={shouldAnimate ? { x: [40, 40, 40] } : {}}
                  transition={{ duration: 0.5, delay: 8.7 }}
                  className="order-2"
                >
                  <Image 
                    src="/images/swoo.png" 
                    alt="Swoo" 
                    width={320} 
                    height={320} 
                    className="drop-shadow-2xl w-[180px] md:w-[280px] h-auto" 
                  />
                </motion.div>
              </motion.div>

              {/* Scene 5: Final (12-13s) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 12 }}
                className="absolute inset-0 flex items-center justify-center px-4"
              >
                <div className="text-center relative">
                  <Image 
                    src="/images/swoo.png" 
                    alt="Swoo" 
                    width={280} 
                    height={280} 
                    className="drop-shadow-2xl w-[180px] md:w-[240px] h-auto mx-auto mb-4 md:mb-6" 
                  />
                  <div className="bg-[hsl(var(--swago-teal))]/20 backdrop-blur-sm rounded-2xl p-4 md:p-6 border-2 border-[hsl(var(--swago-teal))]/40 max-w-[320px] mx-auto">
                    <p className="text-slate-800 text-lg md:text-2xl font-bold">Ready to explore with Swoo?</p>
                  </div>
                  
                  {showReplay && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      onClick={handleReplay}
                      className="absolute -top-2 -right-2 md:top-0 md:right-0 bg-white hover:bg-teal-50 rounded-full p-2 md:p-3 shadow-lg hover:shadow-xl transition-all duration-200 group"
                      aria-label="Replay animation"
                    >
                      <svg 
                        className="w-4 h-4 md:w-5 md:h-5 text-[hsl(var(--swago-teal))] group-hover:rotate-180 transition-transform duration-500" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
