"use client";

import { CheckCircle2, Star } from "lucide-react";

export default function MasterclassHero({ hero }: { hero: any }) {
  if (!hero || (!hero.headline && !hero.videoUrl)) return null;

  return (
    <section className="relative w-full bg-slate-50 pt-16 pb-12 overflow-hidden border-b border-gray-200">
      {/* Background styling */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-100/40 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center text-center">
        
        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight max-w-4xl mx-auto mb-6">
          {hero.headline}
        </h1>
        
        {/* Subheadline & Trust Badges */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-10">
          {hero.subheadline && (
            <p className="text-lg md:text-xl text-slate-700 font-medium">
              {hero.subheadline}
            </p>
          )}
          
          <div className="flex items-center gap-6 text-sm font-bold text-slate-800">
            {hero.stats?.map((stat: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>{stat.label} <span className="font-normal text-slate-500">{stat.subtext}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Video Player */}
        {hero.videoUrl && (
          <div className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 aspect-video relative z-20 mb-10 group">
            <iframe
              src={`https://www.youtube.com/embed/${hero.videoUrl}?rel=0&modestbranding=1`}
              title="Masterclass Video"
              className="w-full h-full absolute inset-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}

        {/* Call To Action */}
        <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
          <a href="#sessions" className="btn-shine w-full flex items-center justify-center bg-[hsl(var(--swago-purple))] text-white font-bold px-8 py-5 rounded-2xl text-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all hover:-translate-y-1">
            Enroll Now
          </a>
          {hero.guaranteeBadge && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              {hero.guaranteeBadge}
            </p>
          )}
        </div>

      </div>
    </section>
  );
}
