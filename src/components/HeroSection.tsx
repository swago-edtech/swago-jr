"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    // Main container now uses a CSS gradient background
    <div className="relative w-full rounded-2xl overflow-hidden p-16 bg-gradient-to-br from-[hsl(var(--swago-teal))] to-[hsl(var(--swago-purple))]">
      
      {/* Content is centered both horizontally and vertically */}
      <div className="flex flex-col items-center justify-center h-full text-center text-white">
        
        <h1 className="text-6xl font-black leading-tight max-w-2xl [text-shadow:_2px_2px_4px_rgb(0_0_0_/_20%)]">
          Where Your Kid Becomes an Alpha Leader!
        </h1>

        <p className="mt-4 text-xl max-w-xl opacity-90">
          Fun learning, smart skills, and big adventures—all in one place!
        </p>

        <Link 
          href="/products" 
          className="mt-8 bg-[hsl(var(--swago-orange))] text-white font-bold px-8 py-4 rounded-full shadow-lg hover:opacity-90 transition-opacity"
        >
          Join the Adventure
        </Link>
        
      </div>
    </div>
  );
}