"use client";

import Image from "next/image";
import { CheckCheck } from "lucide-react";

export default function MasterclassTestimonials({ testimonials }: { testimonials: any[] }) {
  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="py-24 bg-[#efe7de] relative overflow-hidden">
      {/* Subtle WhatsApp-style pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`,
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 max-w-3xl mx-auto leading-tight">
            Thousands of students have already transformed their lives.
          </h2>
          <div className="flex items-center justify-center gap-2 text-[hsl(var(--swago-purple))] font-bold">
            <span className="w-12 h-1 bg-current rounded-full"></span>
            <span>Real Results</span>
            <span className="w-12 h-1 bg-current rounded-full"></span>
          </div>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {testimonials.map((t, index) => {
            const isGreen = index % 2 === 0;
            return (
              <div 
                key={index} 
                className={`relative flex flex-col max-w-[90%] sm:max-w-none mx-auto break-inside-avoid group`}
              >
                {/* Chat Bubble Container */}
                <div 
                  className={`relative p-4 rounded-2xl shadow-md transition-all duration-300 group-hover:shadow-lg ${
                    isGreen 
                      ? "bg-[#dcf8c6] ml-auto rounded-tr-none" 
                      : "bg-white mr-auto rounded-tl-none"
                  }`}
                >
                  {/* Bubble Tail */}
                  <div 
                    className={`absolute top-0 w-4 h-4 ${
                      isGreen 
                        ? "-right-2 bg-[#dcf8c6] clip-tail-right" 
                        : "-left-2 bg-white clip-tail-left"
                    }`}
                  />

                  {/* Header / Name */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden relative border border-slate-100 shrink-0">
                      {t.image ? (
                        <Image src={t.image} alt={t.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 leading-none">
                        {t.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {t.role || "Verified Parent"}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-slate-800 text-sm leading-relaxed mb-1 pr-6">
                    "{t.content || t.message}"
                  </div>

                  {/* Footer / Status */}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[9px] text-slate-400 font-medium uppercase">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .clip-tail-right {
          clip-path: polygon(0 0, 0% 100%, 100% 0);
        }
        .clip-tail-left {
          clip-path: polygon(100% 0, 100% 100%, 0 0);
        }
      `}</style>
    </section>
  );
}
