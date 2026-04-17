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

type Banner = {
  _id: string;
  imageUrl: string;
  link: string;
  title: string;
  device?: 'both' | 'desktop' | 'mobile';
};

const defaultSlides = [
  { _id: 'default-1', imageUrl: "/images/SWAGO_Slide_1.jpg", link: "/products", title: "Swago Learning Smart Box", device: 'both' as const },
  { _id: 'default-2', imageUrl: "/images/SWAGO_Slide_2.jpg", link: "/products", title: "Swago Learning Smart Box", device: 'both' as const },
];

export default function HeroCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Handle Resize for filtering
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/banners");
      const data = await res.json();
      if (data.success && data.banners.length > 0) {
        setBanners(data.banners);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

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

  const allSlides = banners.length > 0 ? banners : defaultSlides;

  // Filter slides based on current device
  const slides = allSlides.filter(slide => {
    if (slide.device === 'both' || !slide.device) return true;
    if (isMobile) return slide.device === 'mobile';
    return slide.device === 'desktop';
  });

  // Re-initialize Embla when component is ready and slides change
  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [emblaApi, slides.length]);

  if (loading && banners.length === 0) {
    return (
      <div className="container mx-auto px-4 md:px-6 mt-4 md:mt-8">
        <div className="h-[250px] md:h-[400px] w-full bg-gray-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 mt-4 md:mt-8">
      <div className="relative group overflow-hidden rounded-2xl">

        {/* Main Viewport */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {slides.map((slide, index) => (
              <Link
                href={slide.link || "/products"}
                key={slide._id || index}
                className="flex-shrink-0 flex-grow-0 w-full min-w-0 h-[350px] md:h-[400px] relative block"
              >
                <Image
                  src={slide.imageUrl}
                  alt={slide.title || "Promotional banner"}
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
          className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/30 hover:bg-white/80 backdrop-blur-sm p-2 rounded-full text-black transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hidden md:block z-10"
          onClick={scrollPrev}
          aria-label="Previous slide"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>

        {/* --- RIGHT ARROW --- */}
        <button
          className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/30 hover:bg-white/80 backdrop-blur-sm p-2 rounded-full text-black transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hidden md:block z-10"
          onClick={scrollNext}
          aria-label="Next slide"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
        </button>

        {/* --- DOTS --- */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 shadow-sm ${index === selectedIndex
                ? "bg-[hsl(var(--swago-purple))] w-6"
                : "bg-purple-200 hover:bg-purple-400"
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}