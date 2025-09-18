"use client";

import { useState, useEffect } from "react";

export default function CheckoutPage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("");

  // Fetch logged-in user (for now mock it from /api/me later)
  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setName(data.user.name || "");
        setAge(data.user.age || "");
        setAddress(data.user.address || "");
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async () => {
    const res = await fetch("/api/save-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, age, address }),
    });
    const data = await res.json();

    if (data.success) {
      setStatus("✅ Order placed successfully!");
    } else {
      setStatus("❌ Failed: " + data.error);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <h2 className="text-xl font-bold">Please log in first</h2>
        <a href="/login" className="text-blue-500 underline">
          Go to Login
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full Name"
        className="w-full border p-2 mb-2 rounded"
      />
      <input
        value={age}
        onChange={(e) => setAge(e.target.value)}
        placeholder="Child's Age"
        className="w-full border p-2 mb-2 rounded"
      />
      <textarea
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Delivery Address"
        className="w-full border p-2 mb-2 rounded"
      />
      <button
        onClick={handleSubmit}
        className="w-full bg-green-500 text-white py-2 rounded"
      >
        Place Order
      </button>

      {status && <p className="mt-4 text-center">{status}</p>}
    </div>
  );
}
