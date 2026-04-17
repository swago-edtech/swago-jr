"use client";

import React from "react";
import { motion } from "framer-motion";

export default function EntryChallengeDetails() {
  const steps = [
    { icon: "💃", text: "Try the fun brain-gym movements or move, dance or act in your own way" },
    { icon: "📹", text: "Record a short, playful video" },
    { icon: "📲", text: "Post as Instagram Reel" },
    { icon: "🏷️", text: "Tag & Collab @swagojr", hasLink: true },
  ];

  // Render step text with clickable Instagram link
  const renderStepText = (step: { text: string; hasLink?: boolean }) => {
    if (step.hasLink && step.text.includes("@swagojr")) {
      const parts = step.text.split("@swagojr");
      return (
        <>
          {parts[0]}
          <a
            href="https://www.instagram.com/swagojr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[hsl(var(--swago-purple))] hover:text-purple-700 font-bold "
          >
            @swagojr
          </a>
          {parts[1]}
        </>
      );
    }
    return step.text;
  };

  return (
    <section className="py-8 md:py-12 px-4 bg-[hsl(var(--swago-purple))]/5">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 text-center">
            Swago Ambassador First Entry Challenge
          </h2>
          <p className="text-lg text-slate-600 text-center mb-8 max-w-3xl mx-auto">
            We will share a <strong>fun Swago Brain-Gym Song</strong> and a demo video.
            Your child simply needs to:
          </p>

          {/* Action Buttons */}
          <div className="flex flex items-center justify-center gap-4 mb-10">
            <a
              href="https://youtu.be/t8WBBk1UIis"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[hsl(var(--swago-purple))] text-white font-bold text-md md:text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <span>Play Song</span>
            </a>
            <a
              href="https://youtu.be/t8WBBk1UIis"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[hsl(var(--swago-purple))] text-white font-bold text-md md:text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <span>Watch Demo</span>
            </a>
          </div>

          {/* Steps Grid - 2x2 Layout on Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 max-w-4xl mx-auto">
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
                <p className="text-slate-700 font-medium text-sm">
                  {renderStepText(step)}
                </p>
              </motion.div>
            ))}
          </div>

          {/* No Pressure Message */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-4 border-[hsl(var(--swago-orange))]">
            <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center">
              That&apos;s it!
            </h3>
            <div className="space-y-3 text-center max-w-2xl mx-auto">
              <div className="flex flex-wrap justify-center gap-4 text-slate-600 font-semibold">
                <span>❎ No right way</span>
                <span>❎ No wrong way</span>
                <span>❎ No judgement</span>
              </div>
              <p className="text-lg text-slate-700 mt-4">
                Shy, silly, slow, playful or imperfect  <br /> <strong className="text-[hsl(var(--swago-orange))]">all are welcome</strong>.
              </p>
              <p className="text-xl font-bold text-transparent bg-clip-text bg-[hsl(var(--swago-purple))] mt-4">
                Because at Swago, we celebrate effort, not perfection.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
