"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSharedContext } from "@/context/SharedContext";
import MasterclassHero from "@/components/masterclass/MasterclassHero";
import MasterclassTestimonials from "@/components/masterclass/MasterclassTestimonials";

import MasterclassAudience from "@/components/masterclass/MasterclassAudience";
import MasterclassBonuses from "@/components/masterclass/MasterclassBonuses";
import MasterclassMentor from "@/components/masterclass/MasterclassMentor";
import MasterclassCertification from "@/components/masterclass/MasterclassCertification";
import SessionGallery from "@/components/masterclass/SessionGallery";
import MasterclassFAQ from "@/components/masterclass/MasterclassFAQ";
import BookingModal from "@/components/masterclass/BookingModal";
import { Loader2, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MasterclassGlobalPage() {
  const router = useRouter();
  const { user } = useSharedContext();

  const [masterclass, setMasterclass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("INR");

  // sticky bar visibility
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const fetchMasterclass = async () => {
      try {
        const res = await fetch(`/api/masterclass`);
        const data = await res.json();
        if (data.success) {
          setMasterclass(data.masterclass);
        }
      } catch (error) {
        console.error("Error fetching masterclass:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMasterclass();
  }, []);

  // Show sticky bar after scrolling past the hero
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBookSession = (session: any, currency: string) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent("/masterclass")}`);
      return;
    }
    setSelectedCurrency(currency);
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
          <p className="text-slate-400 font-semibold text-sm uppercase tracking-widest">Loading Masterclass...</p>
        </div>
      </div>
    );
  }

  // Temporarily hiding masterclass - forcing coming soon screen
  if (true || !masterclass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-10 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-sm mx-4">
          <p className="text-slate-900 text-xl font-black mb-2">Coming Soon</p>
          <p className="text-slate-500 font-medium">Our masterclass is currently being prepared. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-white min-h-screen">
      {/* === SECTIONS (Think School page order) === */}
      <MasterclassHero hero={masterclass.hero} />



      {/* 3. Sessions / Pricing */}
      <SessionGallery
        sessions={masterclass.sessions}
        onBookSession={handleBookSession}
      />

      {/* 4. Who is it for */}
      <MasterclassAudience audience={masterclass.targetAudience} />

      {/* 5. Mentor */}
      <MasterclassMentor mentor={masterclass.mentor} />

      {/* 6. Certification */}
      <MasterclassCertification certification={masterclass.certification} />

      {/* 7. Bonuses */}
      <MasterclassBonuses bonuses={masterclass.bonuses} />

      {/* 8. Testimonials */}
      <MasterclassTestimonials testimonials={masterclass.testimonials} />

      {/* 9. FAQ */}
      <MasterclassFAQ faqs={masterclass.faqs} />

      {/* Booking Modal */}
      {selectedSession && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          masterclass={masterclass}
          session={selectedSession}
          currency={selectedCurrency}
        />
      )}

      {/* =============================================
          STICKY BOTTOM BAR — Think School's signature
          ============================================= */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 sm:py-4"
          >
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
              {/* Left info */}
              <div className="hidden sm:block min-w-0">
                <p className="text-slate-900 font-black text-base leading-tight truncate">
                  {masterclass.title || "Communication Masterclass"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Users className="w-3 h-3 text-orange-400" />
                  <p className="text-slate-500 text-xs font-medium">
                    {masterclass.hero?.stats?.[0]?.value || "47K+"} Students Enrolled
                  </p>
                </div>
              </div>

              {/* Right CTA group */}
              <div className="flex items-center gap-3 ml-auto">
                <span className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-medium whitespace-nowrap">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Limited Time Offer · 50% OFF
                </span>
                <a
                  href="#sessions"
                  className="inline-flex items-center gap-2 bg-[hsl(var(--swago-purple))] text-white font-black px-6 sm:px-8 py-3 rounded-full text-sm sm:text-base shadow-[0_8px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 transition-all duration-200 active:scale-95 whitespace-nowrap"
                >
                  Enroll Now
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
