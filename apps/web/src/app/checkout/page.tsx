"use client";

import { useEffect, useState, useMemo } from "react";
import { useSharedContext, type CartItem, type Product, type CartPriceChange } from "@/context/SharedContext";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RiInformationLine, RiSearchLine, RiShoppingBag3Line } from "react-icons/ri";
import CartProgress from "@/components/CartProgress";

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
  const { cart, total, user, isLoadingUser, clearCart, addToCart, appliedCoupon, setAppliedCoupon, appliedSwagoMoney, refreshCartPrices, isRefreshingCart } = useSharedContext();
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
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code || "");
  const [age, setAge] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [priceChangeModal, setPriceChangeModal] = useState<CartPriceChange[] | null>(null);

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

  // Refresh cart prices on checkout page mount
  useEffect(() => {
    refreshCartPrices();
  }, []);

  const validateForm = () => {
    const newErrors: string[] = [];
    if (!email) newErrors.push("email");
    if (!firstName) newErrors.push("firstName");
    if (!lastName) newErrors.push("lastName");
    if (!address) newErrors.push("address");
    if (!city) newErrors.push("city");
    if (!pincode) newErrors.push("pincode");
    if (!phone) newErrors.push("phone");
    if (!age) newErrors.push("age");

    setErrors(newErrors);
    if (newErrors.length > 0) {
      const missingFields = [];
      if (newErrors.includes("email")) missingFields.push("Email");
      if (newErrors.includes("firstName") || newErrors.includes("lastName")) missingFields.push("Full Name");
      if (newErrors.includes("address") || newErrors.includes("city") || newErrors.includes("pincode")) missingFields.push("Complete Address");
      if (newErrors.includes("phone")) missingFields.push("Phone Number");
      if (newErrors.includes("age")) missingFields.push("Child's Age");
      
      setMessage(`Almost there! Please provide: ${missingFields.join(", ")}`);
      return false;
    }
    return true;
  };

  const handlePayNow = async () => {
    if (!validateForm()) return;

    // ✅ CRITICAL: Re-validate cart prices right before payment
    // Force bypass the debounce for this critical check
    try {
      const requestItems = cart.map(item => ({
        productId: item.productId?.toString() || item._id?.toString() || item.id?.toString() || '',
        quantity: item.quantity,
        price: item.price,
        name: item.name,
      }));

      const res = await fetch('/api/cart/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: requestItems }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.hasChanges && (data.changes?.length > 0 || data.removedItems?.length > 0)) {
          // Prices changed — block payment and show modal
          setPriceChangeModal(data.changes || []);
          // Still apply the updates to the cart silently
          refreshCartPrices();
          return;
        }
      }
    } catch (error) {
      console.error('Pre-payment price check failed:', error);
      // If the check fails, still allow payment (backend will catch discrepancies)
    }

    if (paymentMethod === 'cod') {
      await handleCOD();
    } else {
      await handleOnlinePayment();
    }
  };

  const handleOnlinePayment = async () => {
    setProcessing(true);
    setMessage("Processing your order...");
    const finalAmount = finalTotal;

    try {
      // Create Razorpay Order
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: finalAmount,
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
            coupon: appliedCoupon,
            finalAmount: finalAmount,
            swagoMoneyRedeemed: appliedSwagoMoney || 0
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
        theme: { color: "#7c5dfa" }
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
    const finalAmount = finalTotal;

    try {
      const res = await fetch("/api/payment/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: finalAmount,
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
            coupon: appliedCoupon,
            finalAmount: finalAmount,
            swagoMoneyRedeemed: appliedSwagoMoney || 0
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
        setAppliedCoupon({ code: data.coupon.code, discount: data.discount.amount });
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

  const shippingFee = useMemo(() => {
    if (paymentMethod === 'razorpay') return 0;
    const threshold = promotion?.shippingThreshold || 1450;
    return total >= threshold ? 0 : 50;
  }, [paymentMethod, total, promotion]);

  const finalTotal = useMemo(() => {
    const discountedTotal = appliedCoupon ? total - appliedCoupon.discount : total;
    return (discountedTotal - (appliedSwagoMoney || 0)) + shippingFee;
  }, [total, appliedCoupon, appliedSwagoMoney, shippingFee]);

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
          <Link href="/products" className="text-[hsl(var(--swago-purple))] hover:underline">Go back to products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="bg-[hsl(var(--swago-purple))] py-3 text-center">
        <p className="text-white text-[10px] font-[1000] tracking-widest leading-tight">
          Enjoy Free Shipping, on orders above ₹1450
        </p>
      </div>


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
            ₹{finalTotal.toFixed(0)}
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
                cart={cart} total={total} appliedCoupon={appliedCoupon}
                couponCode={couponCode} setCouponCode={setCouponCode} applyCoupon={applyCoupon}
                promotion={promotion} progressPercent={progressPercent} nextTier={nextTier} addToCart={addToCart}
                appliedSwagoMoney={appliedSwagoMoney}
                paymentMethod={paymentMethod}
                finalTotal={finalTotal}
                shippingFee={shippingFee}
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
                {!user && <Link href="/login" className="text-xs text-[hsl(var(--swago-purple))] hover:underline">Log in</Link>}
              </div>
              <div className="space-y-4">
                <input
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.includes("email")) { setErrors(errors.filter(f => f !== "email")); setMessage(""); } }}
                  placeholder="Email or mobile phone number"
                  className={`w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-[hsl(var(--swago-purple))] outline-none text-sm transition-all shadow-sm ${errors.includes("email") ? 'border-red-500 bg-red-50 placeholder-red-300' : 'border-slate-200'}`}
                />
                {errors.includes("email") && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">Email is needed</p>}
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded-md border-slate-300 text-[hsl(var(--swago-purple))] focus:ring-[hsl(var(--swago-purple))]" />
                  <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">Email me with news and offers</span>
                </label>
              </div>
            </section>

            {/* Delivery Section */}
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Delivery</h2>
              <div className="space-y-3">
                <select className="w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-[hsl(var(--swago-purple))] outline-none text-sm bg-slate-50 shadow-sm appearance-none">
                  <option>India</option>
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <input
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => { setFirstName(e.target.value); if (errors.includes("firstName")) { setErrors(errors.filter(f => f !== "firstName")); setMessage(""); } }}
                      className={`w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-[hsl(var(--swago-purple))] outline-none text-sm shadow-sm ${errors.includes("firstName") ? 'border-red-500 bg-red-50 placeholder-red-300' : 'border-slate-200'}`}
                    />
                    {errors.includes("firstName") && <p className="text-[10px] text-red-500 font-bold">First name is needed</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <input
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => { setLastName(e.target.value); if (errors.includes("lastName")) { setErrors(errors.filter(f => f !== "lastName")); setMessage(""); } }}
                      className={`w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-[hsl(var(--swago-purple))] outline-none text-sm shadow-sm ${errors.includes("lastName") ? 'border-red-500 bg-red-50 placeholder-red-300' : 'border-slate-200'}`}
                    />
                    {errors.includes("lastName") && <p className="text-[10px] text-red-500 font-bold">Last name is needed</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <select
                    value={age}
                    onChange={(e) => { setAge(e.target.value); if (errors.includes("age")) { setErrors(errors.filter(f => f !== "age")); setMessage(""); } }}
                    className={`w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-[hsl(var(--swago-purple))] outline-none text-sm bg-white shadow-sm appearance-none ${errors.includes("age") ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200'}`}
                  >
                    <option value="" disabled>Child's Age</option>
                    {[...Array(9)].map((_, i) => (
                      <option key={i + 6} value={i + 6}>{i + 6} Years</option>
                    ))}
                  </select>
                  {errors.includes("age") && <p className="text-[10px] text-red-500 font-bold">Child's age is needed</p>}
                </div>

                <div className="relative flex flex-col gap-1">
                  <input
                    placeholder="Address"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); if (errors.includes("address")) { setErrors(errors.filter(f => f !== "address")); setMessage(""); } }}
                    className={`w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-[hsl(var(--swago-purple))] outline-none text-sm shadow-sm pr-10 ${errors.includes("address") ? 'border-red-500 bg-red-50 placeholder-red-300' : 'border-slate-200'}`}
                  />
                  <RiSearchLine className="absolute right-4 top-[24px] -translate-y-1/2 text-slate-400" />
                  {errors.includes("address") && <p className="text-[10px] text-red-500 font-bold">Address is needed</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <input
                      placeholder="City"
                      value={city}
                      onChange={(e) => { setCity(e.target.value); if (errors.includes("city")) { setErrors(errors.filter(f => f !== "city")); setMessage(""); } }}
                      className={`w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-[hsl(var(--swago-purple))] outline-none text-sm shadow-sm ${errors.includes("city") ? 'border-red-500 bg-red-50 placeholder-red-300' : 'border-slate-200'}`}
                    />
                    {errors.includes("city") && <p className="text-[10px] text-red-500 font-bold">City is needed</p>}
                  </div>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full h-12 px-4 border rounded-md border-slate-200 focus:ring-1 focus:ring-[hsl(var(--swago-purple))] outline-none text-sm bg-white shadow-sm"
                  >
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="flex flex-col gap-1">
                    <input
                      placeholder="PIN code"
                      value={pincode}
                      onChange={(e) => { setPincode(e.target.value); if (errors.includes("pincode")) { setErrors(errors.filter(f => f !== "pincode")); setMessage(""); } }}
                      className={`w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-[hsl(var(--swago-purple))] outline-none text-sm shadow-sm ${errors.includes("pincode") ? 'border-red-500 bg-red-50 placeholder-red-300' : 'border-slate-200'}`}
                    />
                    {errors.includes("pincode") && <p className="text-[10px] text-red-500 font-bold">PIN code is needed</p>}
                  </div>
                </div>

                <div className="relative flex flex-col gap-1">
                  <input
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); if (errors.includes("phone")) { setErrors(errors.filter(f => f !== "phone")); setMessage(""); } }}
                    className={`w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-[hsl(var(--swago-purple))] outline-none text-sm shadow-sm pr-10 ${errors.includes("phone") ? 'border-red-500 bg-red-50 placeholder-red-300' : 'border-slate-200'}`}
                  />
                  <RiInformationLine className="absolute right-4 top-[24px] -translate-y-1/2 text-slate-400 cursor-help" />
                  {errors.includes("phone") && <p className="text-[10px] text-red-500 font-bold">Phone number is needed</p>}
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-md border-slate-300 text-[hsl(var(--swago-purple))] focus:ring-[hsl(var(--swago-purple))]" />
                    <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">Save this information for next time</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-md border-slate-300 text-[hsl(var(--swago-purple))] focus:ring-[hsl(var(--swago-purple))]" />
                    <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">Text me with news and offers</span>
                  </label>
                </div>
              </div>
            </section>

            {/* Shipping Method Section */}
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Shipping method</h2>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                   <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Online Payment</p>
                   <p className="text-xs font-black text-emerald-600">ALWAYS FREE</p>
                </div>
                <div className="flex justify-between items-center">
                   <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Cash on Delivery</p>
                   <p className="text-xs font-black text-slate-500">FREE ABOVE ₹1450 (ELSE ₹50)</p>
                </div>
              </div>
            </section>

            {/* Payment Section */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 leading-none">Payment</h2>
                <p className="text-[10px] text-slate-400 mt-1 tracking-widest font-bold">All transactions are secure and encrypted.</p>
              </div>

              <div className="border rounded-lg overflow-hidden border-slate-200">
                {/* Razorpay Option */}
                <div className={`p-4 flex items-start gap-4 cursor-pointer transition-colors ${paymentMethod === 'razorpay' ? 'bg-[hsl(var(--swago-purple))/0.1]' : 'bg-white hover:bg-slate-50'}`} onClick={() => setPaymentMethod('razorpay')}>
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition-all ${paymentMethod === 'razorpay' ? 'border-[hsl(var(--swago-purple))]' : 'border-slate-300'}`}>
                    {paymentMethod === 'razorpay' && <div className="w-2.5 h-2.5 bg-[hsl(var(--swago-purple))] rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-slate-900">Online Payment</span>
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
                <div className={`p-4 border-t flex items-start gap-4 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'bg-[hsl(var(--swago-purple))/0.1]' : 'bg-white hover:bg-slate-50'}`} onClick={() => setPaymentMethod('cod')}>
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition-all ${paymentMethod === 'cod' ? 'border-[hsl(var(--swago-purple))]' : 'border-slate-300'}`}>
                    {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-[hsl(var(--swago-purple))] rounded-full" />}
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
                <div className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${billingAddressType === 'same' ? 'bg-[hsl(var(--swago-purple))/0.1]' : 'bg-white hover:bg-slate-50'}`} onClick={() => setBillingAddressType('same')}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${billingAddressType === 'same' ? 'border-[hsl(var(--swago-purple))]' : 'border-slate-300'}`}>
                    {billingAddressType === 'same' && <div className="w-2.5 h-2.5 bg-[hsl(var(--swago-purple))] rounded-full" />}
                  </div>
                  <span className="text-sm font-bold text-slate-900">Same as shipping address</span>
                </div>
                <div className={`p-4 border-t flex items-center gap-4 cursor-pointer transition-colors ${billingAddressType === 'different' ? 'bg-[hsl(var(--swago-purple))/0.1]' : 'bg-white hover:bg-slate-50'}`} onClick={() => setBillingAddressType('different')}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${billingAddressType === 'different' ? 'border-[hsl(var(--swago-purple))]' : 'border-slate-300'}`}>
                    {billingAddressType === 'different' && <div className="w-2.5 h-2.5 bg-[hsl(var(--swago-purple))] rounded-full" />}
                  </div>
                  <span className="text-sm font-bold text-slate-900">Use a different billing address</span>
                </div>
              </div>
            </section>

            {message && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-center p-3 rounded-lg text-xs font-bold mb-4 ${errors.length > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}
              >
                {message}
              </motion.div>
            )}

            <button
              onClick={handlePayNow}
              disabled={processing}
              className="w-full h-14 btn-shine bg-[hsl(var(--swago-purple))] hover:brightness-110 text-white font-black rounded-lg text-lg tracking-widest shadow-xl shadow-[hsl(var(--swago-purple))/0.2] transition-all transform active:scale-95 disabled:opacity-50"
            >
              {processing ? "Processing..." : "Pay now"}
            </button>

            <footer className="pt-8 border-t flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-[hsl(var(--swago-purple))] tracking-widest font-black">
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
              cart={cart} total={total} appliedCoupon={appliedCoupon}
              couponCode={couponCode} setCouponCode={setCouponCode} applyCoupon={applyCoupon}
              promotion={promotion} progressPercent={progressPercent} nextTier={nextTier} addToCart={addToCart}
              appliedSwagoMoney={appliedSwagoMoney}
              paymentMethod={paymentMethod}
              finalTotal={finalTotal}
              shippingFee={shippingFee}
            />
          </div>
        </aside>
      </main>
      {/* Price Change Blocking Modal */}
      {priceChangeModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2.5 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-amber-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Prices Updated</h3>
                <p className="text-xs text-slate-500 font-medium">Please review before proceeding</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
              {priceChangeModal.filter(c => c.field === 'price').map((change, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700 truncate flex-1 mr-4">{change.productName}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-slate-400 line-through text-xs">₹{change.oldValue}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-slate-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                    <span className="font-black text-slate-900">₹{change.newValue}</span>
                  </div>
                </div>
              ))}
              {priceChangeModal.filter(c => c.field === 'stock').map((change, i) => (
                <div key={`stock-${i}`} className="text-xs text-rose-600 font-bold">
                  {change.productName}: {Number(change.newValue) === 0 ? 'Out of stock' : `Only ${change.newValue} available`}
                </div>
              ))}
              {priceChangeModal.filter(c => c.field !== 'price' && c.field !== 'stock').map((change, i) => (
                <div key={`other-${i}`} className="text-xs text-slate-500 font-medium">
                  {change.productName}: {change.field} updated
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Your cart has been updated with the latest pricing. Please review the updated total before placing your order.
            </p>

            <button
              onClick={() => setPriceChangeModal(null)}
              className="w-full bg-[hsl(var(--swago-purple))] text-white font-black py-3.5 rounded-xl text-sm tracking-widest hover:opacity-90 transition-opacity"
            >
              I understand, continue
            </button>
          </div>
        </div>
      )}

      {isRefreshingCart && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-[hsl(var(--swago-purple))] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-600 tracking-wide">Verifying latest prices...</span>
        </div>
      )}
    </div>
  );
}

// ✅ Reusable Order Summary Component for Desktop/Mobile
function OrderSummary({
  cart, total, appliedCoupon, couponCode, setCouponCode, applyCoupon,
  promotion, progressPercent, nextTier, addToCart, appliedSwagoMoney, paymentMethod, finalTotal, shippingFee
}: any) {
  const isAlreadyAdded = (slug: string) => cart.some((item: any) => (item.slug === slug || item._id === slug) && item.price === 1);

  return (
    <>
      <div className="mb-4">
        {/* <CartProgress total={total} promotionData={promotion} /> */}
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

      {/* Pricing Breakdown */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span className="font-bold text-slate-900">₹{total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Shipping {paymentMethod === 'cod' ? '(COD)' : '(Online)'}</span>
          {shippingFee === 0 ? (
            <span className="text-xs font-black text-emerald-600 tracking-widest uppercase">FREE</span>
          ) : (
            <span className="font-bold text-slate-900">₹{shippingFee}</span>
          )}
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-emerald-600 font-bold">
            <span>Discount ({appliedCoupon.code})</span>
            <span>-₹{appliedCoupon.discount.toFixed(2)}</span>
          </div>
        )}

        {appliedSwagoMoney > 0 && (
          <div className="flex justify-between text-[hsl(var(--swago-purple))] font-bold">
            <span>Swago Dollars</span>
            <span>-₹{appliedSwagoMoney.toFixed(2)}</span>
          </div>
        )}

        <div className="pt-4 border-t mt-4 flex justify-between items-baseline">
          <h3 className="text-lg font-black text-slate-900">Total</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-black">INR</span>
            <span className="text-2xl font-black text-slate-900">
              ₹{finalTotal.toFixed(0)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
