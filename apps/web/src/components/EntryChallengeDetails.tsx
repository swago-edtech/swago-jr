"use client";

import React from "react";
import { motion } from "framer-motion";

export default function EntryChallengeDetails() {
  const steps = [
    { icon: "🎵", text: "Play the Swago Brain-Gym Song" },
    { icon: "💃", text: "Try the fun brain-gym movements" },
    { icon: "🌟", text: "Move, dance or act in your own way" },
    { icon: "📹", text: "Record a short, playful video" },
    { icon: "📲", text: "Post as Instagram Reel" },
    { icon: "🏷️", text: "Tag & Collab @swagojr" },
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 text-center">
            🎬 Swago Ambassador First Entry Challenge
          </h2>
          <p className="text-lg text-slate-600 text-center mb-8 max-w-3xl mx-auto">
            We will share a <strong>fun Swago Brain-Gym Song</strong> and a demo video. 
            Your child simply needs to:
          </p>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-xl p-5 shadow-md flex items-center gap-3 hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl flex-shrink-0">{step.icon}</div>
                <p className="text-slate-700 font-medium text-sm">{step.text}</p>
              </motion.div>
            ))}
          </div>

          {/* No Pressure Message */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-4 border-yellow-200">
            <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">
              💛 That&apos;s it!
            </h3>
            <div className="space-y-3 text-center max-w-2xl mx-auto">
              <p className="text-lg text-slate-700">There is:</p>
              <div className="flex flex-wrap justify-center gap-4 text-slate-600 font-semibold">
                <span>❌ No right way</span>
                <span>❌ No wrong way</span>
                <span>❌ No judgement</span>
              </div>
              <p className="text-lg text-slate-700 mt-4">
                Shy, silly, slow, playful or imperfect — <strong className="text-purple-600">all are welcome</strong>.
              </p>
              <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-orange-600 mt-4">
                Because at Swago, we celebrate effort, not perfection.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
