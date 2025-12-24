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

  useEffect(() => {
    if (!scriptLoaded) return;

    const initWidget = () => {
      console.log("🔄 Attempting widget initialization...");
      
      if (typeof window.initSendOTP === "function") {
        try {
          window.initSendOTP({
            widgetId: WIDGET_ID,
            tokenAuth: TOKEN_AUTH,
            exposeMethods: true,
            success: (data) => {
              console.log("✅ Widget initialized successfully:", data);
            },
            failure: (error) => {
              console.error("❌ Widget init failed:", error);
            },
          });
        } catch (error) {
          console.error("❌ Widget init error:", error);
        }
      } else {
        console.log("⏳ initSendOTP not available, retrying...");
        setTimeout(initWidget, 1000);
      }
    };

    setTimeout(initWidget, 200);
  }, [scriptLoaded, WIDGET_ID, TOKEN_AUTH]);

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

      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border">
        <h1 className="text-3xl font-bold text-center mb-6">
          {authMode === "signup" ? "Create Account" : "Welcome Back"}
        </h1>

        {step === "form" && (
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setAuthMode("signup")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                authMode === "signup"
                  ? "bg-white text-[hsl(var(--swago-purple))] shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              New User
            </button>
            <button
              onClick={() => setAuthMode("signin")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                authMode === "signin"
                  ? "bg-white text-[hsl(var(--swago-purple))] shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Already a User
            </button>
          </div>
        )}

        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-xs text-blue-600">
              💡 <strong>Demo:</strong> Use {DEMO_PHONE} → OTP: {DEMO_OTP_HINT}
            </p>
          </div>
        )}

        {step === "form" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="w-20">
                  <input
                    type="text"
                    value="+91"
                    disabled
                    aria-label="Country code"
                    title="India country code"
                    className="w-full border border-slate-300 rounded-md p-3 bg-gray-50 text-gray-700 font-medium text-center"
                  />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 10) {
                      setPhone(value);
                    }
                  }}
                  placeholder="Enter 10-digit number"
                  maxLength={10}
                  aria-label="Phone number"
                  className="flex-1 border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
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
                  className="w-full border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {authMode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            <button
              onClick={sendOtp}
              disabled={loading || !phone || phone.length !== 10}
              className="w-full bg-[hsl(var(--swago-purple))] text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>

            <div className="text-center pt-4 border-t border-gray-200">
              <button
               onClick={() => router.push("/login/email")}
               className="text-sm text-gray-600 hover:text-[hsl(var(--swago-purple))] transition-colors">
                Not in India? Use Email Login →
                </button>
            </div>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <div className="text-center text-sm text-gray-600 mb-2">
              OTP sent to: <strong>+91{phone}</strong>
              {authMode === "signup" && name && (
                <div className="mt-1 text-xs text-gray-500">
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
              className="w-full border border-slate-300 rounded-md p-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <button
              onClick={verifyOtp}
              disabled={loading || code.length < 6}
              className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              Change phone number
            </button>
          </div>
        )}

        {message && (
          <p
            className={`mt-4 text-center text-sm ${
              message.includes("✅")
                ? "text-green-600"
                : message.includes("🚧")
                ? "text-blue-600"
                : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </>
  );
}
