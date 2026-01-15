"use client";

import React from "react";
import Link from "next/link";

export default function AmbassadorCTA() {
  return (
    <section className="py-5 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Main CTA Card */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-slate-200 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
          <div className="p-6 md:p-10">
            <p className="text-slate-800 text-base md:text-lg leading-relaxed max-w-5xl mx-auto text-center">
              At Swago, we help children grow into confident, curious, and capable human beings, 
              not through pressure, but through play.
              <br />
              <br />
              Our world is built around five core skills that matter in real life:{" "}
              <span className="font-semibold text-pink-600">Smart Tech</span>,{" "}
              <span className="font-semibold text-teal-600">Willpower</span>,{" "}
              <span className="font-semibold text-blue-600">Ambition</span>,{" "}
              <span className="font-semibold text-orange-600">Growth Mindset</span>, and{" "}
              <span className="font-semibold text-purple-600">Optimization</span>.
              <br />
              <br />
              Through our playful Swago Smart Boxes, simple challenges, and everyday moments, 
              children learn to think, move, try, and express in ways that slowly build self-belief.
              <br />
              <br />
              Swago isn&apos;t about being perfect , it&apos;s about discovering who you are, one small win at a time, 
              and growing up with the feeling every child deserves:{" "}
              <span className="font-bold text-purple-600">&quot;Yes, I can.&quot;</span> 💛
            </p>
          </div>
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
            className="inline-block btn-shine bg-gradient-to-r from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-pink))] text-white font-bold text-base md:text-lg px-8 py-3.5 rounded-full shadow-xl hover:scale-105 transition-all duration-300"
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
      </div>
    </section>
  );
}
