"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSharedContext } from "@/context/SharedContext";
import { useRouter } from "next/navigation";

const earnSteps = [
  {
    id: "01",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" />
      </svg>
    ),
    title: "Create Your Swagoverse Profile",
    description: "Start your journey and unlock your Swago identity",
    color: "#FBBF24", // Yellow
    lightColor: "#FEF3C7",
    link: "/profile",
  },
  {
    id: "02",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    title: "Complete the “Yes I Can” Mission",
    description: "Share your child’s Brain Gym video to earn 20 Swago Dollars and unlock Swago Ambassador eligibility",
    color: "#F97316", // Orange
    lightColor: "#FFEDD5",
    link: "/swago-song",
  },
  {
    id: "03",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
      </svg>
    ),
    title: "Enter Your Lucky Ticket",
    description: "Find your ticket inside the box and earn your 10 Swago Dollars",
    color: "#EC4899", // Pink
    lightColor: "#FCE7F3",
    link: "/lottery-code",
  },
  {
    id: "04",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    title: "Join the Swago Community",
    description: "Connect with 2000+ parents and unlock exclusive rewards and missions",
    color: "#A855F7", // Purple
    lightColor: "#F3E8FF",
    link: "https://www.whatsapp.com/channel/0029VbCEELmATRSt1LCXtP0w",
  },
];

export default function HowToEarnSwagoMoney() {
  const { user } = useSharedContext();
  const router = useRouter();

  const handleCardClick = (link: string) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(link)}`);
      return;
    }

    if (link.startsWith("http")) {
      window.open(link, "_blank");
    } else {
      router.push(link);
    }
  };

  return (
    <section className="py-20 bg-[#F9FAFB] overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight"
          >
            How to earn <span className="text-[hsl(var(--swago-purple))]">Swago Dollars</span>
          </motion.h2>
          <div className="w-24 h-1.5 bg-[hsl(var(--swago-purple))] mx-auto rounded-full" />
        </div>

        {/* Desktop View (Horizontal) */}
        <div className="hidden lg:block relative pt-10">
          {/* Horizontal Line */}
          <div className="absolute top-[85px] left-[10%] right-[10%] h-0.5 bg-slate-200 z-0" />

          <div className="grid grid-cols-4 gap-4 relative z-10 items-stretch">
            {earnSteps.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="flex flex-col"
              >
                <div onClick={() => handleCardClick(step.link)} className="flex flex-col flex-1 group cursor-pointer">
                  {/* Numbered Circle */}
                  <div
                    className="w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center border-[6px] border-white shadow-xl mb-12 transition-transform group-hover:scale-110 cursor-pointer mx-auto"
                    style={{ backgroundColor: step.color }}
                  >
                    <span className="text-white text-2xl font-black">{step.id}</span>
                  </div>

                  {/* Content Card (Bubble style) */}
                  <div className="bg-white p-6 md:p-7 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-slate-50 relative group hover:shadow-2xl transition-all duration-300 w-full flex-1 flex flex-col cursor-pointer overflow-hidden">
                    {/* Bubble Arrow (Top) */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rotate-45 z-0" />

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="text-black mb-4 transform group-hover:scale-110 transition-transform">{step.icon}</div>
                      <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2 leading-tight group-hover:text-[hsl(var(--swago-purple))] transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-slate-500 font-medium text-xs md:text-sm leading-relaxed mb-4">
                        {step.description}
                      </p>

                      {/* Info Badge (Guidance) */}
                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-50 opacity-60 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[hsl(var(--swago-purple))]">Click to Start</span>
                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-slate-50 group-hover:bg-[hsl(var(--swago-purple))] flex items-center justify-center transition-colors">
                          <svg className="w-3 h-3 md:w-4 md:h-4 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Hint overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--swago-purple))]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile View (Vertical) */}
        <div className="lg:hidden relative">
          {/* Vertical Line */}
          <div className="absolute left-[39px] top-0 bottom-0 w-0.5 bg-slate-200 z-0" />

          <div className="space-y-12 relative z-10">
            {earnSteps.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col"
              >
                <div onClick={() => handleCardClick(step.link)} className="flex gap-6 group cursor-pointer">
                  {/* Numbered Circle */}
                  <div
                    className="w-20 h-20 flex-shrink-0 rounded-full flex items-center justify-center border-[4px] border-white shadow-lg relative z-20 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: step.color }}
                  >
                    <span className="text-white text-xl font-black">{step.id}</span>
                  </div>

                  {/* Content Card */}
                  <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex-1 relative mt-1 transition-all group-hover:shadow-md">
                    {/* Bubble Arrow (Left) */}
                    <div className="absolute top-6 -left-2 w-4 h-4 bg-white rotate-45 border-l border-b border-slate-100 z-0" />

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="text-black mb-1 transform group-hover:scale-110 transition-transform scale-75 origin-left">{step.icon}</div>
                      <h3 className="text-base font-black text-slate-800 mb-0.5 leading-tight group-hover:text-[hsl(var(--swago-purple))] transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-slate-500 font-bold text-xs leading-relaxed opacity-80 mb-2">
                        {step.description}
                      </p>

                      <div className="mt-auto flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[hsl(var(--swago-purple))] opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Get Started</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
