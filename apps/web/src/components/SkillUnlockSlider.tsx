"use client";

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Brain, Zap, Target, Rocket, Sprout } from 'lucide-react';
import Image from 'next/image';

const skills = [
  {
    id: 1,
    title: "Curiosity",
    description: "Asks better questions",
    icon: <Brain className="w-6 h-6" />,
    buttonText: "Explore Kits",
    color: "#7C5DFA", // Purple
    image: "/images/home/aga_profile.png",
    badge: "Skill System"
  },
  {
    id: 2,
    title: "Confidence",
    description: "Speaks without fear",
    icon: <Rocket className="w-6 h-6" />,
    buttonText: "Start Growing",
    color: "#E91E63", // Deep Pink
    image: "/images/home/gogo_profile.png"
  },
  {
    id: 3,
    title: "Focus",
    description: "Concentrates better",
    icon: <Target className="w-6 h-6" />,
    buttonText: "Boost Focus",
    color: "#FF5722", // Deep Orange
    image: "/images/home/woo_profile.png"
  },
  {
    id: 4,
    title: "Boost",
    description: "Boost Focus",
    icon: <Zap className="w-6 h-6" />,
    buttonText: "Boost Focus",
    color: "#3F51B5", // Indigo
    image: "/images/home/skoo_profile.png"
  },
  {
    id: 5,
    title: "Growth",
    description: "Learns beyond school",
    icon: <Sprout className="w-6 h-6" />,
    buttonText: "Unlock Potential",
    color: "#4CAF50", // Green
    image: "/images/home/mascot_profiles.png" // Placeholder or similar
  }
];

export default function SkillUnlockSlider() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'center',
    skipSnaps: false
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="py-16 md:py-24 bg-[#F8F9FB] overflow-hidden">
      {/* Centered Header */}
      <div className="container mx-auto px-4 max-w-7xl mb-12 md:mb-16">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-[#2D2D2D] tracking-tight">
            What Your Child Unlocks with Swago?
          </h2>
        </div>
      </div>

      {/* Slider Area - More Shrinked on Desktop, Full-ish on Mobile */}
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="relative">
          <div className="relative w-full mx-auto">
            {/* Main Viewport */}
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex -ml-4 md:-ml-8">
                {skills.map((skill, index) => (
                  <div 
                    key={skill.id} 
                    className="flex-shrink-0 flex-grow-0 w-[60%] md:w-[60%] lg:w-[33.33%] pl-4 md:pl-8 min-w-0"
                    style={{
                      opacity: selectedIndex === index ? 1 : 0.5,
                      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      transform: selectedIndex === index ? 'scale(1.1) translateY(-5px)' : 'scale(0.85) translateY(0)',
                      zIndex: selectedIndex === index ? 20 : 10,
                      position: 'relative'
                    }}
                  >
                    <div className="bg-white rounded-[3rem] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.12)] overflow-hidden h-full flex flex-col relative border border-gray-50">
                      {/* Badge */}
                      {skill.badge && (
                        <div className="absolute top-6 left-6 z-20 bg-[#7C5DFA] text-white text-[10px] font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                          <span className="text-xs">✦</span> {skill.badge}
                        </div>
                      )}
                      
                      {/* Curved Image Section - More Curvier hill effect */}
                      <div className="relative aspect-[1.1/1] bg-gradient-to-br from-[#F1F3F9] to-[#E5E9F0] flex items-center justify-center p-10 overflow-hidden">
                         <Image 
                           src={skill.image} 
                           alt={skill.title} 
                           width={320} 
                           height={320} 
                           className="object-contain relative z-10 transition-transform duration-500 group-hover:scale-110"
                         />
                         {/* Steeper Hill Curve - White, Over the image */}
                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[160%] h-[130px] bg-white z-20 rounded-[100%] translate-y-[70%] shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.05)]" />
                      </div>
  
                      {/* Content Section - Extremely Compact, Overlaying the curve */}
                      <div className="p-6 md:p-8 pt-2 md:pt-4 flex flex-col items-center text-center bg-white relative -mt-8 z-30">
                         <div className="flex items-center gap-2 mb-1.5" style={{ color: skill.color }}>
                            <div className="bg-gray-50/50 p-1.5 rounded-lg transform scale-90">
                              {React.cloneElement(skill.icon as any, { className: 'w-5 h-5' })}
                            </div>
                            <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">{skill.title}</h3>
                         </div>
                         <p className="text-gray-400 font-medium text-[13px] md:text-sm mb-6 leading-tight max-w-[180px]">
                            {skill.description}
                         </p>
                         
                         <button 
                           className="w-full text-white font-black py-3.5 rounded-[1rem] flex items-center justify-center gap-1.5 transition-all hover:brightness-95 hover:shadow-xl active:scale-95 text-sm md:text-base tracking-wide whitespace-nowrap px-4"
                           style={{ backgroundColor: skill.color }}
                         >
                            {skill.buttonText} <ChevronRight className="w-4 h-4 stroke-[4px]" />
                         </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
  
            {/* Navigation Arrows */}
            <button
              onClick={scrollPrev}
              className="absolute top-1/2 -left-4 md:-left-12 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-md text-gray-400 hover:text-[#7C5DFA] transition-all z-30 group"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 stroke-[3px]" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute top-1/2 -right-4 md:-right-12 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-md text-gray-400 hover:text-[#7C5DFA] transition-all z-30 group"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 stroke-[3px]" />
            </button>
          </div>
  
          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-12 md:mt-16">
            {skills.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === selectedIndex ? "bg-[#7C5DFA] w-8" : "bg-gray-200 hover:bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
