// apps/web/src/components/lottery/ClaimPhase.tsx

"use client";

import { motion } from "framer-motion";
import { useState, ChangeEvent } from "react";
import { FiArrowLeft } from "react-icons/fi";

interface ClaimPhaseProps {
  ticketType: 'SSR' | 'SDC';
  kidProfileId: string;
  onBack: () => void;
  onSuccess: (data: unknown) => void;
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
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ticketInfo = TICKET_INFO[ticketType];

  // Format code as user types: SWAGO-XXX-XXXXXX
  const handleCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Auto-add "SWAGO-" prefix if not present
    if (!value.startsWith('SWAGO')) {
      if (value.length > 0 && 'SWAGO'.startsWith(value)) {
        // User is typing "SWAGO"
        value = value;
      } else if (value.length > 0) {
        // User started typing code directly
        value = 'SWAGO' + value;
      }
    }

    // Remove "SWAGO" temporarily for easier formatting
    const codePart = value.replace(/^SWAGO/, '');
    
    // Auto-format with dashes
    let formatted = 'SWAGO';
    
    if (codePart.length > 0) {
      // Add first dash and ticket type (SSR/SDC)
      formatted += '-' + codePart.substring(0, 3);
      
      if (codePart.length > 3) {
        // Add second dash and remaining characters
        formatted += '-' + codePart.substring(3, 9);
      }
    }

    // Limit to format: SWAGO-XXX-XXXXXX (max 17 chars)
    if (formatted.length <= 17) {
      setCode(formatted);
      setError(null);
    }
  };

  // Validate code format
  const isValidFormat = /^SWAGO-(SSR|SDC)-[A-Z0-9]{6}$/.test(code);
  const isCorrectType = code.includes(`-${ticketType}-`);

  // Submit code
  const handleSubmit = async () => {
    // Validation
    if (!isValidFormat) {
      setError('Invalid code format. Use: SWAGO-XXX-XXXXXX');
      return;
    }

    if (!isCorrectType) {
      setError(`This code is not for ${ticketInfo.name}. Please check your selection.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/lottery/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          kidProfileId: kidProfileId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onSuccess(data);
      } else {
        setError(data.error || 'Failed to redeem code');
      }
    } catch (err) {
      console.error('Error redeeming code:', err);
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
            Enter Your Box Code
          </h2>
          <p className="text-slate-600">
            Find the code inside your {ticketInfo.product} box and enter it below.
          </p>
        </div>

        {/* Code Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Lottery Code
          </label>
          
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder={`SWAGO-${ticketType}-XXXXXX`}
            disabled={loading}
            className={`
              w-full px-4 py-4 text-xl font-mono font-bold text-center
              rounded-xl border-3 transition-all
              focus:outline-none focus:ring-4
              ${error 
                ? 'border-red-300 bg-red-50 focus:ring-red-200' 
                : 'border-slate-300 bg-slate-50 focus:ring-[hsl(var(--swago-purple))]/20 focus:border-[hsl(var(--swago-purple))]'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          />

          {/* Format Helper */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-500">
              Format: SWAGO-{ticketType}-XXXXXX
            </p>
            {code && (
              <p className={`text-xs font-medium ${isValidFormat && isCorrectType ? 'text-green-600' : 'text-slate-400'}`}>
                {code.length}/17 characters
              </p>
            )}
          </div>

          {/* Validation Feedback */}
          {code.length > 5 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                {isValidFormat ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-slate-400">○</span>
                )}
                <span className={`text-sm ${isValidFormat ? 'text-green-600 font-medium' : 'text-slate-500'}`}>
                  Valid format
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isCorrectType ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-slate-400">○</span>
                )}
                <span className={`text-sm ${isCorrectType ? 'text-green-600 font-medium' : 'text-slate-500'}`}>
                  Matches {ticketInfo.name}
                </span>
              </div>
            </div>
          )}
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
          whileHover={isValidFormat && isCorrectType && !loading ? { scale: 1.02 } : {}}
          whileTap={isValidFormat && isCorrectType && !loading ? { scale: 0.98 } : {}}
          onClick={handleSubmit}
          disabled={!isValidFormat || !isCorrectType || loading}
          className={`
            w-full py-4 rounded-xl font-black text-lg shadow-lg transition-all
            ${isValidFormat && isCorrectType && !loading
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
