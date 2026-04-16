"use client";

import React from 'react';

interface CartProgressProps {
  total: number;
  shippingThreshold?: number;
  giftThreshold?: number;
}

export default function CartProgress({
  total,
  shippingThreshold = 500,
  giftThreshold = 1000
}: CartProgressProps) {
  const progressPercent = Math.min((total / giftThreshold) * 100, 100);

  return (
    <div className="bg-white rounded-[1.5rem] px-4 pt-3 pb-4 border border-slate-100 shadow-sm mb-4">
      {/* 🚀 Header Message */}
      <p className={`text-[11px] font-[1000] text-center mb-4 uppercase tracking-[0.15em] ${total >= shippingThreshold ? 'text-[#1EAA5F]' : 'text-[#61498C]'}`}>
        {total >= giftThreshold
          ? "🎉 All rewards added to your order!"
          : total >= shippingThreshold
            ? "🚚 Free Shipping unlocked!"
            : "Free Gift on Prepaid Orders"}
      </p>

      {/* 📊 Progress Bar Container */}
      <div className="relative px-4">
        {/* Track Container */}
        <div className="relative h-10 mb-2">
          {/* Background Rail */}
          <div className="absolute top-1/2 left-0 right-0 h-[4px] bg-slate-100 -translate-y-1/2 rounded-full" />

          {/* Active Progress Rail */}
          <div
            className="absolute top-1/2 left-0 h-[4px] bg-[#61498C] -translate-y-1/2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Start Point Dot */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-3 rounded-full bg-[#61498C] border-2 border-white shadow-sm z-10" />

          {/* 🚚 Milestone 1: Free Shipping (₹500) */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
            style={{ left: `${(shippingThreshold / giftThreshold) * 100}%` }}
          >
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border-[3px] border-white shadow-xl transition-all duration-500 scale-100 ${total >= shippingThreshold ? 'bg-[#61498C] text-white' : 'bg-slate-50 text-slate-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.127V11.25M7.5 7.5h7.875c.621 0 1.125.504 1.125 1.125v17.25m-17.25-4.5V3.375C3.375 2.754 3.879 2.25 4.5 2.25H9.75" />
              </svg>
            </div>
            <div className="absolute top-11 left-1/2 -translate-x-1/2 text-center whitespace-nowrap pt-1">
              <p className={`text-[9px] font-black leading-none ${total >= shippingThreshold ? 'text-slate-800' : 'text-slate-400'}`}>₹{shippingThreshold}</p>
              <p className={`text-[7px] font-bold uppercase tracking-tight mt-0.5 ${total >= shippingThreshold ? 'text-slate-500' : 'text-slate-400'}`}>Free Shipping</p>
            </div>
          </div>

          {/* 🎁 Milestone 2: Free Gift (₹1000) */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 z-20">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border-[3px] border-white shadow-xl transition-all duration-500 scale-100 ${total >= giftThreshold ? 'bg-[#61498C] text-white' : 'bg-slate-50 text-slate-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h17.25" />
              </svg>
            </div>
            <div className="absolute top-11 right-0 text-right whitespace-nowrap pt-1">
              <p className={`text-[9px] font-black leading-none ${total >= giftThreshold ? 'text-slate-800' : 'text-slate-400'}`}>₹{giftThreshold}</p>
              <p className={`text-[7px] font-bold uppercase tracking-tight mt-0.5 ${total >= giftThreshold ? 'text-slate-500' : 'text-slate-400'}`}>+ Free Gift</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🏷️ Banner Message */}
      <div className="mt-12 text-center px-2">
        {total >= giftThreshold ? (
          <div className="bg-emerald-50 text-[#1E8B4F] py-2 px-4 rounded-xl border border-emerald-100 flex items-center justify-center gap-2 group cursor-pointer hover:bg-emerald-100 transition-colors">
            <span className="text-xl group-hover:scale-110 transition-transform">🎉</span>
            <p className="text-[10px] font-black uppercase tracking-[0.1em] mt-0.5">Surprise Toy Added to Cart!</p>
          </div>
        ) : (
          <div className="bg-slate-50 py-2.5 px-5 rounded-[1rem] border border-slate-100 inline-block shadow-inner">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
              Add <span className="text-[#61498C] font-black text-xs mx-0.5 tabular-nums">₹{(giftThreshold - total).toFixed(0)}</span> more for <span className="text-slate-900 font-black">FREE Toy! 🎁</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
