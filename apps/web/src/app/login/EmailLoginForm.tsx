"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSharedContext } from "@/context/SharedContext";
import { USER_EVENTS } from "@/context/SharedContext";
import Script from "next/script";

type AuthMode = "signup" | "signin";

export default function EmailLoginForm() {
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const router = useRouter();
  const { setUser } = useSharedContext();

  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  // Email widget configuration
  const EMAIL_WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_EMAIL_WIDGET_ID!;
  const TOKEN_AUTH = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH!;

  const handleWidgetLoad = () => {
    console.log("📧 MSG91 Email script loaded");
    setScriptLoaded(true);
  };

  useEffect(() => {
    if (!scriptLoaded) return;

    const initWidget = () => {
      console.log("🔄 Attempting widget initialization...");
      
      if (typeof window.initSendOTP === "function") {
        try {
          window.initSendOTP({
            widgetId: EMAIL_WIDGET_ID,
            tokenAuth: TOKEN_AUTH,
            exposeMethods: true,
            success: (data) => {
              console.log("✅ Email widget initialized successfully:", data);
            },
            failure: (error) => {
              console.error("❌ Email widget init failed:", error);
            },
          });
        } catch (error) {
          console.error("❌ Email widget init error:", error);
        }
      } else {
        console.log("⏳ initSendOTP not available, retrying...");
        setTimeout(initWidget, 1000);
      }
    };

    setTimeout(initWidget, 200);
  }, [scriptLoaded, EMAIL_WIDGET_ID, TOKEN_AUTH]);

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

          const res = await fetch("/api/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accessToken,
              identifier: email,
              authMethod: "email",
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
                className="w-full border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            <button
              onClick={sendOtp}
              disabled={loading || !email}
              className="w-full bg-[hsl(var(--swago-purple))] text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>

            <div className="text-center pt-4 border-t border-gray-200">
              <button
                onClick={() => router.push("/login")}
                className="text-sm text-gray-600 hover:text-[hsl(var(--swago-purple))] transition-colors"
              >
                ← Back to Phone Login
              </button>
            </div>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <div className="text-center text-sm text-gray-600 mb-2">
              OTP sent to: <strong>{email}</strong>
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
              Change email address
            </button>
          </div>
        )}

        {message && (
          <p
            className={`mt-4 text-center text-sm ${
              message.includes("✅")
                ? "text-green-600"
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
