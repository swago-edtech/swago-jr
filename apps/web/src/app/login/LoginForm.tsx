"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSharedContext } from "@/context/SharedContext";
import { USER_EVENTS } from "@/context/SharedContext";
import { useCountry } from "@/context/CountryContext";
import Script from "next/script";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { HiLockClosed } from "react-icons/hi";

type AuthMode = "signup" | "signin";

// ✅ Helper to get product ID
const getProductId = (product: { _id?: string; id?: number }): string => {
  return product._id || product.id?.toString() || '';
};

export default function LoginForm() {
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [phone, setPhone] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // ✅ Track client-side mounting
  const router = useRouter();
  const { setUser, cart } = useSharedContext();
  const { country } = useCountry();

  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || searchParams.get("callbackUrl");
  const redirectUrl = rawRedirect?.startsWith('/kids') ? '/profile' : rawRedirect;

  // Demo credentials
  const DEMO_PHONE = "9876543210";
  const DEMO_OTP_HINT = "123456";

  // Widget configuration
  const WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID!;
  const TOKEN_AUTH = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH!;

  const handleWidgetLoad = () => {
    console.log("📱 MSG91 script loaded");
    setScriptLoaded(true);
  };

  // ✅ Track client-side mounting and handle widget conflicts
  useEffect(() => {
    setIsMounted(true);

    // ✅ Check if a different widget type was previously loaded
    const loadedWidgetType = sessionStorage.getItem('msg91_widget_type');

    // If EMAIL widget was loaded and methods exist, we MUST reload to switch to PHONE
    if (loadedWidgetType === 'email' && window.sendOtp) {
      console.log("🔄 EMAIL widget detected, reloading for PHONE widget...");
      sessionStorage.setItem('msg91_widget_type', 'phone');
      window.location.reload();
      return;
    }

    // Mark that we want the PHONE widget
    sessionStorage.setItem('msg91_widget_type', 'phone');

    // If widget is already initialized for PHONE, use it
    if (typeof window.initSendOTP === "function") {
      console.log("🔄 Initializing PHONE widget...");
      try {
        window.initSendOTP({
          widgetId: WIDGET_ID,
          tokenAuth: TOKEN_AUTH,
          exposeMethods: true,
          success: () => {
            console.log("✅ PHONE widget initialized");
            setWidgetReady(true);
            setScriptLoaded(true);
          },
          failure: (error) => {
            console.error("❌ Widget init failed:", error);
          },
        });

        // Method polling
        let checkCount = 0;
        const checkMethods = () => {
          checkCount++;
          if (window.sendOtp && window.verifyOtp) {
            console.log("✅ Widget methods ready");
            setWidgetReady(true);
            setScriptLoaded(true);
          } else if (checkCount < 10) {
            setTimeout(checkMethods, 500);
          }
        };
        setTimeout(checkMethods, 500);
      } catch (error) {
        console.error("❌ Widget error:", error);
      }
    }
  }, [WIDGET_ID, TOKEN_AUTH]);

  // ✅ IMPROVED: Widget initialization with method polling (from ambassador form)
  useEffect(() => {
    if (!scriptLoaded) return;

    let checkCount = 0;
    const maxChecks = 10;
    let isInitialized = false;

    const initWidget = () => {
      if (isInitialized) return;

      console.log("🔄 Attempting widget initialization...");

      if (typeof window.initSendOTP === "function") {
        try {
          window.initSendOTP({
            widgetId: WIDGET_ID,
            tokenAuth: TOKEN_AUTH,
            exposeMethods: true,
            success: (data) => {
              console.log("✅ Widget success callback fired:", data);
              isInitialized = true;
              setWidgetReady(true);
            },
            failure: (error) => {
              console.error("❌ Widget failure callback:", error);
            },
          });

          // ✅ Poll for methods instead of relying solely on callbacks
          const checkMethods = () => {
            checkCount++;
            console.log(`🔍 Checking for sendOtp method... (${checkCount}/${maxChecks})`);

            if (window.sendOtp && window.verifyOtp) {
              console.log("✅ Widget methods detected successfully!");
              isInitialized = true;
              setWidgetReady(true);
            } else if (checkCount < maxChecks) {
              setTimeout(checkMethods, 500);
            } else {
              console.warn("⚠️ Widget methods not found after max checks");
              setWidgetReady(true); // Show form anyway
            }
          };

          setTimeout(checkMethods, 1000);
        } catch (error) {
          console.error("❌ Widget init error:", error);
          setWidgetReady(true); // Show form anyway
        }
      } else {
        console.log("⏳ initSendOTP not available yet...");
        if (checkCount < 3) {
          checkCount++;
          setTimeout(initWidget, 1000);
        } else {
          console.warn("⚠️ initSendOTP never became available");
          setWidgetReady(true); // Show form anyway
        }
      }
    };

    setTimeout(initWidget, 500);
  }, [scriptLoaded, WIDGET_ID, TOKEN_AUTH]);

  // ✅ NEW: Fallback timeout - show form after 8 seconds no matter what
  useEffect(() => {
    if (scriptLoaded && !widgetReady && step === "form") {
      const timeout = setTimeout(() => {
        console.log("⏰ Timeout reached - showing form");
        setWidgetReady(true);
      }, 8000);

      return () => clearTimeout(timeout);
    }
  }, [scriptLoaded, widgetReady, step]);

  const sendOtp = async () => {
    if (!phone) {
      setMessage("❌ Please enter a phone number");
      return;
    }

    if (phone.length < 7 || phone.length > 15) {
      setMessage("❌ Please enter a valid phone number");
      return;
    }

    if (authMode === "signup") {
      if (!name.trim()) {
        setMessage("❌ Please enter your name");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        setMessage("❌ Please enter a valid email");
        return;
      }
    }

    if (phone === DEMO_PHONE) {
      console.log("🎭 Demo mode: Bypassing widget");
      setStep("otp");
      setMessage(`✅ Demo mode: Use OTP ${DEMO_OTP_HINT}`);
      return;
    }

    setLoading(true);
    setMessage("Checking account...");

    try {
      const phonePrefix = country?.phonePrefix || '+91';
      const checkRes = await fetch("/api/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: phonePrefix + phone,
          authMethod: "phone"
        })
      });

      const checkData = await checkRes.json();

      if (!checkData.success) {
        setMessage("❌ Failed to verify account. Please try again.");
        setLoading(false);
        return;
      }

      // ✅ AUTO-SWITCH: Sign Up mode but user exists
      if (authMode === "signup" && checkData.exists) {
        setMessage("✅ Account found! Switching to sign in...");
        setAuthMode("signin");
        setTimeout(() => {
          setMessage("");
          setLoading(false);
        }, 1500);
        return;
      }

      // ✅ AUTO-SWITCH: Sign In mode but user doesn't exist
      if (authMode === "signin" && !checkData.exists) {
        setMessage("📝 New number! Switching to sign up...");
        setAuthMode("signup");
        setTimeout(() => {
          setMessage("");
          setLoading(false);
        }, 1500);
        return;
      }

      if (!window.sendOtp) {
        setMessage("❌ Widget not loaded. Please refresh the page.");
        setLoading(false);
        return;
      }

      setMessage("Sending OTP...");
      const phonePrefixNoPlus = country?.phonePrefix?.replace('+', '') || '91';
      const formattedPhone = phonePrefixNoPlus + phone;

      window.sendOtp(
        formattedPhone,
        (data: any) => {
          console.log("✅ Widget sendOtp success:", data);
          fetch('/api/log-msg91', { method: 'POST', body: JSON.stringify({ status: 'SUCCESS', data }) }).catch(()=>{});
          setStep("otp");
          setLoading(false);
        },
        (error: any) => {
          console.error("❌ Widget sendOtp error:", error);
          fetch('/api/log-msg91', { method: 'POST', body: JSON.stringify({ status: 'ERROR', data: error }) }).catch(()=>{});
          setMessage(`❌ ${error.message || "Failed to send OTP"}`);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("OTP send error:", error);
      setMessage("❌ Failed to send OTP. Please try again.");
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!code) {
      setMessage("❌ Please enter the OTP");
      return;
    }

    if (code.length < 6) {
      setMessage("❌ OTP must be 6 digits");
      return;
    }

    setLoading(true);
    setMessage("Verifying OTP...");

    // ✅ UPDATED: Prepare local cart with FULL product details
    const localCart = cart.map(item => ({
      productId: getProductId(item),
      quantity: item.quantity,
      price: item.price,                                    // ✅ NEW
      name: item.name,                                      // ✅ NEW
      image: item.images?.[0] || '/images/placeholder.png', // ✅ NEW
      addedAt: new Date().toISOString()
    }));

    console.log(`🛒 Sending local cart with ${localCart.length} items`);

    try {
      if (phone === DEMO_PHONE) {
        if (code !== DEMO_OTP_HINT) {
          setMessage(`❌ Invalid demo OTP. Use ${DEMO_OTP_HINT}`);
          setLoading(false);
          return;
        }

        const res = await fetch("/api/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: (country?.phonePrefix || '+91') + phone,
            otp: code,
            isDemo: true
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setUser(data.user);
          setMessage("✅ Login successful!");
          window.dispatchEvent(new CustomEvent(USER_EVENTS.LOGIN));
          setTimeout(() => router.push(redirectUrl || "/"), 500);
        } else {
          setMessage(`❌ ${data.error || "Verification failed"}`);
        }
        setLoading(false);
        return;
      }

      if (!window.verifyOtp) {
        setMessage("❌ Widget not loaded. Please refresh the page.");
        setLoading(false);
        return;
      }

      window.verifyOtp(
        code,
        async (data) => {
          console.log("✅ OTP verified by widget:", data);

          const accessToken = data.message || data.token || data.access_token;
          if (!accessToken) {
            setMessage("❌ Verification failed. No token received.");
            setLoading(false);
            return;
          }

          // ✅ UPDATED: Send local cart with FULL details
          const res = await fetch("/api/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accessToken,
              identifier: (country?.phonePrefix || '+91') + phone,
              authMethod: "phone",
              localCart, // ✅ Now includes price, name, image
              ...(authMode === "signup" && { name, email }),
            }),
          });

          const responseData = await res.json();

          if (res.ok && responseData.success) {
            setUser(responseData.user);
            const successMsg = authMode === "signup"
              ? "✅ Account created successfully!"
              : "✅ Login successful!";
            setMessage(successMsg);
            window.dispatchEvent(new CustomEvent(USER_EVENTS.LOGIN));

            const target = redirectUrl || "/";
            setTimeout(() => router.push(target), 800);
          } else {
            setMessage(`❌ ${responseData.error || "Verification failed"}`);
          }
          setLoading(false);
        },
        (error) => {
          console.error("❌ Widget verifyOtp error:", error);
          setMessage(`❌ ${error.message || "Invalid OTP"}`);
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("OTP verification error:", error);
      setMessage("❌ Verification failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://verify.msg91.com/otp-provider.js"
        onLoad={handleWidgetLoad}
        onError={() => {
          console.error("❌ Failed to load MSG91 widget");
          setMessage("❌ Failed to load verification service");
        }}
      />

      {/* ✅ Loading state - only shows after mounted, before widget is ready */}
      {isMounted && !widgetReady && step === "form" && (
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600 mb-2">Initializing verification service...</p>
          <p className="text-xs text-slate-400">This should only take a few seconds</p>
        </div>
      )}

      {/* ✅ Main form - New Design */}
      {(widgetReady || step === "otp") && (
        <div className="w-full max-w-7xl mx-auto px-4 pt-6 pb-12 flex flex-col md:flex-row items-center justify-center gap-0 md:gap-20 overflow-visible">

          {/* Left Column: Mascot & Speech Bubble (Desktop Only) */}
          <div className="hidden md:flex flex-col items-end relative -mt-20">
            {/* Speech Bubble */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 relative mb-[-40px] mr-[-20px] z-30 max-w-[320px]"
              style={{ borderRadius: '30px 30px 30px 5px' }}
            >
              <h2 className="text-2xl font-black text-slate-800 mb-2">Hi there! 👋</h2>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">
                Let's start your SWAGO journey.
              </p>
              {/* Bubble Tail */}
              <div className="absolute -bottom-4 left-8 w-8 h-8 bg-white border-r border-b border-slate-50 transform rotate-45" />
            </motion.div>

            {/* Mascot Image */}
            <div className="w-[500px] h-[500px] relative z-20 drop-shadow-2xl">
              <Image
                src="/images/blog/swago_mascots.png"
                alt="Swago Mascots"
                fill
                className="object-contain"
                priority
              />
            </div>
            {/* Subtle shadow glow behind mascot */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-12 bg-purple-900/10 blur-3xl rounded-full" />
          </div>

          {/* Right Column: The Login Card */}
          <div className="w-full max-w-[480px] relative flex flex-col items-center">

            {/* Mobile Mascot - resized to fit better on screen */}
            <div className="md:hidden w-[300px] h-[220px] relative z-10 -mb-8 drop-shadow-[0_-5px_30px_rgba(124,93,250,0.25)] flex-shrink-0">
              <Image
                src="/images/blog/swago_mascots.png"
                alt="Swago Mascots"
                fill
                className="object-contain object-bottom"
                priority
              />
            </div>

            <div className="w-full relative z-20">
              {/* U-type Curve (SVG Notch) - strictly for mobile topside card edge */}
              <div className="absolute -top-[50px] left-[-1px] right-[-1px] h-[51px] pointer-events-none md:hidden z-10 drop-shadow-[0_-12px_24px_rgba(58,45,94,0.18)]">
                <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-[51px] overflow-visible">
                  <path
                    d="M0 20 L0 5 Q0 0 10 0 Q50 20 90 0 Q100 0 100 5 L100 20 Z"
                    fill="#ffffff"
                  />
                  {/* Separate stroke path to prevent side/bottom borders bleeding */}
                  <path
                    d="M0 20 L0 5 Q0 0 10 0 Q50 20 90 0 Q100 0 100 5 L100 20"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>

              {/* Login Card Body */}
              <div className="w-full bg-white shadow-xl md:shadow-[0_40px_100px_-20px_rgba(58,45,94,0.15)] border border-slate-100 border-t-0 md:border-t relative z-20 px-4 py-2 md:p-12 md:pt-14 text-left overflow-visible rounded-b-[32px] rounded-t-none md:rounded-[32px]">
                {/* Title Section */}
                <div className="mb-8 text-center md:text-left -mt-5 md:mt-0">
                  <h1 className="text-2xl md:text-[2rem] font-black text-slate-900 mb-1.5 tracking-tight">
                    Start Your SWAGO Journey
                  </h1>
                  <p className="text-slate-400 text-xs md:text-sm font-medium">
                    Create your account to unlock fun learning.
                  </p>
                </div>

                {step === "form" && (
                  <div className="space-y-8">
                    {/* Custom Tabs */}
                    <div className="flex bg-slate-50/80 rounded-2xl p-1.5 border border-slate-100">
                      <button
                        onClick={() => setAuthMode("signup")}
                        className={`flex-1 py-2 md:py-3 px-2 md:px-3 rounded-xl font-black text-xs md:text-sm tracking-wide transition-all duration-300 ${authMode === "signup"
                          ? "bg-[hsl(var(--swago-purple))] text-white shadow-[0_8px_20px_rgba(58,45,94,0.2)]"
                          : "bg-slate-100 text-slate-400 hover:text-slate-600"
                          }`}
                      >
                        New User
                      </button>
                      <button
                        onClick={() => setAuthMode("signin")}
                        className={`flex-1 py-2 md:py-3 px-2 md:px-3 rounded-xl font-black text-xs md:text-sm tracking-wide transition-all duration-300 ${authMode === "signin"
                          ? "bg-[hsl(var(--swago-purple))] text-white shadow-[0_8px_20px_rgba(58,45,94,0.2)]"
                          : "bg-slate-100 text-slate-400 hover:text-slate-600"
                          }`}
                      >
                        Already a User
                      </button>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[13px] font-black text-slate-700/80 mb-2 ml-1 tracking-wider">
                          Phone Number <span className="text-rose-400">*</span>
                        </label>
                        <div className="flex gap-2 md:gap-3">
                          <div className="w-16 md:w-20">
                            <div className="w-full bg-slate-50/50 border border-slate-100 rounded-xl md:rounded-2xl p-3 md:p-4 text-slate-900 font-black text-center text-sm md:text-base">
                              {country?.phonePrefix || '+91'}
                            </div>
                          </div>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              if (value.length <= 15) setPhone(value);
                            }}
                            placeholder="Enter phone number"
                            maxLength={15}
                            className="flex-1 bg-white border border-slate-100 rounded-xl md:rounded-2xl p-3 md:p-4 text-sm md:text-base focus:outline-none focus:ring-4 focus:ring-purple-50 focus:border-[hsl(var(--swago-purple))] transition-all placeholder:text-slate-300 text-slate-900 font-bold shadow-sm"
                          />
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {authMode === "signup" && (
                          <motion.div
                            key="signup-fields"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-6 overflow-hidden"
                          >
                            <div>
                              <label className="block text-[13px] font-black text-slate-700/80 mb-2 ml-1 tracking-wider">
                                Full Name <span className="text-rose-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
                                className="w-full bg-white border border-slate-100 rounded-xl md:rounded-2xl p-3 md:p-4 text-sm md:text-base focus:outline-none focus:ring-4 focus:ring-purple-50 focus:border-[hsl(var(--swago-purple))] transition-all placeholder:text-slate-300 text-slate-900 font-bold shadow-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-[13px] font-black text-slate-700/80 mb-2 ml-1 tracking-wider">
                                Email Address <span className="text-rose-400">*</span>
                              </label>
                              <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@example.com"
                                className="w-full bg-white border border-slate-100 rounded-xl md:rounded-2xl p-3 md:p-4 text-sm md:text-base focus:outline-none focus:ring-4 focus:ring-purple-50 focus:border-[hsl(var(--swago-purple))] transition-all placeholder:text-slate-300 text-slate-900 font-bold shadow-sm"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button
                        onClick={sendOtp}
                        disabled={loading || !phone || phone.length < 7 || phone.length > 15}
                        className="w-full btn-shine bg-[hsl(var(--swago-purple))] hover:brightness-110 text-white font-black py-3 md:py-5 rounded-lg md:rounded-2xl text-[13px] md:text-lg tracking-wide md:tracking-[.25em] transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_20px_40px_-10px_rgba(124,93,250,0.4)] md:mt-4"
                      >
                        {loading ? "Please wait..." : "Send OTP"}
                      </button>

                      <div className="flex flex-col items-center pt-6 space-y-4">
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] md:text-xs tracking-wide md:tracking-widest opacity-80">
                          <HiLockClosed className="w-4 h-4" />
                          <span>Your information is secure with us</span>
                        </div>
                        <button
                          onClick={() => router.push(`/login/email${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`)}
                          className="text-sm font-black text-[#7c5dfa] hover:underline underline-offset-4 tracking-tight"
                        >
                          Prefer email login?
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {step === "otp" && (
                  <div className="space-y-8 py-4">
                    <div className="text-center space-y-1 md:space-y-2">
                      <p className="text-slate-400 font-bold text-xs md:text-sm tracking-wide md:tracking-widest">OTP sent to:</p>
                      <p className="text-lg md:text-3xl font-black text-slate-800 tracking-tight">{country?.phonePrefix || '+91'} {phone}</p>
                    </div>

                    <div className="relative group">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="......"
                        maxLength={6}
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-xl md:rounded-[2rem] p-3 md:p-6 text-center text-xl md:text-4xl font-black tracking-widest md:tracking-[0.4em] focus:outline-none focus:ring-4 focus:ring-purple-50 focus:border-[hsl(var(--swago-purple))] transition-all placeholder:text-slate-200 text-slate-900"
                      />
                    </div>

                    <button
                      onClick={verifyOtp}
                      disabled={loading || code.length < 6}
                      className={`w-full font-black py-3 md:py-5 rounded-lg md:rounded-2xl text-[13px] md:text-lg tracking-wide md:tracking-widest transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${code.length === 6 && !loading
                        ? 'bg-[hsl(var(--swago-purple))] shadow-[0_20px_40px_-10px_rgba(124,93,250,0.4)]'
                        : 'bg-[#c8b6ff] shadow-[0_10px_25px_-5px_rgba(200,182,255,0.4)]'
                        }`}
                    >
                      {loading ? "Verifying..." : authMode === "signup" ? "Confirm Account" : "Let's Go!"}
                    </button>

                    <div className="text-center">
                      <button
                        onClick={() => {
                          setStep("form");
                          setCode("");
                          setMessage("");
                        }}
                        className="text-sm font-black text-slate-400 hover:text-slate-600 tracking-wide md:tracking-widest border-b-2 border-slate-100 pb-1"
                      >
                        Back to edit number
                      </button>
                    </div>
                  </div>
                )}

                {message && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`mt-8 text-center text-xs font-black leading-relaxed px-5 py-4 rounded-2xl border ${message.includes("✅")
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : message.includes("🚧")
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : "bg-rose-50 text-rose-600 border-rose-100"
                      }`}
                  >
                    {message}
                  </motion.p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
