"use client";

import SessionCard from "./SessionCard";
import { useCurrency } from "@/hooks/useCurrency";

interface SessionGalleryProps {
  sessions: any[];
  onBookSession?: (session: any, currency: string) => void;
}

export default function SessionGallery({ sessions, onBookSession }: SessionGalleryProps) {
  const { currency } = useCurrency();

  if (!sessions || sessions.length === 0) return null;

  return (
    <section id="sessions" className="py-16 lg:py-24 bg-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 max-w-2xl mx-auto md:max-w-none text-center md:text-left gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
              Available Sessions
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              Choose the perfect masterclass session for your child's age group.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sessions.map((session, index) => (
            <SessionCard 
              key={index} 
              session={session} 
              currency={currency}
              onBook={onBookSession ? () => onBookSession(session, currency) : undefined} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}
