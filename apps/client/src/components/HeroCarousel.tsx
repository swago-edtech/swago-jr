"use client";

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import Image from 'next/image';

// The slide data now only contains two image paths.
const slideImages = [
  "/images/SWAGO_Slide_1.jpg",
  "/images/SWAGO_Slide_2.jpg",
];

export default function HeroCarousel() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })]);

  return (
    <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
      <div className="flex">
        {slideImages.map((imageSrc, index) => (
          <Link 
            href="/products" 
            key={imageSrc}
            className="flex-shrink-0 flex-grow-0 w-full min-w-0 h-[250px] md:h-[400px] relative block"
            aria-label="View all products"
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
  );
}