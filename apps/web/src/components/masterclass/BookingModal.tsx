"use client";

import { useState, useEffect } from "react";
import { X, Loader2, User as UserIcon, Phone, Mail, GraduationCap, School, Target, MapPin, ShieldCheck, ChevronRight, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSharedContext } from "@/context/SharedContext";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/hooks/useCurrency";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterclass: any;
  session: any;
  currency?: string;
}

export default function BookingModal({ isOpen, onClose, masterclass, session, currency = "INR" }: BookingModalProps) {
  const { user } = useSharedContext();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    childName: "",
    childAge: "",
    childGrade: "",
    schoolName: "",
    goals: "",
    city: "",
    state: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
  });

  // Calculate correct display price based on currency
  let activePricing = session.pricing?.find((p: any) => p.currency === currency);
  if (!activePricing && session.pricing?.length > 0) {
    activePricing = session.pricing.find((p: any) => p.currency === "INR") || session.pricing[0];
  }
  const displayPrice = activePricing?.price ?? session.price;
  const displayCurrency = activePricing?.currency || currency;

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        parentName: user.name || "",
        parentPhone: user.phone || "",
        parentEmail: user.email || "",
      }));
    }
  }, [user]);

  // Load Razorpay script
  useEffect(() => {
    if (isOpen) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
      return () => { 
        if (document.body.contains(script)) {
          document.body.removeChild(script); 
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    try {
      setLoading(true);
      
      const res = await fetch("/api/masterclass/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterclassId: masterclass._id,
          sessionId: session._id,
          currency: displayCurrency,
          ...formData,
          childAge: Number(formData.childAge)
        }),
      });

      const data = await res.json();
      
      if (!data.success) {
        alert(data.error || "Failed to initiate booking");
        setLoading(false);
        return;
      }

      const options = {
        key: data.key,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "Swago Jr.",
        description: `Booking: ${masterclass.title} - ${session.title}`,
        order_id: data.razorpayOrder.id,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/masterclass/book/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            router.push(`/masterclass/booking-success?bookingId=${verifyData.bookingId}`);
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: formData.parentName,
          email: formData.parentEmail,
          contact: formData.parentPhone,
        },
        theme: { color: "#8b5cf6" },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        alert("Payment Failed: " + response.error.description);
        setLoading(false);
      });
      rzp.open();

    } catch (error) {
      console.error("Booking error:", error);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />
        
        {/* Modal Content */}
        <motion.div 
          initial={{ y: "100%" }} 
          animate={{ y: 0 }} 
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
          className="relative w-full max-w-2xl bg-white rounded-t-[40px] sm:rounded-[32px] shadow-2xl flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh] overflow-hidden"
        >
          {/* Mobile Handle */}
          <div className="sm:hidden w-16 h-1.5 bg-slate-200 rounded-full mx-auto my-4 shrink-0" />

          {/* Header */}
          <div className="px-6 py-4 sm:p-8 flex items-center justify-between border-b border-slate-100 bg-white z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--swago-purple))]/10 flex items-center justify-center text-[hsl(var(--swago-purple))] shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl sm:text-3xl font-black text-slate-900 leading-none tracking-tight">Complete Booking</h2>
                <p className="text-slate-500 text-xs sm:text-sm font-bold mt-1.5 uppercase tracking-wider line-clamp-1">{session.title}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 bg-slate-100 rounded-2xl text-slate-500 hover:text-slate-900 transition-all hover:bg-slate-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8">
            <form id="booking-form" onSubmit={handleSubmit} className="space-y-12 pb-10">
              
              {/* 1. Child Details - First Section */}
              <div className="space-y-8">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                  <div className="w-2 h-6 bg-[hsl(var(--swago-purple))] rounded-full" />
                  Child's Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name & Age Row */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Participant Name *</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[hsl(var(--swago-purple))] transition-colors" />
                      <input required type="text" value={formData.childName} onChange={e => setFormData({...formData, childName: e.target.value})} className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-[hsl(var(--swago-purple))]/5 focus:border-[hsl(var(--swago-purple))] focus:bg-white outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300" placeholder="e.g. Rahul Verma" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Age *</label>
                    <input required type="number" min="1" max="18" value={formData.childAge} onChange={e => setFormData({...formData, childAge: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-[hsl(var(--swago-purple))]/5 focus:border-[hsl(var(--swago-purple))] focus:bg-white outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300" placeholder="e.g. 10" />
                  </div>

                  {/* Grade & School Row */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade / Class</label>
                    <div className="relative group">
                      <GraduationCap className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input type="text" value={formData.childGrade} onChange={e => setFormData({...formData, childGrade: e.target.value})} className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300" placeholder="e.g. 5th Grade" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">School Name</label>
                    <div className="relative group">
                      <School className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input type="text" value={formData.schoolName} onChange={e => setFormData({...formData, schoolName: e.target.value})} className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300" placeholder="e.g. St. Xaviers" />
                    </div>
                  </div>

                  {/* City & State Row */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">City *</label>
                    <div className="relative group">
                      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                      <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-red-500/5 focus:border-red-500 focus:bg-white outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300" placeholder="City" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">State *</label>
                    <div className="relative group">
                      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                      <input required type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-red-500/5 focus:border-red-500 focus:bg-white outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300" placeholder="State" />
                    </div>
                  </div>

                  {/* Goals - Full Width */}
                  <div className="col-span-1 sm:col-span-2 space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">What are your learning goals?</label>
                    <div className="relative group">
                      <Target className="absolute left-5 top-6 w-5 h-5 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                      <textarea rows={3} value={formData.goals} onChange={e => setFormData({...formData, goals: e.target.value})} className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-green-500/5 focus:border-green-500 focus:bg-white outline-none transition-all text-slate-900 font-bold resize-none placeholder:text-slate-300" placeholder="e.g. Improve public speaking and overcome stage fear..." />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Parent Information - Moved to Bottom */}
              <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-6 sm:p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4">
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20">Verified Profile</div>
                </div>
                
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-slate-300 rounded-full" />
                  Review Parent Information
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                    <p className="font-black text-slate-900">{formData.parentName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                    <p className="font-black text-slate-900">{formData.parentPhone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                    <p className="font-black text-slate-900 truncate">{formData.parentEmail}</p>
                  </div>
                </div>
                
                <p className="mt-6 text-[10px] text-slate-400 font-medium italic">Communication regarding the session will be sent to the above contact details.</p>
              </div>

            </form>
          </div>

          {/* Footer Bar */}
          <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0 z-10">
            <div className="text-center sm:text-left">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Amount Payable</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{formatPrice(displayPrice, displayCurrency)}</p>
            </div>
            
            <button
              type="submit"
              form="booking-form"
              disabled={loading}
              className="w-full sm:w-auto min-w-[240px] bg-[hsl(var(--swago-purple))] text-white font-black px-10 py-6 rounded-[28px] hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 group"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Lock className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                  <span className="text-xl tracking-tight">Confirm & Book Now</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </AnimatePresence>
  );
}
