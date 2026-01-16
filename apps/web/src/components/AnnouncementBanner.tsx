// apps/web/src/components/AnnouncementBanner.tsx

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Announcement = {
  text: string;
  backgroundColor: string;
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
      gradient: "bg-gradient-to-r from-purple-500 to-pink-500",
      purple: "bg-purple-600",
      pink: "bg-pink-600",
      teal: "bg-teal-600",
      orange: "bg-orange-600",
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
        className={`${getBackgroundClass(announcement.backgroundColor)} text-white overflow-hidden`}
      >
        <div className="container mx-auto px-4">
          <p className="text-center text-sm md:text-base font-medium">
            {announcement.text}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
