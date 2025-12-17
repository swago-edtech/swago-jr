"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { GiMuscleUp, GiTrophyCup } from 'react-icons/gi';
import { IoShield, IoFlame } from 'react-icons/io5';
import { AiFillStar } from 'react-icons/ai';

export default function SWAGO_W() {
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
    <section ref={containerRef} className="py-12 md:py-20 bg-gradient-to-br from-orange-50 to-amber-50 relative overflow-hidden">
      
      {/* Floating Willpower Doodles - MORE VISIBLE ON MOBILE */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Far Left */}
        <motion.div
          animate={{ y: [0, -18, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-12 left-[3%] md:top-24 md:left-[8%] text-orange-400 opacity-55 md:opacity-70"
        >
          <GiMuscleUp className="w-13 h-13 md:w-[70px] md:h-[70px]" />
        </motion.div>
        
        {/* Left-Center - Now visible on mobile */}
        <motion.div
          animate={{ rotate: [0, 15, 0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          className="absolute top-[30%] left-[5%] md:top-[28%] md:left-[15%] text-amber-400 opacity-50 md:opacity-75"
        >
          <IoShield className="w-12 h-12 md:w-[65px] md:h-[65px]" />
        </motion.div>
        
        {/* Top-Right - Now visible on mobile */}
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          className="absolute top-[15%] right-[4%] md:top-[20%] md:right-[12%] text-orange-300 opacity-48 md:opacity-65"
        >
          <AiFillStar className="w-11 h-11 md:w-[60px] md:h-[60px]" />
        </motion.div>
        
        {/* Center-Top - Visible on tablet+ */}
        <motion.div
          animate={{ y: [0, -15, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="hidden md:block absolute top-[15%] left-[45%] text-orange-400 opacity-70"
        >
          <IoFlame size={75} />
        </motion.div>
        
        {/* Right-Center - Now visible on mobile */}
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[45%] right-[6%] md:top-[50%] md:right-[10%] text-amber-300 opacity-45 md:opacity-63"
        >
          <GiTrophyCup className="w-11 h-11 md:w-[58px] md:h-[58px]" />
        </motion.div>
        
        {/* Bottom-Left - Now visible on mobile */}
        <motion.div
          animate={{ rotate: [0, 20, 0, -20, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[22%] left-[7%] md:bottom-[18%] md:left-[18%] text-orange-400 opacity-42 md:opacity-68"
        >
          <IoFlame className="w-13 h-13 md:w-[68px] md:h-[68px]" />
        </motion.div>
        
        {/* Bottom-Right */}
        <motion.div
          animate={{ y: [0, -15, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute bottom-[15%] right-[5%] md:bottom-[20%] md:right-[22%] text-amber-400 opacity-50 md:opacity-72"
        >
          <IoShield className="w-11 h-11 md:w-[62px] md:h-[62px]" />
        </motion.div>
        
        {/* NEW: Top-Center - Mobile visible */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-[6%] left-[38%] md:top-[10%] md:left-[42%] text-orange-300 opacity-38 md:opacity-58"
        >
          <AiFillStar className="w-9 h-9 md:w-[48px] md:h-[48px]" />
        </motion.div>
        
        {/* NEW: Bottom-Center - Mobile visible */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 2.2 }}
          className="absolute bottom-[10%] left-[42%] md:bottom-[12%] md:left-[48%] text-amber-400 opacity-35 md:opacity-55"
        >
          <GiMuscleUp className="w-10 h-10 md:w-[50px] md:h-[50px]" />
        </motion.div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col-reverse md:grid md:grid-cols-12 gap-6 md:gap-8 items-center">
          
          {/* Animation Box - Full width on mobile */}
          <div className="w-full md:col-span-8 relative h-[450px] md:h-[400px]">
            
            <div key={key}>
              {/* Scene 1: William slides in (0-2s) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={shouldAnimate ? { opacity: [0, 1, 1, 0] } : {}}
                transition={{ duration: 2.5, times: [0, 0.1, 0.8, 1], delay: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <motion.div
                  initial={{ x: -100 }}
                  animate={shouldAnimate ? { x: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <Image 
                    src="/images/william.png" 
                    alt="William" 
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
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={shouldAnimate ? { scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 2.7 }}
                  className="relative bg-white rounded-3xl p-4 md:p-5 shadow-lg max-w-[280px] md:max-w-xs order-1"
                >
                  <div className="hidden md:block absolute -right-3 bottom-8"><div className="w-4 h-4 bg-white rounded-full"></div></div>
                  <div className="hidden md:block absolute -right-5 bottom-6"><div className="w-2 h-2 bg-white rounded-full"></div></div>
                  <p className="text-slate-800 text-sm md:text-base font-medium">Hii I am william</p>
                </motion.div>
                <Image 
                  src="/images/william.png" 
                  alt="William" 
                  width={320} 
                  height={320} 
                  className="drop-shadow-2xl w-[180px] md:w-[280px] h-auto order-2" 
                />
              </motion.div>

              {/* Scene 3: Second bubble (5-8s) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={shouldAnimate ? { opacity: [0, 1, 1, 0] } : {}}
                transition={{ duration: 3.5, times: [0, 0.1, 0.9, 1], delay: 5.5 }}
                className="absolute inset-0 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 px-4"
              >
                <motion.div
                  initial={{ x: -80, opacity: 0 }}
                  animate={shouldAnimate ? { x: 0, opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 5.7 }}
                  className="relative bg-white rounded-3xl p-4 md:p-5 shadow-lg max-w-[280px] md:max-w-xs order-1"
                >
                  <div className="hidden md:block absolute -right-3 bottom-8"><div className="w-4 h-4 bg-white rounded-full"></div></div>
                  <div className="hidden md:block absolute -right-5 bottom-6"><div className="w-2 h-2 bg-white rounded-full"></div></div>
                  <p className="text-slate-800 text-sm md:text-base font-medium">Sometimes I say no to candies even if I want to eat</p>
                </motion.div>
                <motion.div
                  initial={{ x: 0 }}
                  animate={shouldAnimate ? { x: [40, 40, 40] } : {}}
                  transition={{ duration: 0.5, delay: 5.7 }}
                  className="order-2"
                >
                  <Image 
                    src="/images/william.png" 
                    alt="William" 
                    width={320} 
                    height={320} 
                    className="drop-shadow-2xl w-[180px] md:w-[280px] h-auto" 
                  />
                </motion.div>
              </motion.div>

              {/* Scene 4: Third bubble (8-11s) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={shouldAnimate ? { opacity: [0, 1, 1, 0] } : {}}
                transition={{ duration: 3, times: [0, 0.1, 0.9, 1], delay: 9 }}
                className="absolute inset-0 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 px-4"
              >
                <motion.div
                  initial={{ x: 0 }}
                  animate={shouldAnimate ? { x: [-40, -40, -40] } : {}}
                  transition={{ duration: 0.5, delay: 9.2 }}
                  className="order-2 md:order-1"
                >
                  <Image 
                    src="/images/william.png" 
                    alt="William" 
                    width={320} 
                    height={320} 
                    className="drop-shadow-2xl w-[180px] md:w-[280px] h-auto" 
                  />
                </motion.div>
                <motion.div
                  initial={{ x: 80, opacity: 0 }}
                  animate={shouldAnimate ? { x: 0, opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 9.2 }}
                  className="relative bg-white rounded-3xl p-4 md:p-5 shadow-lg max-w-[280px] md:max-w-xs order-1 md:order-2"
                >
                  <div className="hidden md:block absolute -left-3 bottom-8"><div className="w-4 h-4 bg-white rounded-full"></div></div>
                  <div className="hidden md:block absolute -left-5 bottom-6"><div className="w-2 h-2 bg-white rounded-full"></div></div>
                  <p className="text-slate-800 text-sm md:text-base font-medium">It improves my decision making</p>
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
                    src="/images/william.png" 
                    alt="William" 
                    width={280} 
                    height={280} 
                    className="drop-shadow-2xl w-[180px] md:w-[240px] h-auto mx-auto mb-4 md:mb-6" 
                  />
                  <div className="bg-[hsl(var(--swago-orange))]/20 backdrop-blur-sm rounded-2xl p-4 md:p-6 border-2 border-[hsl(var(--swago-orange))]/40 max-w-[320px] mx-auto">
                    <p className="text-slate-800 text-lg md:text-2xl font-bold">Build unstoppable willpower!</p>
                  </div>
                  
                  {showReplay && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      onClick={handleReplay}
                      className="absolute -top-2 -right-2 md:top-0 md:right-0 bg-white hover:bg-orange-50 rounded-full p-2 md:p-3 shadow-lg hover:shadow-xl transition-all duration-200 group"
                      aria-label="Replay animation"
                    >
                      <svg 
                        className="w-4 h-4 md:w-5 md:h-5 text-[hsl(var(--swago-orange))] group-hover:rotate-180 transition-transform duration-500" 
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

          {/* Title - Bottom on mobile, Right on desktop */}
          <div className="w-full md:col-span-4 text-center md:text-right">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">WILLPOWER</h2>
              <div className="w-20 h-2 bg-[hsl(var(--swago-orange))] rounded-full mt-2 mx-auto md:ml-auto md:mr-0"></div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
