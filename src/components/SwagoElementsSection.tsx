"use client";

import Link from "next/link";

const elements = [
  { letter: "S", name: "Smart Tech", color: "text-[hsl(var(--swago-pink))]" },
  { letter: "W", name: "Willpower", color: "text-[hsl(var(--swago-teal))]" },
  { letter: "A", name: "Ambition", color: "text-[hsl(var(--swago-purple))]" },
  { letter: "G", name: "Growth", color: "text-[hsl(var(--swago-orange))]" },
  { letter: "O", name: "Optimization", color: "text-[hsl(var(--swago-sky-blue))]" },
];

export default function SwagoElementsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Updated: Grid is now 1 column on mobile, 5 on medium screens and up */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-center">
          {elements.map((element) => (
            <Link 
              key={element.letter} 
              href={`/products?elements=${element.letter}`} 
              className="group flex flex-col items-center"
            >
              <div className={`text-6xl md:text-8xl font-black ${element.color}`}>
                {element.letter}
              </div>
              <div className="mt-2 text-xl md:text-2xl font-bold text-slate-800 relative">
                {element.name}
                <span 
                  aria-hidden="true"
                  className="absolute top-full left-0 w-full mt-1 bg-clip-text text-transparent bg-gradient-to-b from-slate-400 to-transparent opacity-50 transform group-hover:from-slate-500 transition"
                >
                  {element.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}