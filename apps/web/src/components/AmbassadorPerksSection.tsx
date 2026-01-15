"use client";

import React from "react";
import { motion } from "framer-motion";

export default function AmbassadorPerksSection() {
  const perks = [
    {
      text: "➡️ Your child gets special confidence and AI masterclasses that help them speak up, express themselves, and think smart.",
    },
    {
      text: "➡️ They receive fun little monthly challenges that quietly build focus, coordination, courage, and leadership.",
    },
    {
      text: "➡️ They become a Swago Junior Researcher, getting to try new Swago boxes and activities before others and share what they think.",
    },
    {
      text: "➡️ They unlock member-only rewards, discounts and small surprises, making them feel like a special insider in the Swago world.",
    },
    {
      text: "➡️ Some children will even be featured as Swago Kids in our stories, campaigns, or packaging, celebrating their journey, not just their performance.",
    },
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header Section */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">
              At 500 Swago Money, your child unlocks:
            </h2>

            {/* Badge */}
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-lg mb-4">
              <p className="text-xl font-bold flex items-center justify-center gap-2">
                <span> Official Swago Kid Brand Ambassador Status 🏆</span>
              </p>
            </div>

            <p className="text-lg text-slate-600 mt-4">
              With special badges, features, and exclusive rewards.
            </p>
          </div>

          {/* Main Content Box */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            {/* Section Title with Emoji */}
            <h3 className="text-xl md:text-3xl font-bold text-slate-800 mb-6 flex items-center justify-center gap-3">
              
              <span>What Your Child Gets as Official Swago Kid Brand Ambassador </span>
        
            </h3>
             

            {/* Intro Paragraph */}
            <p className="text-lg text-slate-700 mb-8 text-center leading-relaxed">
              As your child walks through the Swago Ambassador Journey, they slowly begin to grow in ways that really matter.
            </p>

            {/* Perks List */}
            <div className="space-y-5">
              {perks.map((perk, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start gap-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                 
                  
                  {/* Text */}
                  <p className="text-slate-700 leading-relaxed">
                    {perk.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom Message */}
          <div className="bg-gradient-to-r from-purple-300 to-pink-400 rounded-2xl p-8 md:p-10 text-center text-white shadow-xl">
            <p className="text-lg md:text-xl font-medium mb-3 opacity-90">
              And beyond all this, your child starts to build something deeper: <br/>
              the feeling that
            </p>
            <p className="text-lg md:text-xl font-medium">
               <span className="text-yellow-300 text-3xl md:text-5xl font-bold">&quot;Yes, I can.&quot;</span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
