// apps/web/src/components/AnnouncementBanner.tsx

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Announcement = {
  text: string;
  backgroundColor: string;
  isScrolling?: boolean;
};

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await fetch("/api/announcement");
        const data = await res.json();

        if (data.success && data.announcement) {
          setAnnouncement(data.announcement);
        }
      } catch (error) {
        console.error("Error fetching announcement:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, []);

  // Get background color class
  const getBackgroundClass = (bg: string) => {
    const colors: Record<string, string> = {
      gradient: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      purple: "bg-purple-600 text-white",
      pink: "bg-pink-600 text-white",
      teal: "bg-teal-600 text-white",
      orange: "bg-orange-600 text-white",
      yellow: "bg-yellow-400 text-black",
    };
    return colors[bg] || colors.gradient;
  };

  // Don't render anything while loading or if no announcement
  if (loading || !announcement) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`${getBackgroundClass(announcement.backgroundColor)} overflow-hidden py-2 relative border-b border-black/5`}
      >
        {announcement.isScrolling ? (
          <div className="flex overflow-hidden whitespace-nowrap relative">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                repeat: Infinity,
                ease: "linear",
                duration: 25
              }}
              className="flex whitespace-nowrap min-w-max"
            >
              {/* Double it for a continuous loop */}
              <div className="flex gap-4 md:gap-8 items-center px-4 md:px-8">
                {[...Array(10)].map((_, i) => (
                  <span key={`a-${i}`} className="text-sm md:text-base font-bold uppercase tracking-widest whitespace-nowrap flex items-center gap-4">
                    {announcement.text}
                    <span className="opacity-40">•</span>
                  </span>
                ))}
              </div>
              <div className="flex gap-4 md:gap-8 items-center px-4 md:px-8">
                {[...Array(10)].map((_, i) => (
                  <span key={`b-${i}`} className="text-sm md:text-base font-bold uppercase tracking-widest whitespace-nowrap flex items-center gap-4">
                    {announcement.text}
                    <span className="opacity-40">•</span>
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="container mx-auto px-4">
            <p className="text-center text-sm md:text-base font-bold uppercase tracking-wide">
              {announcement.text}
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
