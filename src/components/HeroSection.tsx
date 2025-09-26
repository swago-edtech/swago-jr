"use client";

import Link from "next/link";

// A small component for the floating decorative shapes
const FloatingIcon = ({ className, delay }: { className: string; delay?: string }) => (
  <div 
    className={`absolute rounded-full bg-white/10 animate-float ${className}`}
    style={{ animationDelay: delay }}
  />
);

export default function HeroSection() {
  const swagoLetters = ['S', 'W', 'A', 'G', 'O'];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden p-8 md:p-16 bg-gradient-to-br from-[hsl(var(--swago-teal))] to-[hsl(var(--swago-purple))]">
      
      <FloatingIcon className="w-8 h-8 top-[10%] left-[5%]" />
      <FloatingIcon className="w-4 h-4 top-[20%] left-[50%]" delay="1s" />
      <FloatingIcon className="w-12 h-12 top-[15%] right-[10%]" delay="2s" />
      <FloatingIcon className="w-6 h-6 bottom-[10%] left-[15%]" delay="3s" />
      <FloatingIcon className="w-10 h-10 bottom-[15%] right-[20%]" delay="0.5s" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white max-w-6xl mx-auto">
        
        {/* Main Headline - Stays on top */}
        <h1 className="text-5xl md:text-6xl font-black [text-shadow:_2px_2px_4px_rgb(0_0_0_/_20%)] mb-12">
          Welcome to Swago Jr.
        </h1>

        {/* 1. New Two-Column Grid for the main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          
          {/* Left Column: The Mission Statement Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg text-left">
            <div className="space-y-4 text-lg leading-relaxed opacity-95">
              <p>
                Childhood is the most powerful time to shape a life. Today, kids are addicted to screens, and school curriculums often fail to teach real-life skills like confidence, leadership, problem-solving, and creativity. Playtime feels ordinary, learning feels boring, and parents are left worrying about their child’s future.
              </p>
              <p>
                At Swago Jr, we change all of that. We make learning joyful, playful, and meaningful — a place where every challenge feels like a party, not a chore, and every activity builds the Alpha Leader inside your child.
              </p>
              <p>
                Through our 5 Core Elements, children don’t just learn — they grow into confident, capable, and unstoppable leaders.
              </p>
            </div>
          </div>

          {/* Right Column: SWAGO Letters, Tagline, and Button */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex justify-center items-center gap-3 md:gap-4">
              {swagoLetters.map(letter => (
                <div key={letter} className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-2xl font-black shadow-md">
                  {letter}
                </div>
              ))}
            </div>

            <h2 className="mt-8 text-3xl font-bold leading-tight [text-shadow:_1px_1px_2px_rgb(0_0_0_/_20%)]">
              Where Your Kid Becomes an Alpha Leader!
            </h2>
            
            <Link 
              href="/products" 
              className="btn-shine mt-8 bg-[hsl(var(--swago-orange))] text-white font-bold px-8 py-4 rounded-full shadow-lg"
            >
              Join the Adventure
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}