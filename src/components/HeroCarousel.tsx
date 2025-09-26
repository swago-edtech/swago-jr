"use client";

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay'; // 1. Import the Autoplay plugin
import Link from 'next/link';

// Data for the carousel slides remains the same
const slides = [
  { title: "Play. Learn. Grow.", subtitle: "Kids using Swago kits to build creativity.", fromColor: "hsl(var(--swago-pink))", toColor: "hsl(var(--swago-purple))" },
  { title: "Gamify Your Journey", subtitle: "Earn badges and boost your Swago Score.", fromColor: "hsl(var(--swago-orange))", toColor: "hsl(var(--swago-pink))" },
  { title: "Colorful Elements", subtitle: "Build your Swago Core with fun elements.", fromColor: "hsl(var(--swago-purple))", toColor: "hsl(var(--swago-sky-blue))" },
];

export default function HeroCarousel() {
  // 2. Add the Autoplay plugin to the useEmblaCarousel hook
  // The slides will change every 4 seconds (4000ms)
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })]);

  return (
    <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
      <div className="flex">
        {slides.map((slide, index) => (
          <div 
            className="flex-shrink-0 flex-grow-0 w-full min-w-0 h-[400px] relative" 
            key={index}
            style={{
              backgroundImage: `linear-gradient(to bottom right, ${slide.fromColor}, ${slide.toColor})`
            }}
          >
            <div className="flex flex-col items-center justify-center h-full text-center text-white p-8">
              <h1 className="text-5xl font-black [text-shadow:_1px_1px_2px_rgb(0_0_0_/_20%)]">{slide.title}</h1>
              <p className="mt-2 text-lg opacity-90">{slide.subtitle}</p>
              <Link href="/products" className="mt-6 bg-white/20 text-white font-bold px-6 py-3 rounded-full hover:bg-white/30 transition">
                Explore Kits
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}