"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSharedContext } from "@/context/SharedContext";

export default function LoginForm() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"number" | "otp">("number");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { setUser } = useSharedContext();

  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  const sendOtp = async () => {
    setMessage("Sending OTP...");
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (res.ok) {
      setStep("otp");
      setMessage("✅ OTP sent to your phone");
    } else {
      setMessage("❌ Failed to send OTP. Please check the number.");
    }
  };

  const verifyOtp = async () => {
    setMessage("Verifying...");
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      router.push(redirectUrl || "/");
    } else {
      setMessage("❌ Invalid OTP");
    }
  };

   return (
    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border">
      <h1 className="text-3xl font-bold text-center mb-6">Login with Phone</h1>
      {step === "number" && (
        <div className="space-y-4">
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" className="w-full border-slate-300 rounded-md p-3" />
          <button onClick={sendOtp} className="w-full bg-[hsl(var(--swago-purple))] text-white font-bold py-3 rounded-lg hover:opacity-90">Send OTP</button>
        </div>
      )}
      {step === "otp" && (
        <div className="space-y-4">
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter OTP" className="w-full border-slate-300 rounded-md p-3" />
          <button onClick={verifyOtp} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600">Verify OTP</button>
        </div>
      )}
      {message && <p className="mt-4 text-center text-sm">{message}</p>}
    </div>
  );
}