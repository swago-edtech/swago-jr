"use client";

import { CheckCircle } from "lucide-react";

export default function MasterclassModules({ modules }: { modules: any[] }) {
  if (!modules || modules.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            What will you learn?
          </h2>
          <div className="w-24 h-1.5 bg-[hsl(var(--swago-purple))] mx-auto rounded-full"></div>
        </div>

        <div className="space-y-6">
          {modules.map((mod: any, idx: number) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 pb-6 border-b border-slate-200">
                <div className="bg-[hsl(var(--swago-purple))]/10 text-[hsl(var(--swago-purple))] font-bold px-4 py-2 rounded-xl text-sm w-max">
                  {mod.duration || `Module ${idx + 1}`}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900">
                  {mod.title}
                </h3>
              </div>
              
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mod.points?.map((point: string, pIdx: number) => (
                  <li key={pIdx} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-[hsl(var(--swago-purple))] shrink-0 mt-0.5" />
                    <span className="text-slate-700 font-medium">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
