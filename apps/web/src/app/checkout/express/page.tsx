"use client";

import { useEffect, useState, useMemo, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { USER_EVENTS } from "@/context/SharedContext";
import CartProgress from "@/components/CartProgress";
import ExpressOrderSummary from "@/components/ExpressOrderSummary";
import ExpressCrossSell from "@/components/ExpressCrossSell";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];


interface ExpressCartItem {
  _id: string; name: string; price: number; originalPrice?: number;
  images: string[]; slug?: string; quantity: number; availableStock: number;
}

function ExpressCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pid = searchParams.get("pid") || "";
  const couponParam = searchParams.get("coupon") || "";
  const utmSource = searchParams.get("utm_source") || "";
  const utmMedium = searchParams.get("utm_medium") || "";
  const utmCampaign = searchParams.get("utm_campaign") || "";

  // Page state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  // Product data from init API
  const [cart, setCart] = useState<ExpressCartItem[]>([]);
  const [crossSells, setCrossSells] = useState<any[]>([]);
  const [promotion, setPromotion] = useState<any>(null);
  const [couponData, setCouponData] = useState<any>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [expressConfig, setExpressConfig] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Form state
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Tamil Nadu");
  const [pincode, setPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [couponCode, setCouponCode] = useState(couponParam);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");

  // MSG91 Widget State
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [fetchingPincode, setFetchingPincode] = useState(false);

  // Auto-fetch City and State from Pincode
  useEffect(() => {
    if (pincode && pincode.length === 6) {
      const fetchPincodeData = async () => {
        setFetchingPincode(true);
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
          const data = await res.json();
          if (data && data[0] && data[0].Status === "Success") {
            const postOffice = data[0].PostOffice[0];
            if (postOffice) {
              if (postOffice.State) {
                const matchedState = INDIAN_STATES.find(s => s.toLowerCase() === postOffice.State.toLowerCase());
                setState(matchedState || postOffice.State);
              }
              let cityVal = "";
              if (postOffice.Block && postOffice.Block !== "NA") cityVal = postOffice.Block;
              else if (postOffice.District && postOffice.District !== "NA") cityVal = postOffice.District;
              else if (postOffice.Region && postOffice.Region !== "NA") cityVal = postOffice.Region;
              else if (postOffice.Name && postOffice.Name !== "NA") cityVal = postOffice.Name;
              if (cityVal) setCity(cityVal);
              setErrors((prev) => prev.filter(e => e !== 'city' && e !== 'state' && e !== 'pincode'));
            }
          }
        } catch (err) {
          console.error("Failed to fetch pincode details:", err);
        } finally {
          setFetchingPincode(false);
        }
      };
      fetchPincodeData();
    }
  }, [pincode]);
  
  useEffect(() => {
    if (!scriptLoaded) return;
    let checkCount = 0;
    const maxChecks = 10;
    let isInitialized = false;

    const initWidget = () => {
      if (isInitialized) return;
      if (typeof window.initSendOTP === "function") {
        try {
          window.initSendOTP({
            widgetId: process.env.NEXT_PUBLIC_MSG91_WIDGET_ID!,
            tokenAuth: process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH!,
            exposeMethods: true,
            success: () => { isInitialized = true; setWidgetReady(true); },
            failure: (err: any) => console.error("Widget init error:", err),
          });

          const checkMethods = () => {
            checkCount++;
            if (window.sendOtp && window.verifyOtp) {
              isInitialized = true; setWidgetReady(true);
            } else if (checkCount < maxChecks) setTimeout(checkMethods, 500);
          };
          setTimeout(checkMethods, 1000);
        } catch (error) {}
      } else {
        if (checkCount < 3) { checkCount++; setTimeout(initWidget, 1000); }
      }
    };
    setTimeout(initWidget, 500);
  }, [scriptLoaded]);

  // ========================================
  // INIT: Fetch product data on mount
  // ========================================
  useEffect(() => {
    if (!pid) { setError("No product specified. Please use a valid link."); setLoading(false); return; }
    const initExpress = async () => {
      try {
        const params = new URLSearchParams({ productId: pid });
        if (couponParam) params.set("couponCode", couponParam);
        const res = await fetch(`/api/express/init?${params.toString()}`);
        const data = await res.json();
        if (!data.success) { setError(data.error || "Product not found"); setLoading(false); return; }

        setCart([{ ...data.product, quantity: 1, availableStock: data.product.availableStock }]);
        setCrossSells(data.crossSells || []);
        setPromotion(data.promotion);
        setExpressConfig(data.expressConfig);
        setAvailableCoupons(data.availableCoupons || []);
        if (data.expressConfig?.isTimerEnabled) {
          setTimeLeft((data.expressConfig.timerMinutes || 10) * 60);
        }
        if (data.coupon) {
          setCouponData(data.coupon);
          if (data.coupon.valid) setCouponCode(data.coupon.code);
        }
      } catch (err) { setError("Failed to load product. Please try again."); }
      finally { setLoading(false); }
    };
    initExpress();
  }, [pid, couponParam]);

  // ========================================
  // TIMER LOGIC
  // ========================================
  useEffect(() => {
    if (!expressConfig?.isTimerEnabled || timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timerId);
  }, [expressConfig?.isTimerEnabled, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ========================================
  // CART OPERATIONS (local state only)
  // ========================================
  const increaseQty = (id: string) => {
    setCart(prev => prev.map(item => {
      if (item._id !== id) return item;
      if (item.quantity >= item.availableStock) return item;
      return { ...item, quantity: item.quantity + 1 };
    }));
  };

  const decreaseQty = (id: string) => {
    setCart(prev => prev.map(item =>
      item._id === id ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
    ).filter(item => item.quantity > 0));
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(item => item._id !== id));

  const addCrossSell = (product: any) => {
    setCart(prev => {
      const existing = prev.find(p => p._id === product._id);
      if (existing) return prev.map(p => p._id === product._id ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // ========================================
  // COUPON
  // ========================================
  const applyCoupon = async () => {
    if (!couponCode) return;
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode, orderAmount: subtotal, cartItems: cart.map(i => ({ productId: i._id, price: i.price, quantity: i.quantity, name: i.name })), isExpress: true }),
      });
      const data = await res.json();
      if (data.success) {
        setCouponData({ valid: true, code: data.coupon.code, discount: data.discount.amount, type: data.coupon.type, value: data.coupon.value, maxDiscount: data.coupon.maxDiscount, minAmount: data.coupon.minAmount, applicableProducts: data.coupon.applicableProducts });
      } else {
        setCouponData({ valid: false, code: couponCode, error: data.error });
      }
    } catch { setCouponData({ valid: false, code: couponCode, error: "Failed to validate coupon" }); }
  };

  const removeCoupon = () => { setCouponData(null); setCouponCode(""); };

  // ========================================
  // PRICE CALCULATIONS
  // ========================================
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);

  const dynamicCoupon = useMemo(() => {
    if (!couponData?.valid) return { valid: false, discount: 0, error: couponData?.error };

    let applicableAmount = 0;
    const isRestricted = couponData.applicableProducts?.length > 0;

    if (isRestricted) {
      const applicableItems = cart.filter((item: any) =>
        couponData.applicableProducts.some((apId: any) => apId.toString() === item._id.toString())
      );
      if (applicableItems.length === 0) {
        return { valid: false, discount: 0, error: "Not applicable to any products in cart" };
      }
      applicableAmount = applicableItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    } else {
      applicableAmount = subtotal;
    }

    if (applicableAmount < (couponData.minAmount || 0)) {
       return { valid: false, discount: 0, error: `Minimum amount of ₹${couponData.minAmount} required` };
    }

    let discountAmount = 0;
    if (couponData.type === "percentage") {
      discountAmount = Math.round((applicableAmount * couponData.value) / 100);
      if (couponData.maxDiscount && discountAmount > couponData.maxDiscount) {
        discountAmount = couponData.maxDiscount;
      }
    } else if (couponData.type === "fixed") {
      discountAmount = couponData.value;
    }

    return { valid: true, discount: discountAmount, error: null };
  }, [cart, couponData, subtotal]);

  const discount = dynamicCoupon.discount;
  
  const isCodBlocked = useMemo(() => {
    const stateBlocked = promotion?.blockedCodStates?.some((blockedState: string) => blockedState.toLowerCase() === state.toLowerCase()) || false;
    const pincodeBlocked = promotion?.blockedCodPincodes?.includes(pincode) || false;
    return stateBlocked || pincodeBlocked;
  }, [promotion, state, pincode]);

  useEffect(() => {
    if (isCodBlocked && paymentMethod === "cod") {
      setPaymentMethod("razorpay");
    }
  }, [isCodBlocked, paymentMethod]);

  const shippingFee = useMemo(() => {
    if (paymentMethod === "razorpay") return 0;
    const threshold = promotion?.shippingThreshold || 1450;
    return subtotal >= threshold ? 0 : 50;
  }, [paymentMethod, subtotal, promotion]);
  const finalTotal = useMemo(() => Math.max(0, subtotal - discount + shippingFee), [subtotal, discount, shippingFee]);

  // ========================================
  // FORM VALIDATION
  // ========================================
  const validateForm = () => {
    const errs: string[] = [];
    if (!phone || phone.length < 10) errs.push("phone");
    if (!email || !email.includes("@")) errs.push("email");
    if (!firstName) errs.push("firstName");
    if (!lastName) errs.push("lastName");
    if (!address) errs.push("address");
    if (!city) errs.push("city");
    if (!pincode || pincode.length < 5) errs.push("pincode");
    setErrors(errs);
    if (errs.length > 0) { setMessage("Please fill in all required fields."); return false; }
    return true;
  };

  // ========================================
  // PAYMENT HANDLER
  // ========================================
  const handlePayNow = async () => {
    if (!validateForm()) return;
    if (cart.length === 0) { setMessage("Your cart is empty."); return; }

    if (paymentMethod === "cod") {
      if (!window.sendOtp) {
        setMessage("❌ OTP Service not loaded. Please refresh.");
        return;
      }
      setProcessing(true); setMessage("Sending OTP...");
      
      const formattedPhone = "91" + phone;
      window.sendOtp(
        formattedPhone,
        (data: any) => {
          setShowOtpModal(true);
          setMessage("");
          setProcessing(false);
        },
        (error: any) => {
          setMessage(`❌ ${error.message || "Failed to send OTP"}`);
          setProcessing(false);
        }
      );
      return;
    }

    await submitOrder();
  };

  const submitOrder = async (accessToken?: string) => {
    setProcessing(true); 
    if (!accessToken) setMessage("Processing your order...");
    else { setOtpError(""); setMessage("Verifying & placing order..."); }

    try {
      const payload = {
        items: cart.map(i => ({ productId: i._id, quantity: i.quantity })),
        customer: { phone, email, name: `${firstName} ${lastName}`.trim(), address, city, state, pincode },
        paymentMethod,
        ...(couponData?.valid && { couponCode: couponData.code }),
        ...(accessToken && { accessToken }),
        utm: { source: utmSource || undefined, medium: utmMedium || undefined, campaign: utmCampaign || undefined },
      };

      const res = await fetch("/api/express/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.details || "Order creation failed");

      if (paymentMethod === "cod") {
        setShowOtpModal(false);
        window.dispatchEvent(new Event(USER_EVENTS.LOGIN));
        router.push(`/checkout/express/thank-you?orderId=${data.order.orderId}&method=cod`);
        return;
      }

      // Razorpay flow
      const options = {
        key: data.razorpay.key, amount: data.razorpay.amount, currency: "INR",
        name: "Swago Jr", description: `Order ${data.order.orderId}`, order_id: data.razorpay.orderId,
        handler: async (response: any) => {
          setMessage("Verifying payment...");
          try {
            const verifyRes = await fetch("/api/express/verify", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ razorpay_payment_id: response.razorpay_payment_id, razorpay_order_id: response.razorpay_order_id, razorpay_signature: response.razorpay_signature, orderId: data.order.orderId }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              window.dispatchEvent(new Event(USER_EVENTS.LOGIN));
              router.push(`/checkout/express/thank-you?orderId=${verifyData.orderId}&method=razorpay`);
            } else { setMessage("Payment verification failed. Please contact support."); setProcessing(false); }
          } catch { setMessage("Verification error. Your payment is safe — please contact support."); setProcessing(false); }
        },
        prefill: { name: `${firstName} ${lastName}`, email, contact: phone },
        theme: { color: "#7c5dfa" },
        modal: { ondismiss: () => { setMessage("Payment cancelled."); setProcessing(false); } },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", () => { setMessage("Payment failed. Please try again."); setProcessing(false); });
      rzp.open();
    } catch (err: any) { 
        if (accessToken) setOtpError(err.message);
        else setMessage(`❌ ${err.message}`); 
        setProcessing(false); 
    }
  };

  const verifyOtpAndSubmit = async () => {
    if (!otpValue || otpValue.length < 6) { setOtpError("Please enter a valid 6-digit OTP"); return; }
    
    setProcessing(true);
    setOtpError("");
    setMessage("Verifying OTP...");

    if (!window.verifyOtp) {
      setOtpError("OTP Service not loaded. Please refresh.");
      setProcessing(false);
      return;
    }

    window.verifyOtp(
      otpValue,
      async (data: any) => {
        const accessToken = data.message || data.token || data.access_token;
        if (!accessToken) { setOtpError("Verification failed."); setProcessing(false); return; }
        await submitOrder(accessToken);
      },
      (error: any) => {
        setOtpError(error.message || "Invalid OTP");
        setProcessing(false);
      }
    );
  };

  const cartProductIds = cart.map(i => i._id.toString());
  const inputClass = (field: string) => `w-full h-10 px-3 bg-[#f8fafc] border ${errors.includes(field) ? "border-red-500 ring-1 ring-red-500" : "border-[#e2e8f0]"} rounded-xl text-[13px] font-medium text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--swago-purple))] transition shadow-inner`;

  // ========================================
  // LOADING / ERROR STATES
  // ========================================
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[hsl(var(--swago-purple))] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Loading checkout...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="text-center max-w-sm space-y-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900">{error}</h1>
        <Link href="/products" className="inline-block px-6 py-2.5 bg-[hsl(var(--swago-purple))] text-white font-bold rounded-lg text-sm">Browse Products</Link>
      </div>
    </div>
  );

  if (cart.length === 0) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center"><h1 className="text-xl font-bold mb-4">No items in cart</h1><Link href="/products" className="text-[hsl(var(--swago-purple))] hover:underline font-bold">Browse Products</Link></div>
    </div>
  );

  // ========================================
  // RENDER
  // ========================================
  const couponSection = (
    <div className="space-y-2">
      {couponData?.valid ? (
        <div className="flex items-center justify-between bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl px-4 py-3">
          <div>
            <p className="text-[13px] font-black text-[#10b981]">{couponData.code}</p>
            {dynamicCoupon.valid ? (
              <p className="text-[11px] font-bold text-[#10b981]/80">−₹{dynamicCoupon.discount} off</p>
            ) : (
              <p className="text-[11px] font-bold text-[#ef4444]">{dynamicCoupon.error}</p>
            )}
          </div>
          <button onClick={removeCoupon} className="text-[10px] font-bold text-[#ef4444] hover:text-[#dc2626] uppercase tracking-widest">Remove</button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Discount code" className="flex-1 h-11 px-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[13px] font-medium text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--swago-purple))] transition shadow-inner" />
            <button onClick={applyCoupon} disabled={!couponCode} className="px-5 h-11 bg-[#f8fafc] border border-[#e2e8f0] hover:bg-[#e2e8f0] text-[#64748b] font-bold rounded-xl text-[13px] transition-colors disabled:opacity-50 shadow-sm">Apply</button>
          </div>
          <button onClick={() => setShowCouponModal(true)} className="text-[11px] font-bold text-[hsl(var(--swago-purple))] hover:underline flex items-center gap-1 w-full justify-center py-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            View all available offers
          </button>
        </div>
      )}
      {couponData && !couponData.valid && couponData.error && (
        <p className="text-[10px] text-[#ef4444] font-bold">{couponData.error}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-[#0f172a] relative">
      {processing && (
        <div className="fixed inset-0 z-[100] bg-white/40 backdrop-blur-[1px] cursor-not-allowed" />
      )}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Script src="https://verify.msg91.com/otp-provider.js" onLoad={() => setScriptLoaded(true)} />

      {/* Top Banner (Timer or Static text) */}
      <div className="bg-[hsl(var(--swago-purple))] py-2.5 text-center px-4">
        {expressConfig?.isTimerEnabled && timeLeft > 0 ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-white text-[10px] sm:text-xs font-[1000] tracking-widest uppercase">
              {expressConfig.timerText || "🔥 FLASH SALE ENDS IN"}
            </span>
            <span className="bg-white text-[hsl(var(--swago-purple))] px-2 py-0.5 rounded text-xs font-black tabular-nums tracking-widest">
              {formatTime(timeLeft)}
            </span>
          </div>
        ) : (
          <p className="text-white text-[10px] font-[1000] tracking-widest uppercase">
            {expressConfig?.timerText || "⚡ EXPRESS CHECKOUT — FREE SHIPPING ON ONLINE ORDERS"}
          </p>
        )}
      </div>

      {/* Main Grid */}
      <main className="flex-1 w-full grid grid-cols-1 md:grid-cols-[1fr_420px] lg:grid-cols-[1fr_480px]">
        {/* LEFT: Form */}
        <div className="flex justify-center bg-transparent">
          <div className="w-full max-w-[600px] p-4 md:p-8 space-y-4">
            <div className="bg-white rounded-2xl transition-all duration-300 space-y-4">

              {/* Mobile: Order Flow Top Sections */}
              <div className="md:hidden space-y-4 pb-2 border-b border-[#e2e8f0]/80">
                <section>
                  <h2 className="text-[11px] font-bold text-[#64748b] mb-3 uppercase tracking-tight">Your Order</h2>
                  <ExpressOrderSummary items={cart} subtotal={subtotal} discount={discount} couponCode={dynamicCoupon.valid ? couponData.code : null} shippingFee={shippingFee} total={finalTotal} onIncreaseQty={increaseQty} onDecreaseQty={decreaseQty} onRemoveItem={removeItem} paymentMethod={paymentMethod} hideBreakdown={true} />
                </section>

                {crossSells.length > 0 && (
                  <section>
                    <ExpressCrossSell products={crossSells} onAddProduct={addCrossSell} cartProductIds={cartProductIds} />
                  </section>
                )}

                <section>
                  <h2 className="text-[11px] font-bold text-[#64748b] mb-2 uppercase tracking-tight">Promotions</h2>
                  {couponSection}
                </section>
              </div>

              {/* Contact */}
              <section>
                <h2 className="text-[11px] font-bold text-[#64748b] mb-3 uppercase tracking-tight">Contact Information</h2>
                <div className="space-y-2">
                  <div>
                    <input value={phone} onChange={e => { setPhone(e.target.value); setErrors(p => p.filter(f => f !== "phone")); setMessage(""); }} placeholder="Phone number" autoComplete="tel" className={inputClass("phone")} />
                    {errors.includes("phone") && <p className="text-[10px] text-red-500 font-bold mt-1">Phone number is required</p>}
                  </div>
                  <div>
                    <input value={email} onChange={e => { setEmail(e.target.value); setErrors(p => p.filter(f => f !== "email")); setMessage(""); }} placeholder="Email address" type="email" autoComplete="email" className={inputClass("email")} />
                    {errors.includes("email") && <p className="text-[10px] text-red-500 font-bold mt-1">Email is required</p>}
                  </div>
                </div>
              </section>

              {/* Delivery */}
              <section>
                <h2 className="text-[11px] font-bold text-[#64748b] mb-3 uppercase tracking-tight">Delivery Address</h2>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input value={firstName} onChange={e => { setFirstName(e.target.value); setErrors(p => p.filter(f => f !== "firstName")); setMessage(""); }} placeholder="First name" autoComplete="given-name" className={inputClass("firstName")} />
                      {errors.includes("firstName") && <p className="text-[10px] text-red-500 font-bold mt-1">Required</p>}
                    </div>
                    <div>
                      <input value={lastName} onChange={e => { setLastName(e.target.value); setErrors(p => p.filter(f => f !== "lastName")); setMessage(""); }} placeholder="Last name" autoComplete="family-name" className={inputClass("lastName")} />
                      {errors.includes("lastName") && <p className="text-[10px] text-red-500 font-bold mt-1">Required</p>}
                    </div>
                  </div>
                  <div>
                    <input value={address} onChange={e => { setAddress(e.target.value); setErrors(p => p.filter(f => f !== "address")); setMessage(""); }} placeholder="Address" autoComplete="street-address" className={inputClass("address")} />
                    {errors.includes("address") && <p className="text-[10px] text-red-500 font-bold mt-1">Required</p>}
                  </div>
                  <div className="relative">
                    <input value={pincode} maxLength={6} onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 6); setPincode(val); setErrors(p => p.filter(f => f !== "pincode")); setMessage(""); }} placeholder="PIN code" autoComplete="postal-code" className={`${inputClass("pincode")} ${fetchingPincode ? 'pr-10' : ''}`} />
                    {fetchingPincode && (
                      <div className="absolute right-3 top-[20px] -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-[hsl(var(--swago-purple))] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {errors.includes("pincode") && <p className="text-[10px] text-red-500 font-bold mt-1">Required</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input value={city} onChange={e => { setCity(e.target.value); setErrors(p => p.filter(f => f !== "city")); setMessage(""); }} placeholder="City" autoComplete="address-level2" className={inputClass("city")} />
                      {errors.includes("city") && <p className="text-[10px] text-red-500 font-bold mt-1">Required</p>}
                    </div>
                    <select value={state} onChange={e => setState(e.target.value)} disabled={true} autoComplete="address-level1" className="w-full h-10 px-3 border rounded-xl text-[13px] font-medium focus:outline-none transition shadow-inner appearance-none bg-slate-100 opacity-70 cursor-not-allowed border-[#e2e8f0] text-slate-500">
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="space-y-3">
                <div>
                  <h2 className="text-[11px] font-bold text-[#64748b] uppercase tracking-tight">Payment Method</h2>
                  <p className="text-[10px] text-[#94a3b8] mt-0.5 tracking-widest font-bold">ALL TRANSACTIONS ARE SECURE AND ENCRYPTED</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod("razorpay")}
                    className={`relative p-3 rounded-2xl border text-left transition-all duration-200 flex items-center gap-3 ${paymentMethod === "razorpay"
                        ? 'bg-[hsl(var(--swago-purple))]/10 border-[hsl(var(--swago-purple))] ring-1 ring-[hsl(var(--swago-purple))]/20'
                        : 'bg-[#f8fafc] border-[#e2e8f0]'
                      }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${paymentMethod === "razorpay" ? "border-[hsl(var(--swago-purple))]" : "border-[#e2e8f0]"}`}>
                      {paymentMethod === "razorpay" && <div className="w-2 h-2 bg-[hsl(var(--swago-purple))] rounded-full" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] sm:text-[13px] font-bold text-[#475569] leading-tight">Online Payment</span>
                      <span className="text-[9px] sm:text-[10px] font-medium text-[#64748b] mt-0.5">UPI/Cards/Wallets</span>
                    </div>
                  </button>
                  <button
                    onClick={() => !isCodBlocked && setPaymentMethod("cod")}
                    disabled={isCodBlocked}
                    className={`relative p-3 rounded-2xl border text-left transition-all duration-200 flex items-center gap-3 ${isCodBlocked
                        ? 'bg-[#f8fafc] border-[#e2e8f0] opacity-60 cursor-not-allowed'
                        : paymentMethod === "cod"
                          ? 'bg-[hsl(var(--swago-purple))]/10 border-[hsl(var(--swago-purple))] ring-1 ring-[hsl(var(--swago-purple))]/20'
                          : 'bg-[#f8fafc] border-[#e2e8f0]'
                      }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${paymentMethod === "cod" && !isCodBlocked ? "border-[hsl(var(--swago-purple))]" : "border-[#e2e8f0]"}`}>
                      {paymentMethod === "cod" && !isCodBlocked && <div className="w-2 h-2 bg-[hsl(var(--swago-purple))] rounded-full" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] sm:text-[13px] font-bold text-[#475569] leading-tight">Cash on Delivery</span>
                      {isCodBlocked && <span className="text-[9px] sm:text-[10px] text-red-500 font-bold mt-1 leading-snug">Not available for your location</span>}
                    </div>
                  </button>
                </div>
              </section>

              {/* Message */}
              {message && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`text-center p-3 rounded-lg text-xs font-bold ${errors.length > 0 ? "bg-red-50 text-red-600 border border-red-100" : "bg-slate-50 text-slate-600 border border-slate-100"}`}>
                  {message}
                </motion.div>
              )}

              {/* Mobile: Order Summary Breakdown */}
              <div className="md:hidden pt-4 border-t border-[#e2e8f0]/80">
                <ExpressOrderSummary items={cart} subtotal={subtotal} discount={discount} couponCode={dynamicCoupon.valid ? couponData.code : null} shippingFee={shippingFee} total={finalTotal} onIncreaseQty={increaseQty} onDecreaseQty={decreaseQty} onRemoveItem={removeItem} paymentMethod={paymentMethod} hideItems={true} />
              </div>

              {/* Pay Button */}
              <button onClick={handlePayNow} disabled={processing}
                className="w-full py-3.5 bg-[hsl(var(--swago-purple))] hover:opacity-90 text-white shadow-sm shadow-[hsl(var(--swago-purple))] hover:shadow-md hover:shadow-[hsl(var(--swago-purple))] text-[13px] font-bold rounded-xl transition flex justify-center items-center tracking-widest disabled:opacity-50">
                {processing ? "PROCESSING..." : paymentMethod === "cod" ? `PLACE ORDER — ₹${finalTotal.toLocaleString()}` : `PAY ₹${finalTotal.toLocaleString()}`}
              </button>

              <footer className="pt-5 border-t border-[#e2e8f0]/80 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] text-[#94a3b8] tracking-widest font-bold">
                <Link href="/refund-policy" className="hover:text-[hsl(var(--swago-purple))] transition-colors">Refund policy</Link>
                <Link href="/privacy-policy" className="hover:text-[hsl(var(--swago-purple))] transition-colors">Privacy policy</Link>
                <Link href="/terms-of-service" className="hover:text-[hsl(var(--swago-purple))] transition-colors">Terms of service</Link>
              </footer>
            </div>
          </div>
        </div>

        {/* RIGHT: Order Summary Sidebar (Desktop) */}
        <aside className="hidden md:block bg-[#ffffff]/40 backdrop-blur-xl border-l border-[#e2e8f0]/80 p-8 md:p-10 sticky top-0 h-screen overflow-y-auto">
          <div className="max-w-[400px] space-y-6">
            {promotion && <CartProgress total={subtotal} promotionData={promotion} />}

            <ExpressOrderSummary items={cart} subtotal={subtotal} discount={discount} couponCode={dynamicCoupon.valid ? couponData.code : null} shippingFee={shippingFee} total={finalTotal} onIncreaseQty={increaseQty} onDecreaseQty={decreaseQty} onRemoveItem={removeItem} paymentMethod={paymentMethod} />

            {/* Coupon Input */}
            {couponSection}

            {/* Cross-Sells */}
            <ExpressCrossSell products={crossSells} onAddProduct={addCrossSell} cartProductIds={cartProductIds} />
          </div>
        </aside>
      </main>

      {/* Coupon Modal */}
      <AnimatePresence>
        {showCouponModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl relative"
            >
              <button onClick={() => setShowCouponModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors rounded-full text-slate-500 font-bold">✕</button>
              <h3 className="text-lg font-black text-[#0f172a] mb-4">Available Offers</h3>
              <div className="space-y-3">
                {availableCoupons.length > 0 ? (
                  availableCoupons.map(c => (
                    <div key={c.code} className="border border-dashed border-[#cbd5e1] rounded-xl p-4 bg-[#f8fafc]">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-black text-[hsl(var(--swago-purple))] text-[13px]">{c.code}</span>
                        <button onClick={() => { setCouponCode(c.code); setShowCouponModal(false); setTimeout(applyCoupon, 100); }} className="text-[10px] uppercase font-bold tracking-widest text-[hsl(var(--swago-purple))] hover:underline">Apply</button>
                      </div>
                      <p className="text-[11px] text-[#64748b] font-medium">{c.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 font-medium">No offers available right now.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OTP Verification Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl relative"
            >
              <button onClick={() => setShowOtpModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors rounded-full text-slate-500 font-bold">✕</button>
              <h3 className="text-xl font-black text-[#0f172a] mb-2 text-center">Verify Your Number</h3>
              <p className="text-sm text-slate-500 font-medium mb-6 text-center">
                We sent a 6-digit code to <br/><span className="text-slate-800 font-bold">{phone}</span>
              </p>
              
              {otpError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold text-center">
                  {otpError}
                </div>
              )}
              
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={otpValue} 
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" 
                  disabled={processing}
                  className="w-full h-14 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-center text-2xl font-mono tracking-[0.5em] text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--swago-purple))] transition shadow-inner disabled:opacity-50" 
                />
                <button 
                  onClick={verifyOtpAndSubmit} 
                  disabled={processing || otpValue.length !== 6}
                  className="w-full py-4 bg-[hsl(var(--swago-purple))] hover:opacity-90 text-white shadow-sm shadow-[hsl(var(--swago-purple))] hover:shadow-md hover:shadow-[hsl(var(--swago-purple))] text-sm font-bold rounded-xl transition flex justify-center items-center tracking-widest disabled:opacity-50"
                >
                  {processing ? "VERIFYING..." : "VERIFY & PLACE ORDER"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ExpressCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-[hsl(var(--swago-purple))] border-t-transparent rounded-full animate-spin" /></div>}>
      <ExpressCheckoutContent />
    </Suspense>
  );
}
