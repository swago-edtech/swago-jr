// apps/web/src/components/lottery/SelectionPhase.tsx

"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface KidProfile {
  _id: string;
  name: string;
  age: number;
  avatarColor?: string;
}

interface SelectionPhaseProps {
  onNext: (ticketType: 'SSR' | 'SDC', kidProfileId: string) => void;
}

export default function SelectionPhase({ onNext }: SelectionPhaseProps) {
  const [selectedTicket, setSelectedTicket] = useState<'SSR' | 'SDC' | null>(null);
  const [selectedKid, setSelectedKid] = useState<string | null>(null);
  const [kidProfiles, setKidProfiles] = useState<KidProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKidProfiles();
  }, []);

  const fetchKidProfiles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/kid-profiles');
      const data = await res.json();

      if (res.ok && data.profiles) {
        setKidProfiles(data.profiles);

        if (data.profiles.length === 1) {
          setSelectedKid(data.profiles[0]._id);
        }
      } else {
        setError(data.error || 'Failed to load kid profiles');
      }
    } catch (err) {
      console.error('Error fetching kid profiles:', err);
      setError('Failed to load kid profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (selectedTicket && selectedKid) {
      onNext(selectedTicket, selectedKid);
    }
  };

  const canProceed = selectedTicket && selectedKid;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6"
    >
      {/* Ticket Type Dropdown */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          1. Select Ticket Type
        </label>
        <select
          value={selectedTicket || ''}
          onChange={(e) => setSelectedTicket(e.target.value as 'SSR' | 'SDC')}
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 bg-white font-medium text-black focus:border-[hsl(var(--swago-purple))] focus:ring-2 focus:ring-[hsl(var(--swago-purple))]/20 outline-none transition-all"
        >
          <option value="">Choose your ticket type...</option>
          <option value="SSR">💎 Diamond Ticket </option>
          <option value="SDC">🏆 Golden Ticket </option>
        </select>
      </div>

      {/* Kid Profile Dropdown */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          2. Select Kid Profile
        </label>

        {loading ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
            <div className="animate-spin w-5 h-5 border-3 border-[hsl(var(--swago-purple))] border-t-transparent rounded-full"></div>
            <span className="text-slate-600">Loading profiles...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-red-600 text-sm font-medium">{error}</p>
            <button
              onClick={fetchKidProfiles}
              className="mt-2 text-sm text-red-700 underline hover:no-underline"
            >
              Try Again
            </button>
          </div>
        ) : kidProfiles.length === 0 ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-800 text-sm font-medium mb-2">
              No kid profiles found
            </p>
            <a
              href="/kids/profiles"
              className="inline-block bg-[hsl(var(--swago-purple))] text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Create Kid Profile
            </a>
          </div>
        ) : (
          <select
            value={selectedKid || ''}
            onChange={(e) => setSelectedKid(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 bg-white font-medium text-black focus:border-[hsl(var(--swago-purple))] focus:ring-2 focus:ring-[hsl(var(--swago-purple))]/20 outline-none transition-all"
          >
            <option value="">Choose a kid profile...</option>
            {kidProfiles.map((kid) => (
              <option key={kid._id} value={kid._id}>
                {kid.name} ({kid.age} years old)
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Next Button */}
      <motion.button
        whileHover={canProceed ? { scale: 1.02 } : {}}
        whileTap={canProceed ? { scale: 0.98 } : {}}
        onClick={handleNext}
        disabled={!canProceed}
        className={`
          w-full py-4 rounded-xl font-black text-lg shadow-lg transition-all
          ${canProceed
            ? 'bg-[hsl(var(--swago-orange))] text-white hover:shadow-xl cursor-pointer'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }
        `}
      >
        {!selectedTicket
          ? 'Select A Ticket Type'
          : !selectedKid
            ? 'Select A Kid Profile'
            : 'Next: Enter Code →'
        }
      </motion.button>
    </motion.div>
  );
}
