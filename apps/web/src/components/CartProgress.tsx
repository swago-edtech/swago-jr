"use client";

import React, { useState, useEffect, useMemo } from 'react';

interface BonusItem {
  threshold: number;
  label: string;
  slug: string;
  rewardType?: string;
}

interface CartProgressProps {
  total: number;
  promotionData?: any;
}

export default function CartProgress({
  total,
  promotionData: promotion
}: CartProgressProps) {  const shippingThreshold = promotion?.shippingThreshold || 1450;
  
  // Sort bonus items by threshold to ensure correct progress display
  const bonusItems = useMemo(() => {
    if (!promotion?.bonusItems) return [];
    return [...promotion.bonusItems]
      .filter((b: any) => b.threshold !== 1499) // Remove 1499 to avoid overlap with 1450
      .sort((a: any, b: any) => a.threshold - b.threshold);
  }, [promotion]);

  // Use the highest bonus threshold as the progress bar's max
  const maxThreshold = useMemo(() => {
    if (bonusItems.length === 0) return 1000;
    return bonusItems[bonusItems.length - 1].threshold;
  }, [bonusItems]);

  const progressPercent = Math.min((total / maxThreshold) * 100, 100);

  // Find the next upcoming reward
  const nextReward = useMemo(() => {
    if (total < shippingThreshold) return { type: 'shipping', value: shippingThreshold };
    const nextBonus = bonusItems.find((b: any) => total < b.threshold);
    if (nextBonus) return { type: 'gift', value: nextBonus.threshold, label: nextBonus.label, rewardType: nextBonus.rewardType || 'gift' };
    return null;
  }, [total, shippingThreshold, bonusItems]);

  if (!promotion) return null;
  if (promotion.isActive === false) return null;

  return (
    <div className="bg-white rounded-[1.5rem] px-4 pt-3 pb-4 border border-slate-100 shadow-sm mb-4">
      {/* 🚀 Header Message */}
      <p className={`text-[11px] font-[1000] text-center mb-4 uppercase tracking-[0.15em] ${total >= shippingThreshold ? 'text-[#8a59ed]' : 'text-slate-600'}`}>
        {total >= maxThreshold
          ? "🎉 All rewards unlocked!"
          : total >= shippingThreshold
            ? "🚚 Free COD Shipping unlocked!"
            : "Free Shipping on Online Orders"}
      </p>

      {/* 📊 Progress Bar Container */}
      <div className="relative px-4">
        <div className="relative h-10 mb-2">
          {/* Background Rail */}
          <div className="absolute top-1/2 left-0 right-0 h-[4px] bg-slate-100 -translate-y-1/2 rounded-full" />

          {/* Active Progress Rail */}
          <div
            className="absolute top-1/2 left-0 h-[4px] bg-[#8a59ed] -translate-y-1/2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Start Point Dot */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-3 rounded-full bg-[#8a59ed] border-2 border-white shadow-sm z-10" />

          {/* 🚚 Milestone 1: Free Shipping */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
            style={{ left: `${(shippingThreshold / maxThreshold) * 100}%` }}
          >
            <div className={`w-8 h-8 rounded-2xl flex items-center justify-center border-[3px] border-white shadow-xl transition-all duration-500 ${total >= shippingThreshold ? 'bg-[#8a59ed] text-white' : 'bg-slate-50 text-slate-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.127V11.25M7.5 7.5h7.875c.621 0 1.125.504 1.125 1.125v1.5m-1.5 1.5H8.25m8.25 0V7.5" />
              </svg>
            </div>
            <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
              <p className={`text-[8px] font-black leading-none ${total >= shippingThreshold ? 'text-slate-800' : 'text-slate-400'}`}>₹{shippingThreshold}</p>
            </div>
          </div>

          {/* 🎁 Dynamic Gift Milestones */}
          {bonusItems.map((item: any, idx: number) => {
            const isLast = idx === bonusItems.length - 1;
            const leftPos = (item.threshold / maxThreshold) * 100;
            const isUnlocked = total >= item.threshold;

            return (
              <div
                key={item.slug}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                style={{ left: `${leftPos}%` }}
              >
                <div className={`w-8 h-8 rounded-2xl flex items-center justify-center border-[3px] border-white shadow-xl transition-all duration-500 ${isUnlocked ? 'bg-[#8a59ed] text-white' : 'bg-slate-50 text-slate-300'}`}>
                  {item.rewardType === 'coupon' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h17.25" />
                    </svg>
                  )}
                </div>
                <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                  <p className={`text-[8px] font-black leading-none ${isUnlocked ? 'text-slate-800' : 'text-slate-400'}`}>₹{item.threshold}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🏷️ Dynamic Banner Message */}
      <div className="mt-10 text-center px-2">
        {nextReward ? (
          <div className="bg-slate-50 py-2.5 px-5 rounded-[1rem] border border-slate-100 inline-block shadow-inner">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
              Add <span className="text-[#8a59ed] font-black text-xs mx-0.5 tabular-nums">₹{(nextReward.value - total).toFixed(0)}</span> more for <span className="text-slate-900 font-black">{nextReward.type === 'shipping' ? 'FREE COD Shipping' : nextReward.rewardType === 'coupon' ? `Unlock ${nextReward.label}` : `FREE ${nextReward.label}`}! {nextReward.type === 'shipping' ? '🚚' : nextReward.rewardType === 'coupon' ? '🎟️' : '🎁'}</span>
            </p>
          </div>
        ) : (
          <div className="bg-emerald-50 text-[#1E8B4F] py-2 px-4 rounded-xl border border-emerald-100 flex items-center justify-center gap-2 group transition-colors">
            <span className="text-xl group-hover:scale-110 transition-transform">🎉</span>
            <p className="text-[10px] font-black uppercase tracking-[0.1em] mt-0.5">All possible rewards unlocked!</p>
          </div>
        )}
      </div>
    </div>
  );
}
