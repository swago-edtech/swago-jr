"use client";

import Link from "next/link";
import Image from "next/image"; // 1. Import the Image component

const elements = [
  {
    icon: "/images/icon-smart-tech.png",
    name: "Smart Tech",
    letter: "S",
    description: "Fun learning through technology and games.",
    color: "hsl(var(--swago-teal))",
  },
  {
    icon: "/images/icon-willpower.png",
    name: "Willpower",
    letter: "W",
    description: "Building resilience and focus.",
    color: "hsl(var(--swago-orange))",
  },
  {
    icon: "/images/icon-ambition.png",
    name: "Ambition",
    letter: "A",
    description: "Encouraging big goals and dreams.",
    color: "hsl(var(--swago-purple))",
  },
  {
    icon: "/images/icon-growth.png",
    name: "Growth",
    letter: "G",
    description: "Fostering curiosity and continuous learning.",
    color: "hsl(var(--swago-pink))",
  },
  {
    icon: "/images/icon-optimization.png",
    name: "Optimization",
    letter: "O",
    description: "Improving skills and finding better ways to learn.",
    color: "hsl(var(--swago-sky-blue))",
  },
];

export default function CoreElements() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-4">Our Core 5 Elements</h2>
        <p className="text-slate-600 mb-12">Every activity at Swago focuses on 5 super skills your kid will love.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {elements.map((element) => (
            <Link key={element.name} href={`/products?elements=${element.letter}`} className="group flex flex-col items-center">
              <div className="relative flex items-center justify-center mb-4">
                <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: element.color }}>
                  {/* 2. Replace <img> with <Image> */}
                  <Image 
                    src={element.icon} 
                    alt={element.name} 
                    width={48}  // Corresponds to w-12
                    height={48} // Corresponds to h-12
                  />
                </div>
                <div 
                  className="absolute w-24 h-24 rounded-full border-2 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 ease-in-out"
                  style={{ borderColor: element.color }}
                ></div>
              </div>
              <h3 className="text-xl font-bold">{element.name}</h3>
              <p className="text-slate-500 mt-2 text-sm">{element.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}