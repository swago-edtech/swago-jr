"use client";

import Image from "next/image";
import { Gift } from "lucide-react";

export default function MasterclassBonuses({ bonuses }: { bonuses: any[] }) {
  if (!bonuses || bonuses.length === 0) return null;

  return (
    <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 font-bold px-4 py-2 rounded-full mb-6 border border-yellow-500/30">
            <Gift className="w-5 h-5" />
            <span>Special Offer</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Unlock bonuses worth{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
              Thousands
            </span>
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Enroll today and get instant access to these exclusive resources designed to accelerate your growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {bonuses.map((bonus: any, idx: number) => (
            <div key={idx} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden hover:border-yellow-500/50 transition-colors group">
              {bonus.image && (
                <div className="relative h-48 w-full overflow-hidden bg-slate-700">
                  <Image src={bonus.image} alt={bonus.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="p-6">
                <div className="text-yellow-400 font-black text-xl mb-2">{bonus.value}</div>
                <h3 className="text-xl font-bold mb-3">{bonus.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {bonus.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <a href="#sessions" className="btn-shine inline-flex items-center justify-center bg-yellow-500 text-slate-900 font-black px-10 py-5 rounded-2xl text-xl hover:shadow-2xl hover:shadow-yellow-500/30 transition-all hover:-translate-y-1">
            Claim Bonuses Now
          </a>
        </div>
      </div>
    </section>
  );
}
