"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useCountry } from "@/context/CountryContext";

interface Coupon {
  code: string;
  label: string;
  description: string;
  minOrder: number;
  color: string;
  accent: string;
}

interface CouponSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (code: string) => Promise<void>;
  total: number;
  availableCoupons: Coupon[];
  loading?: boolean;
  error?: string;
}

export default function CouponSheet({
  isOpen,
  onClose,
  onApply,
  total,
  availableCoupons,
  loading,
  error
}: CouponSheetProps) {
  const [couponInput, setCouponInput] = useState('');
  const { formatPrice } = useCountry();

  const handleApplyClick = () => {
    if (couponInput.trim()) {
      onApply(couponInput.toUpperCase());
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" 
            onClick={onClose} 
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 z-[101] bg-slate-50 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)] max-h-[85vh] flex flex-col border border-slate-100 sm:max-w-md w-full mx-auto"
          >
            {/* Handle bar for mobile */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white rounded-t-[2.5rem]">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Coupons & Offers</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Cart value · {formatPrice(total)}</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Input Section */}
            <div className="px-6 py-5 border-b border-slate-100 bg-white">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 gap-2 focus-within:border-[hsl(var(--swago-purple))] focus-within:ring-4 focus-within:ring-purple-50 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                  </svg>
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-1 bg-transparent py-3 text-xs md:text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none tracking-widest"
                  />
                </div>
                <button
                  onClick={handleApplyClick}
                  disabled={!couponInput.trim() || loading}
                  className="bg-[hsl(var(--swago-purple))] text-white font-black text-xs px-3 md:px-6 rounded-2xl  tracking-wider disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-purple-100"
                >
                  {loading ? '...' : 'Apply'}
                </button>
              </div>
              {error && <p className="text-[10px] text-rose-600 font-bold mt-2 ml-1 flex items-center gap-1.5 animate-pulse">
                <span className="text-sm">⚠️</span> {error}
              </p>}
            </div>

            {/* Coupons List */}
            <div className="overflow-y-auto flex-1 px-6 py-6 space-y-4 bg-slate-50/50 scrollbar-none">
              <p className="text-[9px] font-black text-slate-400 tracking-widest mb-1">Available Coupons</p>
              {availableCoupons.map((coupon) => {
                const isEligible = total >= coupon.minOrder;
                return (
                  <div 
                    key={coupon.code} 
                    className={`rounded-[1.5rem] border p-5 transition-all bg-white relative overflow-hidden group ${
                      isEligible ? 'border-slate-100 shadow-sm hover:shadow-md' : 'border-slate-100 opacity-70'
                    }`}
                  >
                    {/* Decorative dash pattern side */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 flex flex-col justify-around py-2">
                       {[...Array(6)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-slate-100" />)}
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span 
                            className="text-[9px] font-black px-2 py-0.5 rounded-lg text-white shadow-sm"
                            style={{ backgroundColor: coupon.accent }}
                          >
                            {coupon.label}
                          </span>
                          <span className="text-sm font-black text-slate-900 tracking-tight uppercase">{coupon.code}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold leading-tight">{coupon.description}</p>
                        
                        <div className="mt-3">
                          {isEligible ? (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg">
                              <div className="w-1 h-1 rounded-full bg-emerald-500" />
                              <span className="text-[9px] text-emerald-600 font-black tracking-tight">Eligible on order</span>
                            </div>
                          ) : (
                            <p className="text-[9px] text-slate-400 font-bold tracking-tight">
                              Add {formatPrice(coupon.minOrder - total)} more to unlock
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => isEligible && onApply(coupon.code)}
                        disabled={!isEligible || loading}
                        className={`flex-shrink-0 text-[10px] font-black tracking-widest px-5 py-2.5 rounded-xl transition-all active:scale-95 ${
                          isEligible 
                          ? 'bg-[hsl(var(--swago-purple))] text-white hover:opacity-90 shadow-lg shadow-purple-100' 
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
