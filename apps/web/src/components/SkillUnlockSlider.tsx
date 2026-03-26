"use client";

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Brain, Zap, Target, Rocket, Sprout } from 'lucide-react';
import Image from 'next/image';

const skills = [
  {
    id: 1,
    title: "S",
    description: "Self-Belief & Confidence",
    icon: <Rocket className="w-6 h-6" />,
    buttonText: "Explore S",
    color: "#7C5DFA", // Purple
    image: "/images/home/s.jpg",
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
    image: "/images/home/g.jpg"
  },
  {
    id: 5,
    title: "O",
    description: "Optimization & Focus",
    icon: <Zap className="w-6 h-6" />,
    buttonText: "Explore O",
    color: "#3F51B5", // Indigo
    image: "/images/home/o.jpg"
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

      {/* Slider Area - Full Screen Width Feel */}
      <div className="w-full">
        <div className="relative">
          <div className="relative w-full">
            {/* Main Viewport */}
            <div className="overflow-visible" ref={emblaRef}>
              <div className="flex">
                {skills.map((skill, index) => (
                  <div 
                    key={skill.id} 
                    className="flex-shrink-0 flex-grow-0 w-[85%] md:w-[45%] lg:w-[28%] px-4 min-w-0"
                    style={{
                      opacity: selectedIndex === index ? 1 : 0.3,
                      transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      transform: selectedIndex === index ? 'scale(1.15)' : 'scale(0.85)',
                      zIndex: selectedIndex === index ? 50 : 10,
                    }}
                  >
                    {/* Borderless Blended Image */}
                    <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)]">
                      <Image 
                        src={skill.image} 
                        alt={skill.title} 
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      
                      {/* Dark Blend Overlay */}
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

                      {/* Floating Content Section */}
                      <div className="absolute inset-0 p-8 md:p-10 flex flex-col justify-end text-left">
                         <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                              {React.cloneElement(skill.icon as any, { className: 'w-6 h-6 text-white' })}
                            </div>
                            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-lg">{skill.title}</h3>
                         </div>
                         
                         <p className="text-white font-bold text-sm md:text-base leading-tight opacity-90 mb-8 max-w-[240px]">
                            {skill.description}
                         </p>
                         
                         <button 
                           className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 text-sm md:text-base tracking-widest uppercase shadow-xl"
                         >
                            {skill.buttonText} <ChevronRight className="w-5 h-5 stroke-[4px]" />
                         </button>
                      </div>

                      {/* Edge Mask - Softening the blend into the background */}
                      <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[2.5rem]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
   
            {/* Navigation Arrows */}
            <div className="hidden md:block">
              <button
                onClick={scrollPrev}
                className="absolute top-1/2 left-8 -translate-y-1/2 w-14 h-14 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl text-slate-800 hover:bg-[hsl(var(--swago-purple))] hover:text-white transition-all z-[60]"
              >
                <ChevronLeft className="w-6 h-6 stroke-[3px]" />
              </button>
              <button
                onClick={scrollNext}
                className="absolute top-1/2 right-8 -translate-y-1/2 w-14 h-14 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl text-slate-800 hover:bg-[hsl(var(--swago-purple))] hover:text-white transition-all z-[60]"
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
