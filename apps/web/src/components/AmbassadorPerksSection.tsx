"use client";

import React from "react";
import { motion } from "framer-motion";

export default function AmbassadorPerksSection() {
  const perks = [
    {
      icon: "🎓",
      title: "Special Masterclasses",
      text: "Your child gets special confidence and AI masterclasses that help them speak up, express themselves, and think smart.",
      color: "from-[hsl(var(--swago-purple))]/10 to-[hsl(var(--swago-purple))]/5",
    },
    {
      icon: "🎯",
      title: "Monthly Challenges",
      text: "They receive fun little monthly challenges that quietly build focus, coordination, courage, and leadership.",
      color: "from-[hsl(var(--swago-orange))]/10 to-[hsl(var(--swago-orange))]/5",
    },
    {
      icon: "🔬",
      title: "Junior Researcher Status",
      text: "They become a Swago Junior Researcher, getting to try new Swago boxes and activities before others and share what they think.",
      color: "from-[hsl(var(--swago-purple))]/10 to-[hsl(var(--swago-purple))]/5",
    },
    {
      icon: "🎁",
      title: "Exclusive Rewards",
      text: "They unlock member-only rewards, discounts and small surprises, making them feel like a special insider in the Swago world.",
      color: "from-[hsl(var(--swago-orange))]/10 to-[hsl(var(--swago-orange))]/5",
    },
    {
      icon: "⭐",
      title: "Featured Swago Kid",
      text: "Some children will even be featured as Swago Kids in our stories, campaigns, or packaging, celebrating their journey, not just their performance.",
      color: "from-[hsl(var(--swago-purple))]/10 to-[hsl(var(--swago-purple))]/5",
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
              At 500 Swago Dollars, your child unlocks:
            </h2>

            {/* Badge */}
            <div className="inline-block bg-[hsl(var(--swago-orange))] text-white px-8 py-4 rounded-2xl shadow-lg mb-4">
              <p className="text-xl font-bold flex items-center justify-center gap-2">
                <span>Official Swago Kid Brand Ambassador Status 🏆</span>
              </p>
            </div>

            <p className="text-lg text-slate-600 mt-4">
              With special badges, features, and exclusive rewards.
            </p>
          </div>

          {/* Main Content Box */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            {/* Section Title */}
            <h3 className="text-xl md:text-3xl font-bold text-slate-800 mb-6 text-center">
              <span>What Your Child Gets as Official Swago Kid Brand Ambassador</span>
            </h3>

            {/* Intro Paragraph */}
            <p className="text-lg text-slate-700 mb-10 text-center leading-relaxed">
              As your child walks through the Swago Ambassador Journey, they slowly begin to grow in ways that really matter.
            </p>

            {/* Perks Layout - 3 in first row, 2 in second row */}
            <div className="space-y-6">
              {/* First Row - 3 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {perks.slice(0, 3).map((perk, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`bg-gradient-to-br ${perk.color} rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-200`}
                  >
                    {/* Icon */}
                    <div className="text-4xl mb-4">{perk.icon}</div>
                    
                    {/* Title */}
                    <h4 className="text-lg font-bold text-slate-800 mb-3">
                      {perk.title}
                    </h4>
                    
                    {/* Text */}
                    <p className="text-slate-700 leading-relaxed">
                      {perk.text}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Second Row - 2 Cards Centered */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:max-w-4xl md:mx-auto">
                {perks.slice(3, 5).map((perk, index) => (
                  <motion.div
                    key={index + 3}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: (index + 3) * 0.1 }}
                    className={`bg-gradient-to-br ${perk.color} rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-200`}
                  >
                    {/* Icon */}
                    <div className="text-4xl mb-4">{perk.icon}</div>
                    
                    {/* Title */}
                    <h4 className="text-lg font-bold text-slate-800 mb-3">
                      {perk.title}
                    </h4>
                    
                    {/* Text */}
                    <p className="text-slate-700 leading-relaxed">
                      {perk.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Message */}
          <div className="bg-[hsl(var(--swago-purple))] rounded-2xl p-8 md:p-10 text-center text-white shadow-xl">
            <p className="text-lg md:text-xl font-medium mb-3 opacity-90">
              And beyond all this, your child starts to build something deeper: <br />
              the feeling that
            </p>
            <p className="text-lg md:text-xl font-medium">
              <span className="text-[hsl(var(--swago-orange))] text-3xl md:text-5xl font-bold">&quot;Yes, I can.&quot;</span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
