"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function FounderMessage() {
  return (
    <section className="py-5 px-4 ">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-pink-100 rounded-2xl overflow-hidden shadow-lg grid grid-cols-1 lg:grid-cols-2"
        >
          {/* Left Side - Image */}
          <div className="relative h-[450px] lg:h-[700px]">
            <Image
              src="/images/SwatiGoyal.jpeg"
              alt="Swati Goyal - Founder of Swago"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Right Side - Content */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="space-y-5 text-slate-900 leading-relaxed text-[15px]">
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
    </section>
  );
}
