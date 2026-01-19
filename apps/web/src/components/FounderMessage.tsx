"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function FounderMessage() {
  return (
    <section>

      <div className="w-full md:max-w-8xl mx-(-2)">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-pink-100  overflow-hidden shadow-lg grid grid-cols-1 lg:grid-cols-2"
        >
          {/* Left Side - Image */}
          <div className="relative h-[450px] md:h-full ">
            <Image
              src="/images/SwatiGoyal.jpeg"
              alt="Swati Goyal - Founder of Swago"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Right Side - Content */}
          <div className="p-2 md:p-4 flex flex-col justify-center">
            <div className="space-y-5 text-slate-900 leading-relaxed text-[15px]">
              <p>Dear Parents,</p>
              <p>
                <b>Swago </b> began with a simple question I asked myself as a mother:
                <br />
                What if learning could make a child believe <b>&quot;Yes, I can&quot;? </b>
              </p>

              <p>
                My son is dyslexic.
                <br />
                Traditional learning often told him what he couldn&apos;t do.
                <br />
                So we tried a different path <b> movement, games, joy, and
                patience. </b>
              </p>

              <p>Slowly, something powerful happened.</p>

              <p>
                Before solving sums or writing answers, he started <b>solving
                problems.  </b>
                <br />
                Before scoring marks, he started <b> believing in himself. </b>
                <br />
                And once that <b> belief </b> was in place, academics followed naturally.
              </p>

              <p> <b>That belief became the foundation of Swago. </b> </p>

              <p>
                <b>At Swago </b> , every skill we teach leads to one outcome:
                <br />
                <b> Strong problem solvers who face life with confidence. </b>
              </p>

              <p>
                Through  gamification and movement-based learning , children stay
                motivated, upbeat, and curious. They don&apos;t just learn what to
                think , <b> they learn how to think, adapt, and figure things out. </b>
              </p>

              <p>
                Because in a world where AI can do many things, the most
                important skill a child can have is the courage to say 
                <br />
               <b> &quot;Yes, I can.&quot; </b>
              </p>

              <p>
                That&apos;s not just our tagline.
                <br />
                <b> It&apos;s our promise. </b>
              </p>

              {/* Signature */}
              <div className="border-t border-slate-300 pt-5 mt-6">
                <p className="italic mb-2 text-slate-600">
                  With purpose and heart,
                </p>
                <p className="font-bold text-lg mb-1 text-slate-800">
                  Swati Goyal
                </p>
                <p className="mb-1 text-slate-700">Founder, Swago</p>
                <p className="text-sm text-slate-600">
                  Where your kid believes — Yes, I Can
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      {/* Content */}
              <div className="relative z-10 pt-8 md:pt-12 text-center">
                {/* Badge */}
                <div className="inline-block mb-6 px-4 py-1.5 bg-purple-100 rounded-full text-xs font-bold text-purple-700">
                  Limited Spots Available
                </div>
      
                {/* Title - Simple Design */}
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-slate-800">
                  Join our Swago Kid Brand Ambassador Program
                </h2>
      
                {/* CTA Button */}
                <Link
                  href="/ambassador"
                  className="inline-block btn-shine bg-[hsl(var(--swago-purple))] text-white font-bold text-base md:text-lg px-8 py-3.5 rounded-full shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    Start Your Journey
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </span>
                </Link>
              </div>
    </section>
  );
}
