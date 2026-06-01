"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Copy, CheckCircle2, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type PopupConfig = {
  isActive: boolean;
  title: string;
  description: string;
  buttonText: string;
  redirectUrl: string;
  couponCode: string;
};

export default function HomePopup() {
  const [config, setConfig] = useState<PopupConfig | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user has already closed it recently
    const hasSeenPopup = localStorage.getItem("swago_home_popup_seen");
    if (hasSeenPopup && Date.now() - parseInt(hasSeenPopup) < 1000 * 60 * 60 * 24) {
      // Don't show if seen in last 24h
      return;
    }

    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/home-popup");
        const data = await res.json();
        if (data.success && data.config) {
          setConfig(data.config);
          // Show after 1.5 seconds delay
          setTimeout(() => {
            setIsVisible(true);
          }, 1500);
        }
      } catch (error) {
        console.error("Failed to load popup config", error);
      }
    };
    fetchConfig();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("swago_home_popup_seen", Date.now().toString());
  };

  const handleClaim = async () => {
    if (config?.couponCode) {
      try {
        await navigator.clipboard.writeText(config.couponCode);
        setHasCopied(true);
      } catch (err) {
        console.error("Failed to copy", err);
      }
    }
    
    // Wait a brief moment to show the "Copied!" state before redirecting
    setTimeout(() => {
      handleClose();
      if (config?.redirectUrl) {
        router.push(config.redirectUrl);
      }
    }, config?.couponCode ? 800 : 0);
  };

  if (!config) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Popup Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[51] w-[95%] max-w-[480px]"
          >
            <div className="bg-gradient-to-b from-[#F9F8FC] to-white border border-[#EAE5F2] rounded-[2rem] p-8 sm:p-10 shadow-2xl relative flex flex-col items-center text-center overflow-hidden">
              {/* Subtle background decoration */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[hsl(var(--swago-purple))]/5 to-transparent pointer-events-none" />
              {/* Close Button (X in corner, like image) */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Circular Icon */}
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(var(--swago-purple))] to-purple-500 flex items-center justify-center mb-5 shadow-lg shadow-purple-500/30 ring-4 ring-purple-50">
                <Gift className="w-10 h-10 text-white" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/60 text-[hsl(var(--swago-purple))] text-[10px] font-black tracking-widest uppercase mb-3">
                ✨ Exclusive Deal
              </div>

              {/* Text Content */}
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tight">
                {config.title}
              </h3>
              <p className="text-slate-600 text-sm sm:text-base mb-8 px-2 leading-relaxed font-medium">
                {config.description}
              </p>

              {/* Action Area */}
              <div className="w-full flex flex-col sm:flex-row gap-3 mb-6">
                {config.couponCode ? (
                  <>
                    <div className="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-slate-700 font-bold tracking-widest bg-slate-50 flex items-center justify-center">
                      {config.couponCode}
                    </div>
                    <button
                      onClick={handleClaim}
                      className="flex-1 bg-[hsl(var(--swago-purple))] text-white font-bold py-3 px-6 rounded-lg shadow-sm hover:shadow-md hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                    >
                      {hasCopied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          {config.buttonText}
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleClaim}
                    className="w-full bg-[hsl(var(--swago-purple))] text-white font-bold py-3 px-6 rounded-lg shadow-sm hover:shadow-md hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                  >
                    {config.buttonText}
                  </button>
                )}
              </div>

              {/* Skip Link */}
              <button 
                onClick={handleClose}
                className="text-sm font-bold text-slate-400 hover:text-[hsl(var(--swago-purple))] transition-colors mb-4"
              >
                Maybe later
              </button>

              <div className="w-full h-px bg-slate-100 my-2" />
              
              <p className="text-[11px] font-medium text-slate-400 mt-2">
                Join <span className="font-bold text-slate-600">10,000+ parents</span> empowering their kids with Swago Jr.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
