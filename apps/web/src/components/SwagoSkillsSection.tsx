"use client";

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Zap, Brain, Star, Target, Compass } from 'lucide-react';

const skills = [
  {
    name: "Optimization",
    tagline: "Brain Power & Focus",
    description: "Train the mind to filter distractions and achieve peak synchronization.",
    mascot: "/images/home/op_profile.png",
    color: "bg-[#818CF8]",
    icon: Zap,
    letter: "O"
  },
  {
    name: "Willpower",
    tagline: "Resilience & Grit",
    description: "Building the mental strength to persist through any learning curve.",
    mascot: "/images/home/woo_profile.png",
    color: "bg-[#2DD4BF]",
    icon: Brain,
    letter: "W"
  },
  {
    name: "Spotlight",
    tagline: "Confidence & Expression",
    description: "Developing the stage presence to share ideas with the world.",
    mascot: "/images/home/skoo_profile.png",
    color: "bg-[#F472B6]",
    icon: Star,
    letter: "S"
  },
  {
    name: "Ambition",
    tagline: "Leadership & Vision",
    description: "Setting high goals and leading with curiosity and confidence.",
    mascot: "/images/home/aga_profile.png",
    color: "bg-[#60A5FA]",
    icon: Target,
    letter: "A"
  },
  {
    name: "Growth",
    tagline: "Continuous Learning",
    description: "Nurturing a mindset that sees every experience as a lesson.",
    mascot: "/images/home/gogo_profile.png",
    color: "bg-[#FB923C]",
    icon: Compass,
    letter: "G"
  }
];

export default function SwagoSkillsSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'center',
    skipSnaps: false
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

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
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-slate-800 uppercase italic tracking-tighter mb-4"
          >
            Swago <span className="text-[hsl(var(--swago-purple))]">Skills</span> Hub
          </motion.h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">Level up your potential in the Swagoverse</p>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-5xl mx-auto px-12">
          <div className="overflow-hidden py-10" ref={emblaRef}>
            <div className="flex gap-8">
              {skills.map((skill, index) => (
                <div 
                  key={skill.name} 
                  className={`flex-[0_0_80%] sm:flex-[0_0_45%] lg:flex-[0_0_31%] min-w-0 transition-all duration-500 transform ${
                    selectedIndex === index ? "scale-105 opacity-100" : "scale-90 opacity-40 blur-[1px]"
                  }`}
                >
                   <motion.div 
                     className="bg-white rounded-[3rem] p-8 border-4 border-slate-50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col items-center text-center relative overflow-hidden group"
                   >
                     {/* Letter Background */}
                     <div className="absolute top-0 right-0 p-8 opacity-5">
                       <span className="text-9xl font-black italic">{skill.letter}</span>
                     </div>

                     {/* Round Image Container */}
                     <div className={`w-32 h-32 rounded-full p-1 border-4 border-white shadow-xl ${skill.color} mb-6 relative z-10 overflow-hidden`}>
                       <Image 
                         src={skill.mascot} 
                         alt={skill.name} 
                         fill 
                         className="object-cover group-hover:scale-110 transition-transform duration-500"
                       />
                     </div>

                     {/* Icon Badge */}
                     <div className={`absolute top-36 right-1/2 translate-x-[60px] w-12 h-12 rounded-full ${skill.color} border-4 border-white shadow-lg flex items-center justify-center z-20`}>
                        <skill.icon className="w-6 h-6 text-white" strokeWidth={3} />
                     </div>

                     <div className="mt-4 relative z-10">
                       <h3 className="text-2xl font-black text-slate-800 uppercase italic mb-1 tracking-tight">{skill.name}</h3>
                       <p className={`text-[10px] font-black uppercase tracking-widest mb-4 opacity-70`}>{skill.tagline}</p>
                       <p className="text-slate-500 font-bold text-xs leading-relaxed max-w-[200px] mx-auto opacity-90">{skill.description}</p>
                     </div>

                     <div className="mt-8 pt-6 border-t border-slate-50 w-full">
                       <div className="flex gap-2 justify-center">
                         {[1,2,3,4,5].map(i => (
                           <div key={i} className={`w-2 h-2 rounded-full ${i <= 4 ? skill.color : 'bg-slate-100'}`} />
                         ))}
                       </div>
                     </div>
                   </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <button 
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[hsl(var(--swago-purple))] transition-colors z-30"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={3} />
          </button>
          <button 
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[hsl(var(--swago-purple))] transition-colors z-30"
          >
            <ChevronRight className="w-6 h-6" strokeWidth={3} />
          </button>
        </div>

        {/* Indicator Dots */}
        <div className="flex justify-center gap-3 mt-12">
          {skills.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === selectedIndex ? "w-8 bg-[hsl(var(--swago-purple))]" : "w-2 bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
