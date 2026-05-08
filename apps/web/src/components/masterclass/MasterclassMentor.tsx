"use client";

import Image from "next/image";

export default function MasterclassMentor({ mentor }: { mentor: any }) {
  if (!mentor || (!mentor.name && !mentor.bio)) return null;

  return (
    <section className="py-20 bg-slate-50 border-y border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            Meet Your Mentor
          </h2>
          <div className="w-24 h-1.5 bg-[hsl(var(--swago-purple))] mx-auto rounded-full"></div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row">
          
          <div className="md:w-2/5 relative bg-slate-100 min-h-[300px] md:min-h-[400px]">
            {mentor.image ? (
              <Image src={mentor.image} alt={mentor.name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300">No Image</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="text-2xl font-black">{mentor.name}</h3>
              <p className="font-medium text-white/80">{mentor.title}</p>
            </div>
          </div>

          <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
            <div className="prose prose-slate prose-lg mb-8">
              {mentor.bio?.split('\n').map((paragraph: string, idx: number) => (
                <p key={idx} className="text-slate-600 leading-relaxed mb-4">{paragraph}</p>
              ))}
            </div>

            {mentor.stats && mentor.stats.length > 0 && (
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                {mentor.stats.map((stat: any, idx: number) => (
                  <div key={idx}>
                    <div className="text-3xl font-black text-[hsl(var(--swago-purple))] mb-1">{stat.count}</div>
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.platform}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
