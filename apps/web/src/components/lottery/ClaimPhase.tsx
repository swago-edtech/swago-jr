// apps/web/src/components/lottery/ClaimPhase.tsx

"use client";

import { motion } from "framer-motion";
import { useState, useRef, KeyboardEvent } from "react";
import { FiArrowLeft } from "react-icons/fi";

interface SuccessData {
  ticket: {
    code: string;
    productName: string;
    ticketType: string;
    swagoMoneyEarned: number;
  };
  kidProfile: {
    username: string;
    swagoMoney: number;
  };
}

interface ClaimPhaseProps {
  ticketType: 'SSR' | 'SDC';
  kidProfileId: string;
  onBack: () => void;
  onSuccess: (data: SuccessData) => void;
}

const TICKET_INFO = {
  SSR: {
    name: "Diamond Ticket",
    icon: "💎",
    product: "Seek Rush",
    color: "purple",
  },
  SDC: {
    name: "Golden Ticket",
    icon: "🏆",
    product: "Scarf Dumb Charades",
    color: "orange",
  },
} as const;

export default function ClaimPhase({ 
  ticketType, 
  kidProfileId, 
  onBack, 
  onSuccess 
}: ClaimPhaseProps) {
  const [codes, setCodes] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const ticketInfo = TICKET_INFO[ticketType];

  const handleCodeChange = (index: number, value: string) => {
    const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (sanitized.length <= 1) {
      const newCodes = [...codes];
      newCodes[index] = sanitized;
      setCodes(newCodes);
      setError(null);

      if (sanitized.length === 1 && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && codes[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const newCodes = [...codes];
    
    for (let i = 0; i < Math.min(pastedText.length, 6); i++) {
      newCodes[i] = pastedText[i];
    }
    
    setCodes(newCodes);
    const lastIndex = Math.min(pastedText.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const getFullCode = () => {
    return `SWAGO-${ticketType}-${codes.join('')}`;
  };

  const isCodeComplete = codes.every(code => code.length === 1);
  const fullCode = getFullCode();

  const handleSubmit = async () => {
    if (!isCodeComplete) {
      setError('Please enter all 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/lottery/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: fullCode,
          kidProfileId: kidProfileId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onSuccess(data);
      } else {
        setError(data.error || 'Failed to redeem code');
      }
    } catch (error) {
      console.error('Error redeeming code:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto"
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium mb-6 transition-colors group"
      >
        <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        Change Selection
      </button>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
        {/* Selected Ticket Info */}
        <div className={`
          rounded-xl p-4 mb-6
          ${ticketType === 'SSR' ? 'bg-purple-50 border-2 border-purple-200' : 'bg-orange-50 border-2 border-orange-200'}
        `}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{ticketInfo.icon}</span>
            <div>
              <p className="text-sm text-slate-600">Selected Ticket</p>
              <p className="font-black text-lg text-slate-800">
                {ticketInfo.name}
              </p>
              <p className="text-sm text-slate-600">
                For {ticketInfo.product}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Enter Your Lottery Code
          </h2>
          <p className="text-slate-600 text-sm">
            Code is printed inside your Swago box
          </p>
        </div>

        {/* Code Input - Compact for Mobile */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-0.5 md:gap-2">
            {/* SWAGO (readonly) */}
            <div className="px-1.5 py-1.5 md:px-3 md:py-3 bg-slate-100 border-2 border-slate-300 rounded-md md:rounded-lg">
              <span className="text-[10px] md:text-lg font-mono font-bold text-slate-500">SWAGO</span>
            </div>
            
            {/* Dash */}
            <span className="text-sm md:text-2xl font-bold text-slate-400 px-0.5">-</span>
            
            {/* SSR/SDC (readonly) */}
            <div className="px-1.5 py-1.5 md:px-3 md:py-3 bg-slate-100 border-2 border-slate-300 rounded-md md:rounded-lg">
              <span className="text-[10px] md:text-lg font-mono font-bold text-slate-500">{ticketType}</span>
            </div>
            
            {/* Dash */}
            <span className="text-sm md:text-2xl font-bold text-slate-400 px-0.5">-</span>

            {/* 6 Input Boxes */}
            {codes.map((code, index) => (
              <input
                key={index}
                ref={(el) => {inputRefs.current[index] = el;}}
                type="text"
                value={code}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                maxLength={1}
                disabled={loading}
                className={`
                  w-8 h-8 md:w-14 md:h-14 text-center text-base md:text-2xl font-mono font-bold
                  rounded-md md:rounded-lg border-2 transition-all
                  focus:outline-none focus:ring-2
                  ${error 
                    ? 'border-red-300 bg-red-50 focus:ring-red-200' 
                    : 'border-slate-300 bg-white focus:ring-[hsl(var(--swago-purple))]/30 focus:border-[hsl(var(--swago-purple))]'
                  }
                  ${code ? 'text-slate-800' : 'text-slate-400'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
            ))}
          </div>

          {/* Helper Text */}
          <p className="text-center text-xs text-slate-500 mt-3">
            Enter the 6-character code from your box
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-red-800 mb-1">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* What You'll Get */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-orange-200 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-orange-800 mb-3">
            🎁 What you&apos;ll get:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <span className="text-lg">🎟️</span>
              <span>1x {ticketInfo.name} for weekly draw</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <span className="text-lg">💰</span>
              <span className="font-bold text-[hsl(var(--swago-orange))]">+10 Swago Money</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <span className="text-lg">🏆</span>
              <span>Chance to win free blind bags!</span>
            </li>
          </ul>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={isCodeComplete && !loading ? { scale: 1.02 } : {}}
          whileTap={isCodeComplete && !loading ? { scale: 0.98 } : {}}
          onClick={handleSubmit}
          disabled={!isCodeComplete || loading}
          className={`
            w-full py-4 rounded-xl font-black text-lg shadow-lg transition-all
            ${isCodeComplete && !loading
              ? 'bg-[hsl(var(--swago-purple))] text-white hover:shadow-xl cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <div className="animate-spin w-5 h-5 border-3 border-white border-t-transparent rounded-full"></div>
              REDEEMING CODE...
            </span>
          ) : (
            'CLAIM MY TICKET 🎟️'
          )}
        </motion.button>
      </div>

      {/* Helper Text */}
      <p className="text-center text-sm text-slate-500 mt-4">
        Each code can only be used once. Make sure you enter it correctly!
      </p>
    </motion.div>
  );
}
