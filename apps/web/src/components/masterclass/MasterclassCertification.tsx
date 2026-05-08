"use client";

import Image from "next/image";
import { Award, CheckCircle } from "lucide-react";

export default function MasterclassCertification({ certification }: { certification: any }) {
  if (!certification || (!certification.title && !certification.image)) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-[hsl(var(--swago-purple))]/5 rounded-3xl p-8 md:p-12 lg:p-16 border border-[hsl(var(--swago-purple))]/10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-[hsl(var(--swago-purple))]/10 text-[hsl(var(--swago-purple))] font-bold px-4 py-2 rounded-full">
                <Award className="w-5 h-5" />
                <span>Official Certification</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                {certification.title || "Get Certified"}
              </h2>
              
              {certification.description && (
                <p className="text-lg text-slate-600 leading-relaxed">
                  {certification.description}
                </p>
              )}

              {certification.points && certification.points.length > 0 && (
                <ul className="space-y-4 pt-4 border-t border-slate-200">
                  {certification.points.map((point: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-[hsl(var(--swago-purple))] shrink-0 mt-0.5" />
                      <span className="text-slate-800 font-medium text-lg">{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="relative">
              {certification.image ? (
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-2xl border-8 border-white bg-slate-100 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                  <Image src={certification.image} alt="Certificate" fill className="object-cover" />
                </div>
              ) : (
                <div className="aspect-[4/3] w-full rounded-2xl border-4 border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-white">
                  Certificate Image Placeholder
                </div>
              )}
              
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[hsl(var(--swago-purple))]/10 rounded-full blur-2xl z-0" />
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl z-0" />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
