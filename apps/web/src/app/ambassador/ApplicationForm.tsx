"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useSharedContext, USER_EVENTS } from '@/context/SharedContext';

export default function ApplicationForm() {
  const router = useRouter();
  const { setUser, user, isLoadingUser } = useSharedContext();
  
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [otp, setOtp] = useState("");
  
  const [formData, setFormData] = useState({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    city: "",
    childName: "",
    childAge: "",
    gender: "",
    consent: false,
  });

  // Email widget configuration
  const EMAIL_WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_EMAIL_WIDGET_ID!;
  const TOKEN_AUTH = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH!;

  const handleWidgetLoad = () => {
    console.log("📧 MSG91 Email script loaded");
    setScriptLoaded(true);
  };

  // ✅ NEW: Redirect if user is already logged in
  useEffect(() => {
    if (!isLoadingUser && user) {
      console.log("✅ User already logged in, redirecting to /kids");
      router.push('/kids');
    }
  }, [user, isLoadingUser, router]);

  // Redirect to /kids after successful registration
  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        router.push('/kids/dashboard');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [step, router]);

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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!formData.parentName.trim()) {
      setError("Please enter parent name");
      return;
    }
    if (!formData.parentEmail || !formData.parentEmail.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    if (!formData.parentPhone.trim()) {
      setError("Please enter phone number");
      return;
    }
    if (!formData.city.trim()) {
      setError("Please enter city");
      return;
    }
    if (!formData.childName.trim()) {
      setError("Please enter child&apos;s name");
      return;
    }
    if (!formData.childAge || parseInt(formData.childAge) < 7 || parseInt(formData.childAge) > 14) {
      setError("Child must be between 7-14 years old");
      return;
    }
    if (!formData.gender) {
      setError("Please select gender");
      return;
    }
    if (!formData.consent) {
      setError("Please accept terms and consent");
      return;
    }

    setIsSubmitting(true);
    setMessage("Checking account...");

    try {
      // Check if email already exists
      const checkRes = await fetch("/api/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          identifier: formData.parentEmail.toLowerCase().trim(),
          authMethod: "email"
        }),
      });

      const checkData = await checkRes.json();

      if (checkData.exists) {
        setError("An account with this email already exists. Please login instead.");
        setIsSubmitting(false);
        return;
      }

      // Send OTP via MSG91 widget
      if (!window.sendOtp) {
        setError("Widget not loaded. Please refresh the page.");
        setIsSubmitting(false);
        return;
      }

      setMessage("Sending OTP to your email...");

      window.sendOtp(
        formData.parentEmail.toLowerCase().trim(),
        (data) => {
          console.log("✅ OTP sent to email:", data);
          setStep("otp");
          setMessage("✅ OTP sent to your email");
          setIsSubmitting(false);
        },
        (error) => {
          console.error("❌ Email OTP error:", error);
          setError(error.message || "Failed to send OTP");
          setIsSubmitting(false);
        }
      );
    } catch (err) {
      console.error("Send OTP error:", err);
      setError("Failed to send OTP. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    setIsSubmitting(true);
    setMessage("Verifying OTP...");
    setError(null);

    try {
      if (!window.verifyOtp) {
        setError("Widget not loaded. Please refresh the page.");
        setIsSubmitting(false);
        return;
      }

      window.verifyOtp(
        otp,
        async (data) => {
          console.log("✅ Email OTP verified:", data);

          const accessToken = data.message || data.token || data.access_token;
          if (!accessToken) {
            setError("Verification failed. No token received.");
            setIsSubmitting(false);
            return;
          }

          setMessage("Creating your account...");

          // Complete registration
          const res = await fetch("/api/ambassador/complete-registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accessToken,
              parentName: formData.parentName.trim(),
              parentEmail: formData.parentEmail.toLowerCase().trim(),
              parentPhone: formData.parentPhone.trim(),
              city: formData.city.trim(),
              childName: formData.childName.trim(),
              childAge: parseInt(formData.childAge),
              gender: formData.gender,
            }),
          });

          const responseData = await res.json();

          if (res.ok && responseData.success) {
            // Set user in context and trigger login event
            setUser(responseData.user);
            window.dispatchEvent(new CustomEvent(USER_EVENTS.LOGIN));
            
            setMessage("✅ Account created successfully!");
            setStep("success");
            setIsSubmitting(false);
          } else {
            setError(responseData.error || "Failed to create account");
            setIsSubmitting(false);
          }
        },
        (error) => {
          console.error("❌ Widget verifyOtp error:", error);
          setError(error.message || "Invalid OTP");
          setIsSubmitting(false);
        }
      );
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("Verification failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Success Screen
  if (step === 'success') {
    return (
      <>
        <Script
          src="https://verify.msg91.com/otp-provider.js"
          onLoad={handleWidgetLoad}
        />
        <div id="application-form" className="bg-slate-50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Welcome to the Swagoverse! 🎉</h2>
              <p className="text-lg text-slate-600 mb-4">
                Your account has been created successfully!
              </p>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
                <p className="text-lg font-semibold text-slate-800 mb-2">
                  🎁 {formData.childName} received:
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-2 text-yellow-600 font-bold">
                    <span className="text-2xl">💰</span>
                    <span className="text-xl">50 Swago Money</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-purple-600 font-bold">
                    <span className="text-2xl">🦸</span>
                    <span className="text-lg">Swago Saviour Badge</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Redirecting to Kids Dashboard in 3 seconds...
              </p>
              <button
                onClick={() => router.push("/kids")}
                className="inline-block bg-gradient-to-r from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-pink))] text-white font-bold px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
              >
                Go to Dashboard Now →
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // OTP Verification Screen
  if (step === 'otp') {
    return (
      <>
        <Script
          src="https://verify.msg91.com/otp-provider.js"
          onLoad={handleWidgetLoad}
        />
        <div id="application-form" className="bg-slate-50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Verify Your Email</h2>
              <p className="text-slate-600 text-center mb-6">
                We&apos;ve sent a 6-digit code to <br />
                <strong>{formData.parentEmail}</strong>
              </p>
              
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {message && !error && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm">
                  {message}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-2">
                    Enter OTP
                  </label>
                  <input 
                    id="otp"
                    type="text" 
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                    }}
                    placeholder="000000"
                    maxLength={6}
                    disabled={isSubmitting}
                    className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent text-center text-2xl font-mono tracking-widest disabled:bg-slate-100"
                  />
                </div>

                <button 
                  onClick={handleVerifyOTP}
                  disabled={isSubmitting || otp.length !== 6}
                  className="w-full btn-shine bg-gradient-to-r from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-pink))] text-white font-bold py-4 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating Account...' : '🚀 Enter the Swagoverse'}
                </button>
              </div>

              <button
                onClick={() => {
                  setStep('form');
                  setOtp('');
                  setError(null);
                  setMessage('');
                }}
                className="w-full mt-4 text-sm text-slate-600 hover:text-slate-800 underline"
              >
                ← Change email address
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Registration Form
  return (
    <>
      <Script
        src="https://verify.msg91.com/otp-provider.js"
        onLoad={handleWidgetLoad}
        onError={() => {
          console.error("❌ Failed to load MSG91 widget");
          setError("Failed to load verification service");
        }}
      />
      
      <div id="application-form" className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-bold text-slate-800 mb-2 text-center">Enter the Swagoverse 🌟</h2>
            <p className="text-slate-600 text-center mb-8">Create your parent account and your child&apos;s ambassador profile in one step!</p>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {message && !error && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm">
                {message}
              </div>
            )}

            <form onSubmit={handleSendOTP} className="space-y-8">
              {/* Parent Details Section */}
              <div className="border-b pb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  👨‍👩‍👧 Parent Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="parentName" className="block text-sm font-medium text-slate-700 mb-2">
                      Parent/Guardian Name *
                    </label>
                    <input 
                      id="parentName"
                      name="parentName"
                      type="text" 
                      value={formData.parentName}
                      onChange={handleFormChange}
                      required
                      disabled={isSubmitting}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent disabled:bg-slate-100"
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="parentEmail" className="block text-sm font-medium text-slate-700 mb-2">
                        Email *
                      </label>
                      <input 
                        id="parentEmail"
                        name="parentEmail"
                        type="email" 
                        value={formData.parentEmail}
                        onChange={handleFormChange}
                        required
                        disabled={isSubmitting}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent disabled:bg-slate-100"
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="parentPhone" className="block text-sm font-medium text-slate-700 mb-2">
                        Phone *
                      </label>
                      <input 
                        id="parentPhone"
                        name="parentPhone"
                        type="tel" 
                        value={formData.parentPhone}
                        onChange={handleFormChange}
                        required
                        disabled={isSubmitting}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent disabled:bg-slate-100"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">
                      City *
                    </label>
                    <input 
                      id="city"
                      name="city"
                      type="text" 
                      value={formData.city}
                      onChange={handleFormChange}
                      required
                      disabled={isSubmitting}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent disabled:bg-slate-100"
                      placeholder="Enter your city"
                    />
                  </div>
                </div>
              </div>

              {/* Child Details Section */}
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  🧒 Child Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="childName" className="block text-sm font-medium text-slate-700 mb-2">
                      Child&apos;s Name *
                    </label>
                    <input 
                      id="childName"
                      name="childName"
                      type="text" 
                      value={formData.childName}
                      onChange={handleFormChange}
                      required
                      disabled={isSubmitting}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent disabled:bg-slate-100"
                      placeholder="Enter child&apos;s name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="childAge" className="block text-sm font-medium text-slate-700 mb-2">
                        Age *
                      </label>
                      <select 
                        id="childAge"
                        name="childAge"
                        value={formData.childAge}
                        onChange={handleFormChange}
                        required
                        disabled={isSubmitting}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent disabled:bg-slate-100"
                      >
                        <option value="">Select age</option>
                        {[7,8,9,10,11,12,13,14].map(age => (
                          <option key={age} value={age}>{age} years</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-2">
                        Gender *
                      </label>
                      <select 
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleFormChange}
                        required
                        disabled={isSubmitting}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent disabled:bg-slate-100"
                      >
                        <option value="">Select gender</option>
                        <option value="boy">Boy 👦</option>
                        <option value="girl">Girl 👧</option>
                        <option value="other">Other 🧒</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consent */}
              <div className="flex items-start gap-3 bg-purple-50 p-4 rounded-lg">
                <input 
                  id="consent"
                  name="consent"
                  type="checkbox" 
                  checked={formData.consent}
                  onChange={handleFormChange}
                  required
                  disabled={isSubmitting}
                  className="mt-1 w-4 h-4 text-[hsl(var(--swago-purple))] border-slate-300 rounded focus:ring-[hsl(var(--swago-purple))] disabled:bg-slate-100"
                />
                <label htmlFor="consent" className="text-sm text-slate-700">
                  I consent to my child&apos;s participation in the Swago Ambassador Program. I understand that all sessions are child-safe and moderated. I agree to Swago&apos;s terms and privacy policy. *
                </label>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-shine bg-gradient-to-r from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-pink))] text-white font-bold py-4 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {isSubmitting ? 'Sending OTP...' : '🚀 Enter the Swagoverse'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
