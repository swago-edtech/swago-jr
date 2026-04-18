"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";


export default function WhatIsSwago() {
  return (
    /* SECTION PADDING: Matched exactly to Founder Note (py-16 to py-24) */
    <section className="w-full bg-slate-50 py-8 lg:py-12 font-poppins overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
        
        {/* LAYOUT: flex-col-reverse for Mobile (Image Top), lg:flex-row for Desktop */}
        <div className="flex flex-col-reverse lg:flex-row items-start gap-12 lg:gap-24">
          
          {/* Left Side - Narrative Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-[60%] flex flex-col justify-start"
          >
            {/* HEADER: Matched size and tracking to Founder section */}
            <h2 className="text-4xl md:text-5xl text-[hsl(var(--swago-purple))] font-bold tracking-tighter mb-4 leading-tight">
              SWAGO is...
            </h2>

            {/* BODY TEXT: Using exact 18px size and 1.8 line-height for consistency */}
            <div className="space-y-4 text-[18px] leading-[1.7] text-slate-600 font-normal tracking-tight">
              
              {/* Lead Paragraph: 24px for prominence */}
              <p className="">
                a screen-free ecosystem of physical smart boxes designed to bridge the gap between play and real-world mastery.
              </p>

              {/* Standard Paragraph: 18px matched to Founder Note body */}
              <p>
                Every box is a mission, a series of curated challenges that transform focus, confidence, and expression into second nature. We move children away from the passivity of screens and into the momentum of active growth.
              </p>

              {/* Outcome Statement */}
              <p className="text-slate-900 font-semibold">
                This is where &quot;I can’t&quot; becomes <span className="text-[hsl(var(--swago-purple))]">&quot;Yes, I can.&quot;</span>
              </p>
            </div>

            {/* CTA Button: Integrated into the text flow */}
            {/* LINKED CTA BUTTON */}
            <div className="pt-6">
              <Link href="/products">
                <button className="group flex items-center gap-3 px-5 py-3 bg-[hsl(var(--swago-purple))] hover:bg-[#5e4f8d] text-white rounded-2xl font-bold transition-all duration-300 shadow-xl shadow-purple-100 hover:-translate-y-1 active:scale-95 cursor-pointer">
                  <ShoppingBag size={22} className="group-hover:rotate-12 transition-transform" />
                  Buy Swago Smart Boxes
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Right Side - Image Frame */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:w-[40%] flex justify-center lg:justify-end"
          >
            {/* ASPECT RATIO FIX: aspect-[4/3] prevents white bars at top/bottom of your image */}
            <div className="relative w-full max-w-[550px] aspect-[4/3] rounded-[2rem] lg:rounded-[3rem] overflow-hidden 
                            bg-white transition-all duration-700 ease-out hover:scale-[1.02]
                            shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)]">
              
              <Image
                src="/images/home/what-is-swago.jpeg" 
                alt="Swago Smart Box"
                fill
                /* object-cover + center ensures the image fills the 4:3 frame perfectly */
                className="object-cover object-center transition-transform duration-700"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />

              {/* Subtle inner-glow ring for premium finish */}
              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[2rem] lg:rounded-[3rem] pointer-events-none" />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}