"use client";

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Brain, Zap, Target, Rocket, Sprout } from 'lucide-react';
import Image from 'next/image';

const skills = [
  {
    id: 1,
    title: "S",
    description: "Smart Thinking & Confidence",
    icon: <Rocket className="w-6 h-6" />,
    buttonText: "Explore S",
    color: "#7C5DFA", // Purple
    image: "/images/home/g.jpg", // Corrected: This image contains the S content
    badge: "Swago Skill"
  },
  {
    id: 2,
    title: "W",
    description: "Wisdom & Curiosity",
    icon: <Brain className="w-6 h-6" />,
    buttonText: "Explore W",
    color: "#E91E63", // Deep Pink
    image: "/images/home/w.jpg"
  },
  {
    id: 3,
    title: "A",
    description: "Ambition & Drive",
    icon: <Target className="w-6 h-6" />,
    buttonText: "Explore A",
    color: "#FF5722", // Deep Orange
    image: "/images/home/a.jpg"
  },
  {
    id: 4,
    title: "G",
    description: "Growth Mindset",
    icon: <Sprout className="w-6 h-6" />,
    buttonText: "Explore G",
    color: "#4CAF50", // Green
    image: "/images/home/o.jpg" // Corrected: This image contains the G content
  },
  {
    id: 5,
    title: "O",
    description: "Optimization & Focus",
    icon: <Zap className="w-6 h-6" />,
    buttonText: "Explore O",
    color: "#3F51B5", // Indigo
    image: "/images/home/s.jpg" // Corrected: This image contains the O content
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
    <section className="py-20 md:py-28 bg-[#F8F9FB] overflow-hidden">
      {/* Centered Header */}
      <div className="container mx-auto px-4 max-w-7xl mb-12 md:mb-16">
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">
            What Your Child <span className="text-[hsl(var(--swago-purple))]">Unlocks</span>
          </h2>
        </div>
      </div>

      {/* Slider Area - Aligned with Container */}
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="relative">
          <div className="relative w-full">
            {/* Main Viewport - Back to overflow-hidden for alignment */}
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex -ml-4 md:-ml-6">
                {skills.map((skill, index) => (
                  <div 
                    key={skill.id} 
                    className="flex-shrink-0 flex-grow-0 w-[85%] md:w-[60%] lg:w-[33.33%] pl-4 md:pl-6 min-w-0"
                    style={{
                      opacity: selectedIndex === index ? 1 : 0.4,
                      transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      transform: selectedIndex === index ? 'scale(1.05) translateY(-5px)' : 'scale(0.8) translateY(0)',
                      zIndex: selectedIndex === index ? 50 : 10,
                    }}
                  >
                    {/* Borderless Blended Image */}
                    <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] bg-white border border-gray-100/50">
                      <Image 
                        src={skill.image} 
                        alt={skill.title} 
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      
                      {/* Solid White Content Section - High Contrast */}
                      <div className="absolute inset-x-4 bottom-4 p-6 bg-white rounded-[2rem] z-30 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] flex flex-col items-center text-center">
                         <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-3xl md:text-4xl font-black text-[hsl(var(--swago-purple))] tracking-[0.2em] uppercase italic">
                              {skill.title}
                            </h3>
                         </div>
                         
                         <p className="text-slate-500 font-bold text-[11px] md:text-xs leading-none uppercase tracking-widest opacity-80">
                            {skill.description}
                         </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
   
            {/* Navigation Arrows - Adjusted for Container */}
            <div className="hidden lg:block">
              <button
                onClick={scrollPrev}
                className="absolute top-1/2 -left-12 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl text-slate-800 hover:text-[hsl(var(--swago-purple))] transition-all z-[60]"
              >
                <ChevronLeft className="w-6 h-6 stroke-[3px]" />
              </button>
              <button
                onClick={scrollNext}
                className="absolute top-1/2 -right-12 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl text-slate-800 hover:text-[hsl(var(--swago-purple))] transition-all z-[60]"
              >
                <ChevronRight className="w-6 h-6 stroke-[3px]" />
              </button>
            </div>
          </div>
  
          {/* Pagination Dots */}
          <div className="flex justify-center gap-3 mt-12 md:mt-20">
            {skills.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  index === selectedIndex ? "bg-[hsl(var(--swago-purple))] w-12" : "bg-slate-200 w-3 hover:bg-slate-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
