"use client";

import React from "react";
import { motion } from "framer-motion";

export default function AmbassadorBenefitsSection() {
  const benefits = [
    {
      title: "What Happens After completing first Challenge",
      items: [
        "Enter the Swago Ambassador Journey officially",
        "Get Exclusive Masterclasses",
        "Receive new missions",
        "Solve fun brain challenges",
        "Earn Swago Money",
        "Progress toward Brand Ambassador status",
      ],
    },
  ];

  return (
    <section className="py-16 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-12 text-center">
            What Happens After You Complete first Challenge
          </h2>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="flex items-start gap-4 mb-6">
              
              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">
                  {benefits[0].title}
                </h3>
                <p className="text-lg text-slate-600 mb-6">
                  Once your child submits their video, they officially enter the <strong>Swago Ambassador Journey</strong>. From there, they will:
                </p>
              </div>
            </div>

            <ul className="space-y-3 ml-4">
              {benefits[0].items.map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-3 text-slate-700"
                >
                  <span className="text-purple-600 text-xl flex-shrink-0">✓</span>
                  <span className="text-lg">{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
