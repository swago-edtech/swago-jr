"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSharedContext } from "@/context/SharedContext";
import MasterclassHero from "@/components/masterclass/MasterclassHero";
import MasterclassTestimonials from "@/components/masterclass/MasterclassTestimonials";
import MasterclassModules from "@/components/masterclass/MasterclassModules";
import MasterclassAudience from "@/components/masterclass/MasterclassAudience";
import MasterclassBonuses from "@/components/masterclass/MasterclassBonuses";
import MasterclassMentor from "@/components/masterclass/MasterclassMentor";
import MasterclassCertification from "@/components/masterclass/MasterclassCertification";
import SessionGallery from "@/components/masterclass/SessionGallery";
import MasterclassFAQ from "@/components/masterclass/MasterclassFAQ";
import BookingModal from "@/components/masterclass/BookingModal";
import { Loader2 } from "lucide-react";

export default function MasterclassGlobalPage() {
  const router = useRouter();
  const { user } = useSharedContext();
  
  const [masterclass, setMasterclass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedCurrency, setSelectedCurrency] = useState("INR");

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

  const handleBookSession = (session: any, currency: string) => {
    if (!user) {
      // Save current path for redirect
      const currentPath = `/masterclass`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    
    setSelectedCurrency(currency);
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-[hsl(var(--swago-purple))] animate-spin" />
      </div>
    );
  }

  if (!masterclass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xl text-slate-600 font-medium">Masterclass is currently unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <MasterclassHero hero={masterclass.hero} />
      
      <SessionGallery 
        sessions={masterclass.sessions} 
        onBookSession={handleBookSession} 
      />
      
      <MasterclassModules modules={masterclass.modules} />
      
      <MasterclassAudience audience={masterclass.targetAudience} />
      
      <MasterclassBonuses bonuses={masterclass.bonuses} />
      
      <MasterclassMentor mentor={masterclass.mentor} />
      
      <MasterclassCertification certification={masterclass.certification} />
      
      <MasterclassTestimonials testimonials={masterclass.testimonials} />

      <MasterclassFAQ faqs={masterclass.faqs} />

      {selectedSession && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          masterclass={masterclass}
          session={selectedSession}
          currency={selectedCurrency}
        />
      )}
    </main>
  );
}
