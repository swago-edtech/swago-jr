"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
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
      return () => { document.body.removeChild(script); };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      // Should not happen as page logic guards this, but just in case
      router.push(`/login?redirect=/masterclass/${masterclass.slug}`);
      return;
    }

    try {
      setLoading(true);
      
      // 1. Create Booking & Order
      const res = await fetch("/api/masterclass/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterclassId: masterclass._id,
          sessionId: session._id,
          currency: displayCurrency, // Pass currency to backend
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

      // 2. Open Razorpay
      const options = {
        key: data.key,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "Swago Jr.",
        description: `Booking: ${masterclass.title} - ${session.title}`,
        order_id: data.razorpayOrder.id,
        handler: async function (response: any) {
          // 3. Verify Payment
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
        theme: { color: "#8b5cf6" }, // swago purple
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50">
            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">Complete Booking</h2>
              <p className="text-slate-600 font-medium mt-1">{session.title}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-900 shadow-sm transition-colors shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 border-b pb-2">Child's Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Child's Name <span className="text-red-500">*</span></label>
                    <input required type="text" value={formData.childName} onChange={e => setFormData({...formData, childName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[hsl(var(--swago-purple))] outline-none transition-all text-slate-900" placeholder="First Name" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Child's Age <span className="text-red-500">*</span></label>
                    <input required type="number" min="1" max="18" value={formData.childAge} onChange={e => setFormData({...formData, childAge: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[hsl(var(--swago-purple))] outline-none transition-all text-slate-900" placeholder="e.g. 8" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 border-b pb-2">Parent's Information</h3>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Parent's Name <span className="text-red-500">*</span></label>
                  <input required type="text" value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[hsl(var(--swago-purple))] outline-none transition-all text-slate-900" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone <span className="text-red-500">*</span></label>
                    <input required type="tel" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[hsl(var(--swago-purple))] outline-none transition-all text-slate-900" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                    <input required type="email" value={formData.parentEmail} onChange={e => setFormData({...formData, parentEmail: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[hsl(var(--swago-purple))] outline-none transition-all text-slate-900" />
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Amount</p>
              <p className="text-2xl font-black text-slate-900">{formatPrice(displayPrice, displayCurrency)}</p>
            </div>
            <button
              type="submit"
              form="booking-form"
              disabled={loading}
              className="btn-shine bg-[hsl(var(--swago-purple))] text-white font-bold px-8 py-3.5 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? "Processing..." : "Pay & Book"}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
