"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";

// Updated the 'description' for each element to be a product-focused one-liner
const elements = [
  { 
    letter: "S", 
    name: "Smart Tech",
    bgColor: "bg-pink-500",
    shadowColor: "bg-pink-700",
    textColor: "text-pink-500",
    description: "Explore coding, science, and logic with our interactive tech kits."
  },
  { 
    letter: "W", 
    name: "Willpower", 
    bgColor: "bg-cyan-400",
    shadowColor: "bg-cyan-600",
    textColor: "text-cyan-500",
    description: "Build confidence and creativity through guided journals and fun games."
  },
  { 
    letter: "A", 
    name: "Ambition", 
    bgColor: "bg-blue-500",
    shadowColor: "bg-blue-700",
    textColor: "text-blue-500",
    description: "Set goals and chase big dreams with our vision boards and activities."
  },
  { 
    letter: "G", 
    name: "Growth", 
    bgColor: "bg-orange-400",
    shadowColor: "bg-orange-600",
    textColor: "text-orange-500",
    description: "Master foundational skills in reading, writing, and coordination."
  },
  { 
    letter: "O", 
    name: "Optimization", 
    bgColor: "bg-purple-500",
    shadowColor: "bg-purple-700",
    textColor: "text-purple-500",
    description: "Sharpen problem-solving skills with fun puzzles and brain-teasers."
  },
];

const cardVariants: Variants = {
  initial: { y: 0 },
  hover: { y: -10, transition: { type: "spring", stiffness: 300 } }
};

const shadowVariants: Variants = {
    initial: { scaleX: 1 },
    hover: { scaleX: 1.15, transition: { type: "spring", stiffness: 300, damping: 20 } }
}

export default function SwagoElementsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 place-items-center">
          {elements.map((element) => (
            <Link key={element.letter} href={`/products?elements=${element.letter}`} className="w-full max-w-xs text-center">
              <motion.div
                className="flex flex-col items-center"
                initial="initial"
                whileHover="hover"
              >
                <div className="relative mb-4">
                  <motion.div 
                    className={`h-24 w-24 relative mx-auto flex items-center justify-center rounded-full ${element.bgColor}`}
                    variants={cardVariants}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
                      <span className={`text-2xl font-bold ${element.textColor}`}>
                        {element.letter}
                      </span>
                    </div>
                  </motion.div>
                  <motion.div 
                    className={`h-4 w-16 absolute -bottom-2 left-1/2 -translate-x-1/2 transform rounded-full ${element.shadowColor}`}
                    variants={shadowVariants}
                  />
                </div>
                <div className="px-2">
                  <h3 className="mb-2 text-lg font-bold text-slate-800">{element.name}</h3>
                  <p className="text-sm leading-snug text-gray-600">{element.description}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}