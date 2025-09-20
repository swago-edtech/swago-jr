"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSharedContext } from "@/context/SharedContext"; // Updated import

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"number" | "otp">("number");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { setUser } = useSharedContext(); // Get the setUser function from context

  const sendOtp = async () => {
    // ... same as before
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (res.ok) {
      setStep("otp");
      setMessage("OTP sent to your phone");
    } else {
      setMessage("Failed to send OTP");
    }
  };

  const verifyOtp = async () => {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data.user); // Update the global state with the user data from the API
      router.push("/");   // Redirect to home
    } else {
      setMessage("❌ Invalid OTP");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Login with Phone</h1>
      {step === "number" && (
        <>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" className="border p-2 w-full mb-2" />
          <button onClick={sendOtp} className="bg-blue-500 text-white px-4 py-2 rounded">Send OTP</button>
        </>
      )}
      {step === "otp" && (
        <>
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter OTP" className="border p-2 w-full mb-2" />
          <button onClick={verifyOtp} className="bg-green-500 text-white px-4 py-2 rounded">Verify OTP</button>
        </>
      )}
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}