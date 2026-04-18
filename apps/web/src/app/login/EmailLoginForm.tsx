"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSharedContext } from "@/context/SharedContext";
import { USER_EVENTS } from "@/context/SharedContext";
import Script from "next/script";

type AuthMode = "signup" | "signin";

// ✅ Helper to get product ID
const getProductId = (product: { _id?: string; id?: number }): string => {
  return product._id || product.id?.toString() || '';
};

export default function EmailLoginForm() {
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { setUser, cart } = useSharedContext();

  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || searchParams.get("callbackUrl");

  // Email widget configuration
  const EMAIL_WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_EMAIL_WIDGET_ID!;
  const TOKEN_AUTH = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH!;

  const handleWidgetLoad = () => {
    console.log("📧 MSG91 Email script loaded");
    setScriptLoaded(true);
  };

  // ✅ Track client-side mounting and handle widget conflicts
  useEffect(() => {
    setIsMounted(true);

    // ✅ Check if a different widget type was previously loaded
    const loadedWidgetType = sessionStorage.getItem('msg91_widget_type');

    // If PHONE widget was loaded and methods exist, we MUST reload to switch to EMAIL
    if (loadedWidgetType === 'phone' && window.sendOtp) {
      console.log("🔄 PHONE widget detected, reloading for EMAIL widget...");
      sessionStorage.setItem('msg91_widget_type', 'email');
      window.location.reload();
      return;
    }

    // Mark that we want the EMAIL widget
    sessionStorage.setItem('msg91_widget_type', 'email');

    // Initialize EMAIL widget
    if (typeof window.initSendOTP === "function") {
      console.log("🔄 Initializing EMAIL widget...");
      try {
        window.initSendOTP({
          widgetId: EMAIL_WIDGET_ID,
          tokenAuth: TOKEN_AUTH,
          exposeMethods: true,
          success: () => {
            console.log("✅ EMAIL widget initialized");
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
  }, [EMAIL_WIDGET_ID, TOKEN_AUTH]);

  // Widget initialization when script loads fresh
  useEffect(() => {
    if (!scriptLoaded || widgetReady) return;

    const initWidget = () => {
      console.log("🔄 Attempting widget initialization...");

      if (typeof window.initSendOTP === "function") {
        try {
          window.initSendOTP({
            widgetId: EMAIL_WIDGET_ID,
            tokenAuth: TOKEN_AUTH,
            exposeMethods: true,
            success: () => {
              console.log("✅ Email widget initialized successfully");
              setWidgetReady(true);
            },
            failure: (error) => {
              console.error("❌ Email widget init failed:", error);
            },
          });

          // Method polling
          let checkCount = 0;
          const checkMethods = () => {
            checkCount++;
            if (window.sendOtp && window.verifyOtp) {
              console.log("✅ Widget methods detected");
              setWidgetReady(true);
            } else if (checkCount < 10) {
              setTimeout(checkMethods, 500);
            } else {
              setWidgetReady(true); // Show form anyway
            }
          };
          setTimeout(checkMethods, 500);
        } catch (error) {
          console.error("❌ Email widget init error:", error);
          setWidgetReady(true);
        }
      } else {
        console.log("⏳ initSendOTP not available, retrying...");
        setTimeout(initWidget, 1000);
      }
    };

    setTimeout(initWidget, 500);
  }, [scriptLoaded, widgetReady, EMAIL_WIDGET_ID, TOKEN_AUTH]);

  // Fallback timeout
  useEffect(() => {
    if (isMounted && !widgetReady && step === "form") {
      const timeout = setTimeout(() => {
        console.log("⏰ Timeout reached - showing form");
        setWidgetReady(true);
      }, 8000);
      return () => clearTimeout(timeout);
    }
  }, [isMounted, widgetReady, step]);

  const sendOtp = async () => {
    if (!email) {
      setMessage("❌ Please enter your email address");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setMessage("❌ Please enter a valid email address");
      return;
    }

    if (authMode === "signup") {
      if (!name.trim()) {
        setMessage("❌ Please enter your name");
        return;
      }
    }

    setLoading(true);
    setMessage("Checking account...");

    try {
      const checkRes = await fetch("/api/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: email,
          authMethod: "email"
        }),
      });

      const checkData = await checkRes.json();

      if (!checkData.success) {
        setMessage("❌ Failed to verify account. Please try again.");
        setLoading(false);
        return;
      }

      if (authMode === "signup" && checkData.exists) {
        setMessage("✅ Account found! Switching to sign in...");
        setAuthMode("signin");
        setTimeout(() => {
          setMessage("");
          setLoading(false);
        }, 1500);
        return;
      }

      if (authMode === "signin" && !checkData.exists) {
        setMessage("📝 New email! Switching to sign up...");
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

      window.sendOtp(
        email,
        (data) => {
          console.log("✅ OTP sent to email:", data);
          setStep("otp");
          setMessage("✅ OTP sent to your email");
          setLoading(false);
        },
        (error) => {
          console.error("❌ Email OTP error:", error);
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
      if (!window.verifyOtp) {
        setMessage("❌ Widget not loaded. Please refresh the page.");
        setLoading(false);
        return;
      }

      window.verifyOtp(
        code,
        async (data) => {
          console.log("✅ Email OTP verified:", data);

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
              identifier: email,
              authMethod: "email",
              localCart, // ✅ Now includes price, name, image
              ...(authMode === "signup" && { name }),
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

      {/* ✅ Loading state - shows FIRST while widget initializes */}
      {isMounted && !widgetReady && step === "form" && (
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600 mb-2">Initializing verification service...</p>
          <p className="text-xs text-slate-400">This should only take a few seconds</p>
        </div>
      )}

      {/* ✅ Main form - show when widget is ready OR in OTP step */}
      {(widgetReady || step === "otp") && (
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border">
          <h1 className="text-3xl font-bold text-center mb-2">
            {authMode === "signup" ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            International login with email
          </p>

          {step === "form" && (
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setAuthMode("signup")}
                className={`flex-1 py-1.5 md:py-2 px-2 md:px-4 rounded-md font-medium text-sm md:text-base transition-colors ${authMode === "signup"
                  ? "bg-white text-[hsl(var(--swago-purple))] shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                New User
              </button>
              <button
                onClick={() => setAuthMode("signin")}
                className={`flex-1 py-1.5 md:py-2 px-2 md:px-4 rounded-md font-medium text-sm md:text-base transition-colors ${authMode === "signin"
                  ? "bg-white text-[hsl(var(--swago-purple))] shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                Already a User
              </button>
            </div>
          )}

          {step === "form" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                  placeholder="your.email@example.com"
                  className="w-full border border-slate-300 rounded-md p-2.5 md:p-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 font-bold"
                />
              </div>

              {authMode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full border border-slate-300 rounded-md p-2.5 md:p-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 font-bold"
                  />
                </div>
              )}

              <button
                onClick={sendOtp}
                disabled={loading || !email}
                className="w-full btn-shine bg-[hsl(var(--swago-purple))] hover:brightness-110 text-white font-black py-2.5 md:py-4 rounded-lg md:rounded-xl text-[13px] md:text-base tracking-wide md:tracking-widest shadow-[0_15px_30px_-5px_rgba(124,93,250,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>

              <div className="text-center pt-4 border-t border-gray-200">
                <button
                  onClick={() => router.push(`/login${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`)}
                  className="text-sm text-gray-600 hover:text-[hsl(var(--swago-purple))] transition-colors"
                >
                  ← Back to Phone Login
                </button>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <div className="text-center text-xs md:text-sm text-gray-600 mb-2">
                OTP sent to: <strong>{email}</strong>
                {authMode === "signup" && name && (
                  <div className="mt-1 text-[10px] md:text-xs text-gray-500">
                    Creating account for: {name}
                  </div>
                )}
              </div>

              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="w-full border border-slate-300 rounded-lg md:rounded-md p-2.5 md:p-4 text-center text-lg md:text-2xl tracking-[0.1em] md:tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900 font-black"
              />

              <button
                onClick={verifyOtp}
                disabled={loading || code.length < 6}
                className={`w-full font-black py-2.5 md:py-4 rounded-lg md:rounded-xl text-[13px] md:text-base tracking-wide md:tracking-widest transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${code.length === 6 && !loading
                  ? 'bg-[hsl(var(--swago-purple))] shadow-[0_15px_30px_-5px_rgba(124,93,250,0.3)] text-white'
                  : 'bg-slate-200 text-slate-400'
                  }`}
              >
                {loading ? "Verifying..." : authMode === "signup" ? "Create Account" : "Sign In"}
              </button>

              <button
                onClick={() => {
                  setStep("form");
                  setCode("");
                  setMessage("");
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Change email address
              </button>
            </div>
          )}

          {message && (
            <p
              className={`mt-4 text-center text-sm ${message.includes("✅")
                ? "text-green-600"
                : "text-red-600"
                }`}
            >
              {message}
            </p>
          )}
        </div>
      )}
    </>
  );
}
