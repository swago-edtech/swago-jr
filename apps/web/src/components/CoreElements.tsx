"use client";

import Link from "next/link";
import Image from "next/image";

const elements = [
  {
    icon: "/images/swoo.png",
    name: "Smart Tech",
    letter: "S",
    description: "Upskilling in AI & future technology.",
    color: "hsl(var(--swago-pink))",
  },
  {
    icon: "/images/william.png",
    name: "Willpower",
    letter: "W",
    description: "Building resilience and discipline.",
    color: "hsl(var(--swago-teal))",
  },
  {
    icon: "/images/aron.png",
    name: "Ambition",
    letter: "A",
    description: "Developing leadership qualities.",
    color: "hsl(var(--swago-sky-blue))",
  },
  {
    icon: "/images/gibbson.png",
    name: "Growth",
    letter: "G",
    description: "Confident communication and expression.",
    color: "hsl(var(--swago-orange))",
  },
  {
    icon: "/images/oswald.png",
    name: "Optimization",
    letter: "O",
    description: "Optimizing brain power and focus.",
    color: "hsl(var(--swago-purple))",
  },
];

export default function CoreElements() {
  return (
    <section className="py-10 bg-slate-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-4">Our Core 5 Elements</h2>
        <p className="text-slate-600 mb-12">
          Every activity at Swago focuses on 5 super skills your kid will love.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {elements.map((element) => (
            <Link
              key={element.name}
              href={`/products?elements=${element.letter}`}
              className="group flex flex-col items-center"
            >
              <div className="relative flex items-center justify-center mb-4">
                {/* Colored glow on hover */}
                <div
                  className="absolute w-24 h-24 rounded-full opacity-0 blur-xl transition-all duration-300 ease-out group-hover:opacity-30 group-hover:scale-125"
                  style={{ backgroundColor: element.color }}
                ></div>
                
                {/* Image with right-side shadow + hover scale */}
                <Image
                  src={element.icon}
                  alt={element.name}
                  width={96}
                  height={96}
                  className="relative z-10 transition-all duration-300 ease-out group-hover:scale-110"
                  style={{
                    filter: "drop-shadow(8px 8px 12px rgba(0, 0, 0, 0.25))",
                  }}
                />
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
