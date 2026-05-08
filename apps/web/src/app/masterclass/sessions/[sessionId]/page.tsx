"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Clock, Calendar, Users, Star, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSharedContext } from "@/context/SharedContext";
import { useCurrency, formatPrice } from "@/hooks/useCurrency";

import MasterclassModules from "@/components/masterclass/MasterclassModules";
import MasterclassTestimonials from "@/components/masterclass/MasterclassTestimonials";
import MasterclassFAQ from "@/components/masterclass/MasterclassFAQ";
import BookingModal from "@/components/masterclass/BookingModal";

export default function SessionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { user } = useSharedContext();
  const { currency } = useCurrency();

  const [masterclass, setMasterclass] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchMasterclass = async () => {
      try {
        const res = await fetch(`/api/masterclass`);
        const data = await res.json();
        if (data.success && data.masterclass) {
          setMasterclass(data.masterclass);
          const foundSession = data.masterclass.sessions.find((s: any) => s._id === sessionId);
          if (foundSession) {
            setSession(foundSession);
          } else {
            router.push("/masterclass");
          }
        } else {
          router.push("/masterclass");
        }
      } catch (error) {
        console.error("Error fetching masterclass:", error);
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) {
      fetchMasterclass();
    }
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-[hsl(var(--swago-purple))] animate-spin" />
      </div>
    );
  }

  if (!session || !masterclass) return null;

  const isFullyBooked = session.bookedSeats >= session.maxSeats;
  const spotsLeft = Math.max(0, session.maxSeats - session.bookedSeats);

  // Pricing Logic
  let activePricing = session.pricing?.find((p: any) => p.currency === currency);
  if (!activePricing && session.pricing?.length > 0) {
    activePricing = session.pricing.find((p: any) => p.currency === "INR") || session.pricing[0];
  }
  const displayPrice = activePricing?.price ?? session.price;
  const displayOriginalPrice = activePricing?.originalPrice ?? session.originalPrice;
  const displayCurrency = activePricing?.currency || currency;

  const handleBookClick = () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <main className="bg-slate-50 min-h-screen pb-32">
      {/* Top Nav/Breadcrumb */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center">
          <Link href="/masterclass" className="flex items-center gap-2 text-slate-500 hover:text-[hsl(var(--swago-purple))] transition-colors font-medium">
            <ArrowLeft className="w-5 h-5" />
            Back to Masterclasses
          </Link>
        </div>
      </div>

      {/* Session Hero */}
      <section className="bg-white py-12 lg:py-20 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row gap-12 items-center">
          <div className="lg:w-1/2 w-full space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-full bg-purple-100 text-[hsl(var(--swago-purple))] font-bold text-sm tracking-wide">
              {session.ageGroup}
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
              {session.title}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              {session.description || "Join this exclusive session and help your child master new skills with our expert mentors. Spots are strictly limited."}
            </p>

            <div className="flex flex-wrap gap-6 pt-4">
              {session.schedule && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Schedule</p>
                    <p className="font-semibold text-slate-900">{session.schedule}</p>
                  </div>
                </div>
              )}
              {session.duration && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Duration</p>
                    <p className="font-semibold text-slate-900">{session.duration}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Availability</p>
                  <p className="font-semibold text-slate-900">
                    {isFullyBooked ? <span className="text-red-500">Fully Booked</span> : `${spotsLeft} spots left`}
                  </p>
                </div>
              </div>
            </div>
            
            {session.highlights && session.highlights.length > 0 && (
              <div className="pt-6 border-t border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4">Key Highlights:</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {session.highlights.map((highlight: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:w-1/2 w-full">
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-900/5">
              {session.thumbnail ? (
                <Image src={session.thumbnail} alt={session.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <span className="text-slate-400 font-medium">No Session Image</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Global Masterclass Sections reused for Session */}
      {masterclass.modules?.length > 0 && <MasterclassModules modules={masterclass.modules} />}
      
      {/* Reviews Placeholder section */}
      <section className="py-16 bg-white relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Student Reviews</h2>
            <p className="text-slate-600 font-medium max-w-2xl mx-auto">See what others are saying about this specific session.</p>
          </div>
          <div className="bg-slate-50 rounded-3xl p-12 text-center border border-slate-100 border-dashed">
            <div className="flex justify-center gap-1 mb-4">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400 opacity-50" />)}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Reviews coming soon!</h3>
            <p className="text-slate-500">We are currently gathering feedback from our recent graduates.</p>
          </div>
        </div>
      </section>

      {masterclass.testimonials?.length > 0 && <MasterclassTestimonials testimonials={masterclass.testimonials} />}

      {masterclass.faqs?.length > 0 && <MasterclassFAQ faqs={masterclass.faqs} />}

      {/* Sticky Bottom Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 p-4 transform translate-y-0 transition-transform">
        <div className="max-w-6xl mx-auto px-2 flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-0.5">Secure your spot</p>
            <p className="text-slate-900 font-medium line-clamp-1">{session.title}</p>
          </div>
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              {displayOriginalPrice && (
                <p className="text-xs text-slate-400 line-through mb-0.5">{formatPrice(displayOriginalPrice, displayCurrency)}</p>
              )}
              <p className="text-2xl font-black text-slate-900 leading-none">{formatPrice(displayPrice, displayCurrency)}</p>
            </div>
            <button
              onClick={handleBookClick}
              disabled={isFullyBooked}
              className={`btn-shine font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg text-lg ${
                isFullyBooked 
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
                  : "bg-[hsl(var(--swago-purple))] text-white hover:shadow-purple-500/30 hover:-translate-y-0.5"
              }`}
            >
              {isFullyBooked ? "Sold Out" : "Book Session Now"}
            </button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        masterclass={masterclass}
        session={session}
        currency={currency}
      />
    </main>
  );
}
