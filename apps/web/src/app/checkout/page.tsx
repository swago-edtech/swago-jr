"use client";

import { useEffect, useState, useMemo } from "react";
import { useSharedContext, type CartItem, type Product } from "@/context/SharedContext";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RiInformationLine, RiSearchLine, RiShoppingBag3Line } from "react-icons/ri";

// ✅ States List for Dropdown
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const DEFAULT_REDEMPTION_TIERS = [
  { target: 799, off: 50 },
  { target: 1200, off: 75 },
  { target: 2000, off: 100 },
  { target: 3000, off: 150 }
];

export default function CheckoutPage() {
  const { cart, total, user, isLoadingUser, clearCart, addToCart } = useSharedContext();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Tamil Nadu");
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [billingAddressType, setBillingAddressType] = useState<'same' | 'different'>('same');
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discount, setDiscount] = useState<any>(null);
  const [age, setAge] = useState("");
  const [message, setMessage] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoadingUser && !user) {
      router.push("/login?redirect=/checkout");
    }
    if (user) {
      setEmail(user.email || "");
      setPhone(user.phone || "");
      const nameParts = (user.name || "").split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
    }
  }, [user, isLoadingUser, router]);

  const handlePayNow = async () => {
    if (paymentMethod === 'cod') {
      await handleCOD();
    } else {
      await handleOnlinePayment();
    }
  };

  const handleOnlinePayment = async () => {
    setProcessing(true);
    setMessage("Processing your order...");
    try {
      // Create Razorpay Order
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: discount ? discount.finalAmount : total,
          orderDetails: {
            name: `${firstName} ${lastName}`,
            email,
            phone,
            address,
            city,
            state,
            pincode,
            cart,
            age,
            finalAmount: discount ? discount.finalAmount : total
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      const options = {
        key: data.key,
        amount: data.amount,
        currency: "INR",
        name: "Swago Jr",
        description: `Order ${data.orderId}`,
        order_id: data.id,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, orderId: data.orderId })
          });
          if (verifyRes.ok) {
            clearCart();
            router.push("/orders");
          }
        },
        prefill: { name: `${firstName} ${lastName}`, email, contact: phone },
        theme: { color: "#0066FF" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCOD = async () => {
    setProcessing(true);
    setMessage("Placing COD order...");
    try {
      const res = await fetch("/api/payment/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: discount ? discount.finalAmount : total,
          orderDetails: {
            name: `${firstName} ${lastName}`,
            email,
            phone,
            address,
            city,
            state,
            pincode,
            cart,
            age,
            finalAmount: discount ? discount.finalAmount : total
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      clearCart();
      router.push("/orders");
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode, orderAmount: total, cartItems: cart })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon(data.coupon);
        setDiscount(data.discount);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [promotion, setPromotion] = useState<any>(null);

  // Fetch promotion data
  useEffect(() => {
    fetch("/api/promotion").then(r => r.json()).then(d => {
       if (d.success) setPromotion(d.promotion);
    });
  }, []);

  const progressPercent = useMemo(() => {
    const tiers = promotion?.redemptionTiers || DEFAULT_REDEMPTION_TIERS;
    const nextTier = tiers.find((t: any) => total < t.target) || tiers[tiers.length - 1];
    return Math.min(100, (total / nextTier.target) * 100);
  }, [total, promotion]);

  const nextTier = useMemo(() => {
    const tiers = promotion?.redemptionTiers || DEFAULT_REDEMPTION_TIERS;
    return tiers.find((t: any) => total < t.target);
  }, [total, promotion]);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Link href="/products" className="text-blue-600 hover:underline">Go back to products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      

      {/* Mobile Sticky Order Summary Toggle */}
      <div className="md:hidden border-b bg-[#F7F7F7] px-6 py-4 flex flex-col gap-2">
         <button 
            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            className="flex items-center justify-between group"
         >
            <div className="flex items-center gap-2 text-[#61498C] text-sm font-bold">
               <RiShoppingBag3Line className="text-[#61498C]" />
               <span>{isSummaryExpanded ? "Hide order summary" : "Show order summary"}</span>
               <svg className={`w-4 h-4 transition-transform ${isSummaryExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
               </svg>
            </div>
            <div className="text-lg font-black text-slate-900">
               ₹{(discount ? discount.finalAmount : total).toFixed(0)}
            </div>
         </button>
         
         <AnimatePresence>
            {isSummaryExpanded && (
               <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden pt-4 pb-2"
               >
                  <OrderSummary 
                     cart={cart} total={total} discount={discount} appliedCoupon={appliedCoupon} 
                     appliedDiscount={discount} couponCode={couponCode} setCouponCode={setCouponCode} applyCoupon={applyCoupon}
                     promotion={promotion} progressPercent={progressPercent} nextTier={nextTier} addToCart={addToCart}
                  />
               </motion.div>
            )}
         </AnimatePresence>
      </div>

      <main className="flex-1 w-full grid grid-cols-1 md:grid-cols-[1fr_400px] lg:grid-cols-[1fr_480px]">
        {/* Left Column: Form */}
        <div className="flex justify-center bg-white">
          <div className="w-full max-w-[630px] p-6 md:p-12 space-y-10">
            {/* Contact Section */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Contact</h2>
              {!user && <Link href="/login" className="text-xs text-blue-600 hover:underline">Log in</Link>}
            </div>
            <div className="space-y-4">
              <input 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="Email or mobile phone number" 
                 className="w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
              />
              <label className="flex items-center gap-2 cursor-pointer group">
                 <input type="checkbox" defaultChecked className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500" />
                 <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">Email me with news and offers</span>
              </label>
            </div>
          </section>

          {/* Delivery Section */}
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Delivery</h2>
            <div className="space-y-3">
              <select className="w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-slate-50 shadow-sm appearance-none">
                <option>India</option>
              </select>

              <div className="grid grid-cols-2 gap-3">
                <input 
                   placeholder="First name" 
                   value={firstName}
                   onChange={(e) => setFirstName(e.target.value)}
                   className="w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm shadow-sm" 
                />
                <input 
                   placeholder="Last name" 
                   value={lastName}
                   onChange={(e) => setLastName(e.target.value)}
                   className="w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm shadow-sm" 
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                 <select 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white shadow-sm appearance-none"
                 >
                    <option value="" disabled>Child's Age</option>
                    {[...Array(15)].map((_, i) => (
                       <option key={i} value={i+1}>{i+1} Years</option>
                    ))}
                 </select>
              </div>

              <div className="relative">
                <input 
                   placeholder="Address" 
                   value={address}
                   onChange={(e) => setAddress(e.target.value)}
                   className="w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm shadow-sm pr-10" 
                />
                <RiSearchLine className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                 <input 
                    placeholder="City" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm shadow-sm" 
                 />
                 <select 
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white shadow-sm"
                 >
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
                 <input 
                    placeholder="PIN code" 
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm shadow-sm" 
                 />
              </div>

              <div className="relative">
                 <input 
                    placeholder="Phone" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm shadow-sm" 
                 />
                 <RiInformationLine className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 cursor-help" />
              </div>

              <div className="space-y-2 pt-2">
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">Save this information for next time</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">Text me with news and offers</span>
                 </label>
              </div>
            </div>
          </section>

          {/* Shipping Method Section */}
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Shipping method</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex items-center justify-center">
              <p className="text-xs text-slate-500">Free shipping on all orders</p>
            </div>
          </section>

          {/* Payment Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 leading-none">Payment</h2>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">All transactions are secure and encrypted.</p>
            </div>

            <div className="border rounded-lg overflow-hidden border-slate-200">
               {/* Razorpay Option */}
               <div className={`p-4 flex items-start gap-4 cursor-pointer transition-colors ${paymentMethod === 'razorpay' ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`} onClick={() => setPaymentMethod('razorpay')}>
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition-all ${paymentMethod === 'razorpay' ? 'border-blue-600' : 'border-slate-300'}`}>
                     {paymentMethod === 'razorpay' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                  </div>
                  <div className="flex-1">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-slate-900">Online Payment</span>
                        <div className="flex gap-1.5 opacity-80">
                           <div className="w-8 h-5 bg-white border border-slate-200 rounded flex items-center justify-center text-[8px] font-bold">UPI</div>
                           <div className="w-8 h-5 bg-white border border-slate-200 rounded flex items-center justify-center text-[8px] font-bold">VISA</div>
                           <div className="w-8 h-5 bg-white border border-slate-200 rounded flex items-center justify-center text-[8px] font-bold">+10</div>
                        </div>
                     </div>
                     <AnimatePresence>
                       {paymentMethod === 'razorpay' && (
                         <motion.p 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-[11px] text-slate-500 leading-relaxed mt-2 p-3 bg-white rounded-md border border-slate-100 shadow-sm"
                         >
                           You&apos;ll be redirected to secure payment gateway (UPI, Cards, Int&apos;l cards, Wallets) to complete your purchase.
                         </motion.p>
                       )}
                     </AnimatePresence>
                  </div>
               </div>

               {/* COD Option */}
               <div className={`p-4 border-t flex items-start gap-4 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`} onClick={() => setPaymentMethod('cod')}>
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition-all ${paymentMethod === 'cod' ? 'border-blue-600' : 'border-slate-300'}`}>
                     {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                  </div>
                  <div className="flex-1">
                     <span className="text-sm font-bold text-slate-900">Cash on Delivery (COD)</span>
                  </div>
               </div>
            </div>
          </section>

          {/* Billing Address Section */}
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Billing address</h2>
            <div className="border rounded-lg overflow-hidden border-slate-200">
               <div className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${billingAddressType === 'same' ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`} onClick={() => setBillingAddressType('same')}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${billingAddressType === 'same' ? 'border-blue-600' : 'border-slate-300'}`}>
                     {billingAddressType === 'same' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                  </div>
                  <span className="text-sm font-bold text-slate-900">Same as shipping address</span>
               </div>
               <div className={`p-4 border-t flex items-center gap-4 cursor-pointer transition-colors ${billingAddressType === 'different' ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`} onClick={() => setBillingAddressType('different')}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${billingAddressType === 'different' ? 'border-blue-600' : 'border-slate-300'}`}>
                     {billingAddressType === 'different' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                  </div>
                  <span className="text-sm font-bold text-slate-900">Use a different billing address</span>
               </div>
            </div>
          </section>

          <button 
             onClick={handlePayNow}
             disabled={processing}
             className="w-full h-14 bg-[#0066FF] hover:bg-[#0052CC] text-white font-black rounded-lg text-lg uppercase tracking-widest shadow-xl shadow-blue-100 transition-all transform active:scale-95 disabled:opacity-50"
          >
             {processing ? "Processing..." : "Pay now"}
          </button>

          {message && <p className="text-center text-sm font-bold text-slate-600">{message}</p>}

          <footer className="pt-8 border-t flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-blue-600 uppercase tracking-widest font-black">
             <Link href="/refund-policy" className="hover:underline">Refund policy</Link>
             <Link href="/privacy-policy" className="hover:underline">Privacy policy</Link>
             <Link href="/terms-of-service" className="hover:underline">Terms of service</Link>
          </footer>
          </div>
        </div>

        {/* Right Column: Order Summary (Sidebar) */}
        <aside className="hidden md:block bg-[#FAFAFA] border-l border-slate-200 p-8 md:p-12 sticky top-0 h-screen overflow-y-auto">
           <div className="max-w-[400px]">
             <OrderSummary 
                cart={cart} total={total} discount={discount} appliedCoupon={appliedCoupon} 
                appliedDiscount={discount} couponCode={couponCode} setCouponCode={setCouponCode} applyCoupon={applyCoupon}
                promotion={promotion} progressPercent={progressPercent} nextTier={nextTier} addToCart={addToCart}
             />
           </div>
        </aside>
      </main>
    </div>
  );
}

// ✅ Reusable Order Summary Component for Desktop/Mobile
function OrderSummary({ 
   cart, total, discount, appliedCoupon, couponCode, setCouponCode, applyCoupon,
   promotion, progressPercent, nextTier, addToCart
}: any) {
  const isAlreadyAdded = (slug: string) => cart.some((item: any) => (item.slug === slug || item._id === slug) && item.price === 1);

  return (
    <>
       {/* Bonus & Perks */}
       <div className="space-y-4 mb-8">
          {nextTier && (
             <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                   <p className="text-[10px] font-black text-[#61498C] uppercase tracking-widest leading-none">Redemption Progress</p>
                   {total >= nextTier.target && <span className="text-[8px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-black">UNLOCKED!</span>}
                </div>
                <div className="flex justify-between mb-1.5">
                   <p className="text-[9px] text-slate-500">Shop for ₹{nextTier.target - total} more for ₹{nextTier.off} off</p>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-[#61498C] transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                </div>
             </div>
          )}

          {promotion?.bonusItems?.filter((b: any) => total >= b.threshold && !isAlreadyAdded(b.slug)).map((item: any) => (
             <div key={item.slug} className="bg-gradient-to-r from-purple-600 to-pink-600 p-2.5 rounded-xl text-white flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                   <span className="text-base animate-pulse">🎁</span>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-tight leading-none mb-1 opacity-80">Bonus Item Unlocked!</span>
                      <span className="text-[11px] font-bold leading-none">{item.label}</span>
                   </div>
                </div>
                <button 
                  onClick={() => addToCart({ ...item, price: 1 }, 1)}
                  className="bg-white text-purple-600 text-[9px] font-black px-3 py-1.5 rounded-lg hover:scale-105 transition-transform"
                >
                  ADD AT ₹1
                </button>
             </div>
          ))}
       </div>

       {/* Cart Items */}
       <div className="space-y-5 mb-8">
          {cart.map((item: any) => (
             <div key={item.id || item._id} className="flex items-center gap-4">
                <div className="relative w-16 h-16 bg-white rounded-lg border flex-shrink-0">
                   <Image src={item.images?.[0] || "/images/placeholder.png"} alt={item.name} fill className="object-cover rounded-lg" />
                   <div className="absolute -top-2 -right-2 bg-[#717171] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {item.quantity}
                   </div>
                </div>
                <div className="flex-1 min-w-0">
                   <h3 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">{item.name}</h3>
                </div>
                <div className="text-sm font-bold text-slate-900">
                   ₹{(item.price || 0) * item.quantity}
                </div>
             </div>
          ))}
       </div>

       {/* Discount Code */}
       <div className="flex gap-3 mb-8">
          <input 
             value={couponCode}
             onChange={(e) => setCouponCode(e.target.value)}
             placeholder="Discount code or gift card" 
             className="flex-1 h-12 px-4 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
          />
          <button 
            onClick={applyCoupon}
            className="px-6 h-12 bg-[#E1E1E1] text-[#666] font-bold rounded-md text-sm hover:bg-[#D4D4D4] transition-colors"
          >
            Apply
          </button>
       </div>

       {/* Pricing Breakdown */}
       <div className="space-y-3 text-sm">
          <div className="flex justify-between text-slate-600">
             <span>Subtotal</span>
             <span className="font-bold text-slate-900">₹{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
             <span>Shipping</span>
             <span className="text-xs font-medium text-emerald-600 font-black tracking-widest">FREE</span>
          </div>
          {discount && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Discount ({appliedCoupon?.code})</span>
              <span>-₹{discount.savedAmount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="pt-4 border-t mt-4 flex justify-between items-baseline">
             <h3 className="text-lg font-black text-slate-900 uppercase">Total</h3>
             <div className="flex items-baseline gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-black">INR</span>
                <span className="text-2xl font-black text-slate-900">
                   ₹{(discount ? discount.finalAmount : total).toFixed(2)}
                </span>
             </div>
          </div>
       </div>
    </>
  );
}
