"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSharedContext } from "@/context/SharedContext";
import { USER_EVENTS } from "@/context/SharedContext"; // Import the events
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { auth } from "@/lib/firebase-client";
import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  ConfirmationResult 
} from "firebase/auth";

export default function LoginForm() {
  const [phone, setPhone] = useState<string>("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"number" | "otp">("number");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const router = useRouter();
  const { setUser } = useSharedContext();

  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  // Demo credentials (updated format)
  const DEMO_PHONE = "+919876543210";
  const DEMO_OTP_HINT = "123456";

  // Initialize reCAPTCHA
  useEffect(() => {
    if (!auth) return;

    // Clean up any existing reCAPTCHA
    const existingRecaptcha = document.getElementById("recaptcha-container");
    if (existingRecaptcha) {
      existingRecaptcha.innerHTML = "";
    }

    try {
      // @ts-expect-error - RecaptchaVerifier is not on window type definition
      if (!window.recaptchaVerifier) {
        // @ts-expect-error - RecaptchaVerifier is not on window type definition
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA solved");
          },
          "expired-callback": () => {
            console.log("reCAPTCHA expired");
            setMessage("❌ reCAPTCHA expired. Please try again.");
          },
        });
      }
    } catch (error) {
      console.error("reCAPTCHA initialization error:", error);
    }

    return () => {
      // Cleanup on unmount
      // @ts-expect-error - RecaptchaVerifier is not on window type definition
      if (window.recaptchaVerifier) {
        // @ts-expect-error - RecaptchaVerifier is not on window type definition
        window.recaptchaVerifier.clear();
        // @ts-expect-error - RecaptchaVerifier is not on window type definition
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const sendOtp = async () => {
    if (!phone) {
      setMessage("❌ Please enter a phone number");
      return;
    }

    // Basic validation
    if (phone.length < 10) {
      setMessage("❌ Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setMessage("Sending OTP...");

    try {
      if (!auth) {
        throw new Error("Firebase auth not initialized");
      }

      // Get reCAPTCHA verifier
      // @ts-expect-error - RecaptchaVerifier is not on window type definition
      const appVerifier = window.recaptchaVerifier;

      if (!appVerifier) {
        throw new Error("reCAPTCHA not initialized");
      }

      // Send OTP via Firebase
      const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(confirmation);
      setStep("otp");
      
      // Show demo hint if demo number
      if (phone === DEMO_PHONE) {
        setMessage(`✅ Demo mode: Use OTP ${DEMO_OTP_HINT}`);
      } else {
        setMessage("✅ OTP sent to your phone");
      }
    } catch (error) {
      console.error("OTP send error:", error);
      
      // User-friendly error messages
      const err = error as { code?: string; message?: string };
      if (err.code === "auth/invalid-phone-number") {
        setMessage("❌ Invalid phone number format");
      } else if (err.code === "auth/too-many-requests") {
        setMessage("❌ Too many requests. Please try again later.");
      } else if (err.code === "auth/quota-exceeded") {
        setMessage("❌ SMS quota exceeded. Please try again later.");
      } else {
        setMessage(`❌ Failed to send OTP: ${err.message || 'Unknown error'}`);
      }
      
      // Reset reCAPTCHA on error
      // @ts-expect-error - RecaptchaVerifier is not on window type definition
      if (window.recaptchaVerifier) {
        // @ts-expect-error - RecaptchaVerifier is not on window type definition
        window.recaptchaVerifier.clear();
        // @ts-expect-error - RecaptchaVerifier is not on window type definition
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!code) {
      setMessage("❌ Please enter the OTP");
      return;
    }

    if (!confirmationResult) {
      setMessage("❌ Please request OTP first");
      return;
    }

    setLoading(true);
    setMessage("Verifying OTP...");

    try {
      // Verify OTP with Firebase
      const result = await confirmationResult.confirm(code);
      const user = result.user;

      // Get Firebase ID token
      const idToken = await user.getIdToken();

      // Send token to backend for session creation
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          idToken,
          phone: user.phoneNumber, // E.164 format: "+919876543210"
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setMessage("✅ Login successful!");
        
        // 🔥 NEW: Trigger login event to refresh user data
        window.dispatchEvent(new CustomEvent(USER_EVENTS.LOGIN));
        
        // Small delay for success message
        setTimeout(() => {
          router.push(redirectUrl || "/");
        }, 500);
      } else {
        const errorData = await res.json();
        setMessage(`❌ ${errorData.error || "Verification failed"}`);
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      
      const err = error as { code?: string; message?: string };
      if (err.code === "auth/invalid-verification-code") {
        setMessage("❌ Invalid OTP. Please try again.");
      } else if (err.code === "auth/code-expired") {
        setMessage("❌ OTP expired. Please request a new one.");
      } else {
        setMessage(`❌ Verification failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border">
      <h1 className="text-3xl font-bold text-center mb-6">Login with Phone</h1>
      
      {/* Demo hint for development */}
      {process.env.NODE_ENV === "development" && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-xs text-blue-600">
            💡 <strong>Demo:</strong> Use {DEMO_PHONE} → OTP: {DEMO_OTP_HINT}
          </p>
        </div>
      )}

      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container"></div>

      {step === "number" && (
        <div className="space-y-4">
          {/* Country selector + phone input */}
          <div className="phone-input-wrapper">
            <PhoneInput
              international
              defaultCountry="IN"
              value={phone}
              onChange={(value) => setPhone(value || "")}
              placeholder="Enter phone number"
              className="w-full"
              numberInputProps={{
                className: "w-full border border-slate-300 rounded-md p-3 pl-12 focus:outline-none focus:ring-2 focus:ring-purple-500"
              }}
            />
          </div>

          <button 
            onClick={sendOtp} 
            disabled={loading || !phone}
            className="w-full bg-[hsl(var(--swago-purple))] text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-4">
          <div className="text-center text-sm text-gray-600 mb-2">
            OTP sent to: <strong>{phone}</strong>
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
            disabled={loading || code.length < 4}
            className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <button
            onClick={() => {
              setStep("number");
              setCode("");
              setMessage("");
              setConfirmationResult(null);
            }}
            className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Change phone number
          </button>
        </div>
      )}

      {message && (
        <p className={`mt-4 text-center text-sm ${
          message.includes("✅") ? "text-green-600" : "text-red-600"
        }`}>
          {message}
        </p>
      )}

      {/* Phone input styling */}
      <style jsx global>{`
        .PhoneInputInput {
          border: 1px solid #cbd5e1;
          border-radius: 0.375rem;
          padding: 0.75rem 0.75rem 0.75rem 3rem;
          font-size: 1rem;
          width: 100%;
        }
        .PhoneInputInput:focus {
          outline: none;
          ring: 2px;
          ring-color: hsl(var(--swago-purple));
          border-color: hsl(var(--swago-purple));
        }
        .PhoneInputCountry {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
        }
        .phone-input-wrapper {
          position: relative;
        }
      `}</style>
    </div>
  );
}