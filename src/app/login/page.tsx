"use client";

import { useState } from "react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"number" | "otp">("number");
  const [status, setStatus] = useState("");

  // Send OTP
  const sendOtp = async () => {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (data.success) {
      setStep("otp");
      setStatus("📲 OTP sent to your phone");
    } else {
      setStatus("❌ Failed to send OTP");
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();

    if (data.success) {
      setStatus("✅ Login successful!");

      if (data.needsDetails) {
        // User missing info → send to checkout form
        window.location.href = "/checkout";
      } else {
        // User already has info → send to cart
        window.location.href = "/cart";
      }
    } else {
      setStatus("❌ Invalid OTP, try again");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      {step === "number" ? (
        <>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            className="w-full border p-2 rounded mb-2"
          />
          <button
            onClick={sendOtp}
            className="w-full bg-blue-500 text-white py-2 rounded"
          >
            Send OTP
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter OTP"
            className="w-full border p-2 rounded mb-2"
          />
          <button
            onClick={verifyOtp}
            className="w-full bg-green-500 text-white py-2 rounded"
          >
            Verify OTP
          </button>
        </>
      )}

      {status && <p className="mt-4 text-center">{status}</p>}
    </div>
  );
}
