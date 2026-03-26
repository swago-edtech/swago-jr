"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Brain, Gamepad2, MonitorOff } from "lucide-react";

const features = [
  {
    title: "1. Future-Ready Skills",
    description: "Build focus, confidence, and problem-solving skills that no AI can replace",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.906 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
    color: "text-[hsl(var(--swago-purple))]",
    borderColor: "border-[hsl(var(--swago-purple))]",
    bgColor: "bg-purple-50/50",
  },
  {
    title: "2. Gamified Learning",
    description: "Every box is a mission — with challenges and rewards that keep kids engaged and excited to learn",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" />
      </svg>
    ),
    color: "text-[hsl(var(--swago-orange))]",
    borderColor: "border-[hsl(var(--swago-orange))]",
    bgColor: "bg-orange-50/50",
  },
  {
    title: "3. 100% Screen-Free Play",
    description: "Hands-on activities that reduce screen time and build real skills through play",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
      </svg>
    ),
    color: "text-[hsl(var(--swago-teal))]",
    borderColor: "border-[hsl(var(--swago-teal))]",
    bgColor: "bg-teal-50/50",
  },
];

export default function WhySwagoIsFunSection() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16 md:mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-slate-800 mb-6 uppercase tracking-tight leading-none"
          >
            Why Choose <span className="text-[hsl(var(--swago-purple))]">Swago?</span>
          </motion.h2>
          <div className="w-24 h-2 bg-gradient-to-r from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-orange))] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col group cursor-default w-full max-w-[320px] md:max-w-none mx-auto"
            >
              {/* Custom Card Box */}
              <div className={`relative h-full flex flex-col items-center p-8 md:p-10 pt-16 text-center rounded-[3rem] transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-2 bg-white overflow-hidden border-2 border-t-0 border-dashed ${feature.borderColor} shadow-sm`}>
                
                {/* 5-Color Solid Top Line */}
                <div className="absolute top-0 left-0 right-0 h-2 flex">
                  <div className="flex-1 bg-[hsl(var(--swago-pink))]" />
                  <div className="flex-1 bg-[hsl(var(--swago-purple))]" />
                  <div className="flex-1 bg-[hsl(var(--swago-sky-blue))]" />
                  <div className="flex-1 bg-[hsl(var(--swago-teal))]" />
                  <div className="flex-1 bg-[hsl(var(--swago-orange))]" />
                </div>

                {/* Icon Container - Reduced to 50-60% size */}
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full ${feature.bgColor} flex items-center justify-center mb-8 border-2 ${feature.borderColor} group-hover:scale-110 transition-all duration-300 shadow-sm relative`}>
                  <div className={`${feature.color} flex items-center justify-center`}>
                    {feature.icon || null}
                  </div>
                </div>
                
                <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-4 md:mb-6 leading-tight uppercase tracking-tight">
                  {feature.title}
                </h3>
                
                <p className="text-slate-600 font-bold text-xs md:text-base leading-relaxed opacity-90 max-w-[240px] mx-auto">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}