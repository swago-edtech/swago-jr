"use client";

import { useState } from "react";

export default function LoginPage() {
  const [step, setStep] = useState<"number" | "otp">("number");
  const [phone, setPhone] = useState("");

  const handleSendOTP = () => {
    if (phone.length === 10) setStep("otp");
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded shadow">
      <h1 className="text-xl font-bold mb-4">Login with Mobile</h1>
      {step === "number" ? (
        <>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter mobile number"
            className="w-full border p-2 rounded mb-4"
          />
          <button
            onClick={handleSendOTP}
            className="w-full bg-blue-500 text-white py-2 rounded"
          >
            Send OTP
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            className="w-full border p-2 rounded mb-4"
          />
          <button className="w-full bg-green-500 text-white py-2 rounded">
            Verify OTP
          </button>
        </>
      )}
    </div>
  );
}
