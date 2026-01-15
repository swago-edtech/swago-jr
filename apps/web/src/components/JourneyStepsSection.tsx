"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function JourneyStepsSection() {
  const steps = [
    {
      number: "1",
      emoji: "🦸",
      title: "Create Your Child's Swago Hero Profile",
      description: "This creates your child's digital identity inside the Swagoverse.",
      color: "from-purple-500 to-purple-600",
    },
    {
      number: "2",
      emoji: "🎬",
      title: "Complete the Entry Challenge",
      description: "Your child will do one fun, pressure-free task to enter the journey.",
      color: "from-pink-500 to-orange-500",
    },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 text-center">
            How Your Child Enters the Journey
          </h2>
          <p className="text-lg text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Two simple steps to begin an amazing adventure
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 rounded-2xl p-8 hover:shadow-xl transition-shadow"
              >
                {/* Step Number Badge */}
                <div
                  className={`absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}
                >
                  {step.number}
                </div>

                {/* Emoji */}
                <div className="text-5xl mb-4 text-center">{step.emoji}</div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-800 mb-3 text-center">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-slate-600 leading-relaxed text-center">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Bold Message Below Both Boxes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 text-center"
          >
            <p className="text-lg font-bold text-slate-700 max-w-3xl mx-auto">
             ⭐ 🌟 ⭐
            </p>
            <p className="text-lg font-bold text-slate-700 max-w-3xl mx-auto ">
             This challenge will help them build courage, confidence, self-expression, and brain-gym coordination.  
            </p>
            <p className="text-lg font-bold text-slate-700 max-w-3xl mx-auto">
             ⭐⭐
            </p>
          </motion.div>

          {/* CTA Button */}
          <div className="text-center mt-12">
            <Link
              href="/ambassador/register"
              className="inline-block btn-shine bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg px-10 py-4 rounded-full shadow-xl hover:scale-105 transition-transform"
            >
              <span className="flex items-center gap-2">
                Start Your Journey Now
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
        </motion.div>
      </div>
    </section>
  );
}
