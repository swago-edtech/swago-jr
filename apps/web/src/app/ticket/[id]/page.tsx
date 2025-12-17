"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSharedContext } from "@/context/SharedContext";
import { motion } from "framer-motion";

export default function TicketScanPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoadingUser } = useSharedContext();
  const [isScanning, setIsScanning] = useState(true);
  const [productName, setProductName] = useState("");
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check authentication and redirect if needed
  useEffect(() => {
    if (mounted && !isLoadingUser && !user) {
      const productId = params.id as string;
      router.push(`/login?redirect=/ticket/${productId}`);
    }
  }, [user, isLoadingUser, router, mounted, params.id]);

  // Scanning logic (only runs if user is authenticated)
  useEffect(() => {
    if (!mounted || isLoadingUser || !user) return;

    // Get the product ID from URL
    const productId = params.id as string;

    // Format the product name (convert slug to readable name)
    const formatProductName = (slug: string) => {
      // Convert "scarf-dumb-shrades" to "Scarf Dumb Shrades"
      // Convert "seek-rush" to "Seek Rush"
      return slug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    const name = formatProductName(productId);
    setProductName(name);

    // Wait 10-15 seconds (random between 10000-15000ms)
    const delay = Math.floor(Math.random() * 5000) + 10000; // 10-15 seconds

    const timer = setTimeout(() => {
      setIsScanning(false);
      
      // After showing scanned message, redirect to /swago-pass
      setTimeout(() => {
        router.push("/swago-pass");
      }, 2000);
    }, delay);

    return () => clearTimeout(timer);
  }, [params.id, router, mounted, isLoadingUser, user]);

  // Show loading state while checking authentication
  if (!mounted || isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--swago-purple))] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--swago-purple))] mx-auto"></div>
          <p className="mt-4 text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        {isScanning ? (
          // Scanning Animation
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-12 text-center"
          >
            {/* QR Scanner Animation */}
            <div className="relative w-48 h-48 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-[hsl(var(--swago-purple))] rounded-2xl"></div>
              
              {/* Scanning Line */}
              <motion.div
                animate={{ y: [0, 176, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-1 bg-[hsl(var(--swago-teal))] shadow-lg"
                style={{ top: 0 }}
              />
              
              {/* Corner Markers */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[hsl(var(--swago-purple))] rounded-tl-2xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[hsl(var(--swago-purple))] rounded-tr-2xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[hsl(var(--swago-purple))] rounded-bl-2xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[hsl(var(--swago-purple))] rounded-br-2xl"></div>
              
              {/* QR Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-24 h-24 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h3v2h-3v-2zm0 3h3v2h-3v-2zm-3 0h2v4h-2v-4zm3 3h3v2h-3v-2z"/>
                </svg>
              </div>
            </div>

            {/* Scanning Text */}
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Scanning QR Code
            </h2>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-[hsl(var(--swago-purple))] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-[hsl(var(--swago-purple))] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-[hsl(var(--swago-purple))] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </motion.div>
        ) : (
          // Success Message
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-white rounded-3xl shadow-2xl p-12 text-center"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center"
            >
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            {/* Success Message */}
            <h2 className="text-3xl font-black text-slate-800 mb-3">
              Scanned Successfully!
            </h2>
            <p className="text-xl text-slate-600 mb-2">
              Scanned <span className="font-bold text-[hsl(var(--swago-purple))]">{productName}</span>
            </p>
            <p className="text-sm text-slate-500">
              Redirecting to lottery...
            </p>

            {/* Loading Indicator */}
            <div className="mt-6">
              <div className="w-48 h-2 bg-slate-200 rounded-full mx-auto overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-pink))]"
                />
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
