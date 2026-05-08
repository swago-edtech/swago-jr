"use client";

import Image from "next/image";

export default function MasterclassAbout({ sections }: { sections: any[] }) {
  if (!sections || sections.length === 0) return null;

  return (
    <section className="py-16 lg:py-24 bg-slate-50 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            What is this Masterclass for?
          </h2>
          <div className="w-20 h-1 bg-[hsl(var(--swago-purple))] mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((section, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group"
            >
              {section.image ? (
                <div className="w-16 h-16 relative mb-6 rounded-xl overflow-hidden bg-purple-50 flex items-center justify-center shrink-0">
                  <Image src={section.image} alt={section.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-purple-50 text-[hsl(var(--swago-purple))] flex items-center justify-center text-3xl font-bold mb-6 group-hover:scale-110 transition-transform">
                  {section.icon || (index + 1)}
                </div>
              )}
              
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {section.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {section.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
