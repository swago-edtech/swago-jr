"use client";

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import Image from 'next/image';

const slideImages = [
  "/images/SWAGO_Slide_1.jpg",
  "/images/SWAGO_Slide_2.jpg",
];

export default function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative group overflow-hidden rounded-2xl">
      
      {/* Main Viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slideImages.map((imageSrc, index) => (
            <Link 
              href="/products" 
              key={imageSrc}
              className="flex-shrink-0 flex-grow-0 w-full min-w-0 h-[250px] md:h-[400px] relative block"
            >
              <Image
                src={imageSrc}
                alt="Promotional banner for Swago learning kits"
                fill
                className="object-cover"
                priority={index === 0}
              />
            </Link>
          ))}
        </div>
      </div>

      {/* --- LEFT ARROW --- */}
      <button
        className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/30 hover:bg-white/80 backdrop-blur-sm p-2 rounded-full text-black transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        onClick={scrollPrev}
        aria-label="Previous slide"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      {/* --- RIGHT ARROW --- */}
      <button
        className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/30 hover:bg-white/80 backdrop-blur-sm p-2 rounded-full text-black transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        onClick={scrollNext}
        aria-label="Next slide"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>

      {/* --- DOTS (UPDATED PURPLE) --- */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slideImages.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            // UPDATED CLASSNAMES BELOW
            className={`w-3 h-3 rounded-full transition-all duration-300 shadow-sm ${
              index === selectedIndex 
                ? "bg-[hsl(var(--swago-purple))] w-6"           // Active: Deep Purple + Wide
                : "bg-purple-200 hover:bg-purple-400" // Inactive: Light Purple
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

    </div>
  );
}