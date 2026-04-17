"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function FounderMessage() {
  return (
    <section className="w-full relative overflow-hidden bg-slate-50">

      {/* SECTION 1: Intro (Image Left, Text Right) - Standalone section */}
      <div className="w-full relative flex flex-col lg:flex-row items-stretch min-h-[500px]">
        {/* Left Side - Image (Now expanded natively to fill container) */}
        <div className="w-full lg:w-1/2 flex p-0 m-0 lg:pt-0.5">
          <div className="relative w-full min-h-[400px] lg:min-h-full overflow-hidden">
            <Image
              src="/images/SwatiGoyal.jpeg"
              alt="Swati Goyal - Founder of Swago"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Subtle Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Right Side - Content */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12 lg:p-16 xl:p-24"
        >
          <div className="max-w-2xl space-y-6 text-slate-600 leading-relaxed text-lg lg:text-[19px]">
            <p className="font-bold text-slate-800 text-2xl tracking-tight mb-8">Dear Parents,</p>

            <p>
              <strong className="text-purple-700 font-bold border-b-2 border-purple-200 pb-0.5 text-xl">Swago</strong> began with a simple question I asked myself as a mother:
            </p>
            <p className="text-xl md:text-2xl font-semibold text-slate-800 leading-snug">
              What if learning could make a child believe &quot;Yes, I can&quot;?
            </p>

            <p>
              My son is dyslexic. Traditional learning often told him what he couldn&apos;t do. So we tried a different path—<strong className="text-slate-800 font-medium">movement, games, joy, and patience.</strong>
            </p>

            <p className="text-purple-900/80 font-medium pl-6 border-l-4 border-purple-300 italic text-xl">
              Slowly, something powerful happened.
            </p>

            <p>
              Before solving sums or writing answers, he started <strong className="text-slate-800 font-medium">solving problems.</strong> Before scoring marks, he started <strong className="text-slate-800 font-medium">believing in himself.</strong> And once that belief was in place, academics followed naturally.
            </p>
          </div>
        </motion.div>
      </div>

      {/* --- GROUPED SECTIONS --- */}
      {/* <div className="w-full bg-white mt-8 py-20 lg:py-32 relative"> */}
      {/* Subtle background divider element */}
      {/* <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent opacity-60" /> */}

      {/* <div className="text-center mb-16 lg:mb-24 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-bold tracking-widest text-purple-600 uppercase mb-4 block">Our Philosophy</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-tight">The Swago Foundation</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 mx-auto mt-8 rounded-full" />
          </motion.div> */}
      {/* </div> */}

      {/* SECTION 2: Text Left, Image Right */}
      {/* <div className="w-full relative flex flex-col-reverse lg:flex-row items-center mb-24 lg:mb-32"> */}
      {/* Left Side - Content */}
      {/* <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12 lg:p-16 xl:p-24"
          >
            <div className="max-w-xl space-y-6 text-slate-600 leading-relaxed text-lg lg:text-[19px]">
              <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-700 text-3xl md:text-4xl mb-4">
                Creating Problem Solvers
              </h3>

              <p>
                That belief became the foundation of Swago. At Swago, every skill we teach leads to one outcome: <strong className="text-slate-800 font-medium">Strong problem solvers who face life with confidence.</strong>
              </p>

              <p>
                Through gamification and movement-based learning, children stay motivated, upbeat, and curious. They don&apos;t just learn what to think, <strong className="text-slate-800 font-medium">they learn how to think, adapt, and figure things out.</strong>
              </p>
            </div>
          </motion.div> */}

      {/* Right Side - Image */}
      {/* <div className="w-full lg:w-1/2 flex justify-center p-8 lg:p-12">
            <div className="relative w-full max-w-lg aspect-[5/4] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl transition-transform duration-500 hover:-translate-y-2">
              <Image
                src="/images/SWAGO_Slide_1.jpg"
                alt="Children playing and learning at Swago"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 600px"
              />
            </div>
          </div> */}
      {/* </div> */}

      {/* SECTION 3: Image Left, Text Right */}
      {/* <div className="w-full relative flex flex-col lg:flex-row items-center"> */}
      {/* Left Side - Image */}
      {/* <div className="w-full lg:w-1/2 flex justify-center p-8 lg:p-12">
            <div className="relative w-full max-w-lg aspect-[5/4] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl transition-transform duration-500 hover:-translate-y-2 filter contrast-105">
              <Image
                src="/images/hero-banner.jpg"
                alt="Children building confidence"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 600px"
              />
            </div>
          </div> */}

      {/* Right Side - Content */}
      {/* <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12 lg:p-16 xl:p-24"
          >
            <div className="max-w-xl space-y-6 text-slate-600 leading-relaxed text-lg lg:text-[19px]">
              <p>
                Because in a world where AI can do many things, the most important skill a child can have is the courage to say:
              </p>

              <div className="py-6">
                <span className="text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 inline-block drop-shadow-sm">
                  &quot;Yes, I can.&quot;
                </span>
              </div>

              <p className="text-xl font-medium text-slate-700">
                That&apos;s not just our tagline. <strong className="text-slate-900 border-b-2 border-purple-400">It&apos;s our promise.</strong>
              </p> */}

      {/* Signature */}
      {/* <div className="pt-12 mt-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-[3px] bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full" />
                  <p className="italic text-slate-500 text-lg">
                    With purpose and heart,
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-slate-900 font-bold text-2xl mb-1 flex items-center gap-2">Swati Goyal <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1"></span></p>
                  <p className="text-purple-600 font-semibold tracking-wide uppercase text-sm">Founder, Swago</p>
                </div>
              </div>
            </div>
          </motion.div> */}
      {/* </div> */}

      {/* </div> */}

    </section>
  );
}