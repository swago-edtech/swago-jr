"use client";

import { CheckCircle2 } from "lucide-react";

export default function MasterclassAudience({ audience }: { audience: any[] }) {
  if (!audience || audience.length === 0) return null;

  return (
    <section className="py-16 lg:py-24 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              Who is this Masterclass for?
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              Designed specifically for children who want to excel and parents who want to see them thrive.
            </p>
          </div>

          <div className="space-y-6">
            {audience.map((item, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[hsl(var(--swago-purple))] hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
              >
                <div className="shrink-0 mt-1">
                  <CheckCircle2 className="w-8 h-8 text-[hsl(var(--swago-purple))]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
