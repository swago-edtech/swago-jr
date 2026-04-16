"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import CountdownTimer from "@/components/lottery/CountdownTimer";

// --- Mock Data / Components ---

const SURPRISE_GIFTS = [
  { icon: "🎁", title: "Mystery Blind Bags", desc: "Collect rare toys and cards" },
  { icon: "💰", title: "Swago Money", desc: "Up to 100 Swago Dollars" },
  { icon: "🎟️", title: "VIP Tickets", desc: "Exclusive access to new launches" }
];

const TICKET_TYPES = [
  { id: 'SSR', label: '💎 Diamond Ticket', product: 'Seek Rush' },
  { id: 'SDC', label: '🏆 Golden Ticket', product: 'Scarf Dumb Charades' }
];

interface KidProfile {
  _id: string;
  name: string;
  age: number;
}

export default function LotteryClient() {
  const [step, setStep] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [selectedKid, setSelectedKid] = useState('');
  const [kidProfiles, setKidProfiles] = useState<KidProfile[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [ticketCode, setTicketCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetchKidProfiles();
    fetchWinners();
  }, []);

  const fetchKidProfiles = async () => {
    try {
      const res = await fetch('/api/kid-profiles');
      const data = await res.json();
      if (res.ok && data.profiles) {
        setKidProfiles(data.profiles);
        if (data.profiles.length === 1) setSelectedKid(data.profiles[0]._id);
      }
    } catch (err) { console.error(err); }
  };

  const fetchWinners = async () => {
    try {
      const res = await fetch('/api/lottery/winners');
      const data = await res.json();
      if (res.ok && data.winners) setWinners(data.winners);
    } catch (err) { console.error(err); }
  };

  const handleNext = () => {
    setError(null);
    if (step === 0) setStep(1);
    else if (step === 1 && selectedTicket && selectedKid) setStep(2);
  };

  const handleCodeChange = (index: number, value: string) => {
    const val = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length <= 1) {
      const newCodes = [...ticketCode];
      newCodes[index] = val;
      setTicketCode(newCodes);
      if (val && index < 5) inputRefs.current[index + 1]?.focus();
    }
  };

  const claimTicket = async () => {
    setLoading(true);
    setError(null);
    const fullCode = `SWAGO-${selectedTicket}-${ticketCode.join('')}`;
    try {
      const res = await fetch('/api/lottery/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode, kidProfileId: selectedKid }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep(3);
      } else {
        setError(data.error || 'Invalid ticket code');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 overflow-x-hidden">

      {/* 1. Hero / Title Section */}
      <section className="pt-6 md:pt-16 pb-10 px-6 text-center max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-6xl font-black tracking-tighter mb-4"
        >
          Welcome to Swago Lucky Ticket. 🎟
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-slate-500 font-medium mb-8"
        >
          Claim your ticket and stand a chance to win surprise gifts
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 md:gap-3 bg-emerald-50 border border-emerald-100 px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl shadow-sm"
        >
          <span className="text-lg md:text-xl">🎁</span>
          <p className="text-[10px] md:text-sm font-black text-emerald-700 uppercase tracking-widest">
            Winners announced every Friday at 7 PM
          </p>
        </motion.div>
      </section>

      {/* 2. Timer Section */}
      <section className="px-6 mb-16 max-w-2xl mx-auto">
        <div className="text-center mb-4">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Timer running</p>
        </div>
        <CountdownTimer />
      </section>

      {/* 3. Main Interactive Area */}
      <section className="px-6 mb-8 md:mb-12 max-w-xl mx-auto relative">
        <AnimatePresence mode="wait">
          {step < 3 ? (
            <motion.div
              key="claim-module"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-6"
            >
              {/* Step Boxes that appear on top */}
              {step >= 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-slate-50 border-2 border-slate-100 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 shadow-inner"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Ticket</label>
                      <select
                        value={selectedTicket}
                        onChange={(e) => setSelectedTicket(e.target.value)}
                        className="w-full h-10 md:h-12 px-3 md:px-4 rounded-lg md:rounded-xl bg-white border-2 border-slate-100 font-bold text-xs md:text-sm outline-none focus:border-[hsl(var(--swago-purple))] transition-all appearance-none"
                      >
                        <option value="" disabled>Choose Ticket...</option>
                        {TICKET_TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Kid Profile</label>
                      <select
                        value={selectedKid}
                        onChange={(e) => setSelectedKid(e.target.value)}
                        className="w-full h-10 md:h-12 px-3 md:px-4 rounded-lg md:rounded-xl bg-white border-2 border-slate-100 font-bold text-xs md:text-sm outline-none focus:border-[hsl(var(--swago-purple))] transition-all appearance-none"
                      >
                        <option value="" disabled>Choose Kid...</option>
                        {kidProfiles.map(kp => (
                          <option key={kp._id} value={kp._id}>{kp.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-white border-2 border-[hsl(var(--swago-purple))]/20 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 shadow-xl"
                >
                  <label className="block text-xs font-black text-[hsl(var(--swago-purple))] uppercase tracking-[0.2em] mb-6 text-center">Enter your ticket code</label>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] font-black text-rose-500 bg-rose-50 p-2 rounded-lg text-center mb-4 uppercase tracking-widest"
                    >
                      ⚠️ {error}
                    </motion.p>
                  )}

                  <div className="flex justify-center gap-2">
                    {ticketCode.map((c, i) => (
                      <input
                        key={i}
                        ref={el => { inputRefs.current[i] = el; }}
                        value={c}
                        onChange={(e) => handleCodeChange(i, e.target.value)}
                        className="w-9 h-12 md:w-16 md:h-20 text-center text-xl md:text-3xl font-black bg-slate-50 border-2 border-slate-200 rounded-lg md:rounded-xl focus:border-[hsl(var(--swago-purple))] focus:bg-white transition-all outline-none"
                        maxLength={1}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Action Button that changes text */}
              <button
                onClick={step === 2 ? claimTicket : handleNext}
                disabled={loading || (step === 1 && (!selectedTicket || !selectedKid)) || (step === 2 && ticketCode.some(c => !c))}
                className="w-full btn-shine bg-[hsl(var(--swago-purple))] text-white font-black py-4 md:py-5 rounded-2xl md:rounded-[1.5rem] text-sm md:text-lg uppercase tracking-[0.2em] shadow-xl shadow-purple-100 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
              >
                {loading ? "Claiming..." : step === 0 ? "Claim your ticket" : step === 1 ? "Enter your code" : "Claim"}
              </button>
            </motion.div>
          ) : (
            <SuccessMessage onReset={() => setStep(0)} />
          )}
        </AnimatePresence>
      </section>

      {/* 4. Gifts Section */}
      <section className="bg-slate-50 py-8 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-5xl font-black tracking-tight mb-4">What you can get as surprise gifts</h2>
            <p className="text-slate-500 font-medium text-sm md:text-base">Every week, new exciting rewards are added to the pool!</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SURPRISE_GIFTS.map((gift, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2rem] border border-slate-100 shadow-sm"
              >
                <div className="text-4xl mb-6">{gift.icon}</div>
                <h3 className="text-xl font-black mb-2">{gift.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{gift.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Past Winners Section */}
      <section className="py-8 md:py-24 px-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">Past Winners</h2>
          <div className="h-px flex-1 bg-slate-100 mx-8 hidden md:block"></div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest hidden md:block">Our Hall of Fame</span>
        </div>

        <div className="space-y-4">
          {winners.length === 0 ? (
            <div className="py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 text-center">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Winners announced this Friday!</p>
            </div>
          ) : winners.map((winner, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between p-4 md:p-6 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-black text-[hsl(var(--swago-purple))] group-hover:bg-[hsl(var(--swago-purple))] group-hover:text-white transition-colors">
                  {winner.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-lg leading-none mb-1">{winner.name}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">#{winner.ticketCode?.slice(-4)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-emerald-600 mb-0.5">{winner.prize}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">WINNER</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
}



function SuccessMessage({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border-2 border-emerald-100 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 text-center shadow-2xl shadow-emerald-100 relative overflow-hidden"
    >
      {/* Decorative Confetti */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, opacity: 0 }}
          animate={{
            y: [0, -100, 0],
            x: [0, (i % 2 === 0 ? 50 : -50), 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0.5]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
          className="absolute text-xl pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
        >
          {['✨', '⭐', '🎉', '🎊'][i % 4]}
        </motion.div>
      ))}

      <div className="relative z-10">
        <div className="text-6xl mb-6 animate-bounce">✨🎉</div>
        <h2 className="text-3xl font-black mb-4 tracking-tight">Claimed!</h2>
        <p className="text-slate-500 font-medium leading-relaxed mb-8">
          Your ticket entry is done; come back on Friday at 7 pm to see who won the surprise gift.
        </p>
        <button
          onClick={onReset}
          className="text-xs font-black text-[hsl(var(--swago-purple))] uppercase tracking-widest hover:underline"
        >
          Enter another ticket
        </button>
      </div>
    </motion.div>
  );
}
