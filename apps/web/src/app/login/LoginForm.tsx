"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSharedContext } from "@/context/SharedContext";
import { USER_EVENTS } from "@/context/SharedContext";
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

  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

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

    if (phone.length !== 10) {
      setMessage("❌ Please enter a valid 10-digit phone number");
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
      const checkRes = await fetch("/api/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "+91" + phone,
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
      const formattedPhone = "91" + phone;

      window.sendOtp(
        formattedPhone,
        (data) => {
          console.log("✅ OTP sent via widget:", data);
          setStep("otp");
          setMessage("✅ OTP sent to your phone");
          setLoading(false);
        },
        (error) => {
          console.error("❌ Widget sendOtp error:", error);
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
            phone: "+91" + phone,
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
              identifier: "+91" + phone,
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
            setTimeout(() => router.push(redirectUrl || "/"), 500);
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
        <div className="w-full max-w-[640px] px-4 py-8 flex flex-col items-center">
          {/* Mascot Image Header */}
          <div className="w-72 h-72 md:w-[400px] md:h-[400px] relative mb-[-120px] z-20 drop-shadow-2xl translate-y-8">
            <Image
              src="/images/blog/swago_mascots.png"
              alt="Swago Mascots"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="w-full bg-white shadow-[0_30px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-50 relative z-10 pt-28 pb-12 px-8 md:px-20 text-center"
            style={{
              borderRadius: "50px 50px 50px 50px",
            }}
          >
            {/* Top Dip Visual Element (The U-Shape) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[2px] w-[420px] h-[80px] bg-white z-0"
              style={{
                borderRadius: "0 0 150px 150px",
                boxShadow: "0 4px 30px rgba(0,0,0,0.03)"
              }}
            />

            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
              Start Your SWAGO Journey
            </h1>
            <p className="text-slate-400 text-sm md:text-base mb-10 font-medium">
              Create your account to unlock fun learning experiences.
            </p>

            {step === "form" && (
              <div className="flex mb-10 bg-slate-50/80 rounded-2xl p-1.5 border border-slate-100">
                <button
                  onClick={() => setAuthMode("signup")}
                  className={`flex-1 py-4 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 ${authMode === "signup"
                    ? "bg-white text-[hsl(var(--swago-purple))] shadow-xl shadow-purple-900/10"
                    : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                  New User
                </button>
                <button
                  onClick={() => setAuthMode("signin")}
                  className={`flex-1 py-4 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 ${authMode === "signin"
                    ? "bg-white text-[hsl(var(--swago-purple))] shadow-xl shadow-purple-900/10"
                    : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                  Already a User
                </button>
              </div>
            )}

            {step === "form" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2.5 ml-1">
                    Phone Number <span className="text-[hsl(var(--swago-pink))]">*</span>
                  </label>
                  <div className="flex gap-3">
                    <div className="w-20">
                      <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-black text-center text-base">
                        +91
                      </div>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 10) setPhone(value);
                      }}
                      placeholder="Enter 10-digit number"
                      maxLength={10}
                      className="flex-1 bg-white border border-slate-100 rounded-2xl p-4 text-base focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-[hsl(var(--swago-purple))] transition-all placeholder:text-slate-300 font-medium"
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
                        <label className="block text-sm font-black text-slate-700 mb-2.5 ml-1">
                          Full Name <span className="text-[hsl(var(--swago-pink))]">*</span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-base focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-[hsl(var(--swago-purple))] transition-all placeholder:text-slate-300 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-black text-slate-700 mb-2.5 ml-1">
                          Email Address <span className="text-[hsl(var(--swago-pink))]">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-base focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-[hsl(var(--swago-purple))] transition-all placeholder:text-slate-300 font-medium"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={sendOtp}
                  disabled={loading || !phone || phone.length !== 10}
                  className="w-full bg-[hsl(var(--swago-purple))] text-white font-black py-5 rounded-[20px] text-lg uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_15px_30px_-5px_hsla(var(--swago-purple),0.35)]"
                >
                  {loading ? "Please wait..." : "Send OTP"}
                </button>

                <div className="flex flex-col items-center pt-8 space-y-4">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                    <HiLockClosed className="w-4 h-4 text-slate-400" />
                    <span>Your information is secure with us</span>
                  </div>
                  <button
                    onClick={() => router.push("/login/email")}
                    className="text-xs font-black text-[hsl(var(--swago-purple))] hover:underline underline-offset-4 tracking-tighter uppercase"
                  >
                    Prefer email login?
                  </button>
                </div>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-8 py-4">
                <div className="text-center space-y-2">
                  <p className="text-slate-400 font-medium">OTP sent to:</p>
                  <p className="text-2xl font-black text-slate-800">+91 {phone}</p>
                </div>

                <div className="relative group">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="......"
                    maxLength={6}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] p-6 text-center text-4xl font-black tracking-[0.4em] focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-[hsl(var(--swago-purple))] transition-all placeholder:text-slate-200"
                  />
                </div>

                <button
                  onClick={verifyOtp}
                  disabled={loading || code.length < 6}
                  className="w-full bg-[hsl(var(--swago-purple))] text-white font-black py-5 rounded-[20px] text-lg uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_15px_30px_-5px_hsla(var(--swago-purple),0.35)]"
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
                    className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest border-b-2 border-slate-100 pb-0.5"
                  >
                    Change phone number
                  </button>
                </div>
              </div>
            )}

            {message && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-8 text-center text-xs font-bold leading-relaxed px-4 py-3 rounded-xl border ${message.includes("✅")
                  ? "bg-green-50 text-green-600 border-green-100"
                  : message.includes("🚧")
                    ? "bg-blue-50 text-blue-600 border-blue-100"
                    : "bg-red-50 text-red-600 border-red-100"
                  }`}
              >
                {message}
              </motion.p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
