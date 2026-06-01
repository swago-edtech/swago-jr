"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Clock, Calendar, Users, Star, CheckCircle2, ShieldCheck, Zap, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSharedContext } from "@/context/SharedContext";
import { useCurrency, formatPrice } from "@/hooks/useCurrency";

import MasterclassModules from "@/components/masterclass/MasterclassModules";
import MasterclassTestimonials from "@/components/masterclass/MasterclassTestimonials";
import MasterclassFAQ from "@/components/masterclass/MasterclassFAQ";
import MasterclassCertification from "@/components/masterclass/MasterclassCertification";
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
          const foundSession = data.masterclass.sessions.find((s: any) => {
            if (s._id === sessionId) return true;
            if (s.title) {
              const expectedSlug = encodeURIComponent(s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
              // Next.js params might automatically decode URI components, so we should check both encoded and decoded
              return expectedSlug === sessionId || expectedSlug === encodeURIComponent(sessionId);
            }
            return false;
          });
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
    <main className="bg-white min-h-screen pb-32">
      {/* Top Nav/Breadcrumb */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center">
          <Link href="/masterclass" className="group flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-all font-black text-xs uppercase tracking-widest">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Masterclasses
          </Link>
        </div>
      </div>

      {/* Session Hero Section */}
      <section className="relative py-12 lg:py-24 overflow-hidden">
        {/* Abstract Background Decor */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-50/50 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
            
            {/* Content Left */}
            <div className="lg:w-3/5 w-full space-y-10">
              <div className="space-y-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 font-black text-[10px] uppercase tracking-widest border border-orange-100"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Limited Session • {session.ageGroup}
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight"
                >
                  {session.title}
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl"
                >
                  {session.description || "Join this exclusive session and help your child master new skills with our expert mentors. Spots are strictly limited."}
                </motion.p>
              </div>

              {/* Session Core Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { icon: Calendar, label: "Schedule", value: session.schedule, color: "text-indigo-500", bg: "bg-indigo-50" },
                  { icon: Clock, label: "Duration", value: session.duration, color: "text-blue-500", bg: "bg-blue-50" },
                  { icon: Users, label: "Availability", value: isFullyBooked ? "Fully Booked" : `${spotsLeft} spots left`, color: isFullyBooked ? "text-red-500" : "text-green-500", bg: isFullyBooked ? "bg-red-50" : "bg-green-50" }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm"
                  >
                    <div className={`w-10 h-10 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-4`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{item.label}</p>
                    <p className="font-black text-slate-900 tracking-tight leading-tight">{item.value}</p>
                  </motion.div>
                ))}
              </div>
              
              {/* Highlights List */}
              {session.highlights && session.highlights.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="pt-10 border-t border-slate-100"
                >
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Learning Outcomes</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {session.highlights.map((highlight: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 group">
                        <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-all">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-slate-700 font-bold tracking-tight">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Media Right */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="lg:w-2/5 w-full"
            >
              <div className="relative aspect-[4/5] rounded-[48px] overflow-hidden shadow-2xl border-8 border-white bg-slate-100 group">
                {session.thumbnail ? (
                  <Image src={session.thumbnail} alt={session.title} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-300">
                    <Zap className="w-16 h-16 mb-4 opacity-20" />
                    <span className="font-black uppercase tracking-widest text-xs">Premium Content</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60" />
                
                {/* Visual Trust Badge */}
                <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/90 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/20">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Guaranteed Results</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Join {masterclass.stats?.[0]?.value || '10k+'} students</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Reusable Modules Section */}
      <MasterclassModules modules={masterclass.modules} />

      {/* Certification Section */}
      <MasterclassCertification certification={masterclass.certification} />
      
      {/* Testimonials Section */}
      <MasterclassTestimonials testimonials={masterclass.testimonials} />

      {/* Global FAQ Section */}
      <MasterclassFAQ faqs={masterclass.faqs} />

      {/* Sticky Bottom Booking Bar - Refined */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-100 shadow-[0_-20px_50px_rgba(0,0,0,0.06)] z-50 px-4 py-4 sm:py-6"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
          <div className="hidden sm:block">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Enrolling in</p>
            <h4 className="text-slate-900 font-black tracking-tight leading-tight line-clamp-1">{session.title}</h4>
          </div>
          
          <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              {displayOriginalPrice && (
                <p className="text-[10px] text-slate-400 line-through font-black uppercase tracking-widest mb-1">{formatPrice(displayOriginalPrice, displayCurrency)}</p>
              )}
              <div className="flex items-center gap-2">
                <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{formatPrice(displayPrice, displayCurrency)}</p>
              </div>
            </div>
            
            <button
              onClick={handleBookClick}
              disabled={isFullyBooked}
              className="w-full sm:w-auto bg-[hsl(var(--swago-purple))] text-white font-black sm:px-10 sm:py-5 px-6 py-3.5 rounded-[18px] sm:rounded-[22px] text-lg sm:text-xl shadow-[0_8px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.5)] hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
            >
              <span>{isFullyBooked ? "Sold Out" : "Book Session Now"}</span>
              {!isFullyBooked && <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </div>
      </motion.div>

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
