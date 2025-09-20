"use client";
import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    age: "",
    address: "",
  });
  const [message, setMessage] = useState("");

  // ✅ Check if logged in
  useEffect(() => {
    async function checkUser() {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        if (data.loggedIn) {
          setUser(data.user);
        } else {
          window.location.href = "/login"; // redirect if not logged in
        }
      } else {
        window.location.href = "/login";
      }
      setLoading(false);
    }
    checkUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form }),
    });

    if (res.ok) {
      setMessage("✅ Order placed successfully!");
    } else {
      setMessage("❌ Failed to place order");
    }
  };

  if (loading) return <p className="p-6">Checking login...</p>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Checkout</h1>

      {user && (
        <>
          <p className="mb-2">Phone: {user.phone}</p>

          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your Name"
            className="border p-2 w-full mb-2"
          />

          <input
            type="text"
            name="age"
            value={form.age}
            onChange={handleChange}
            placeholder="Kid's Age"
            className="border p-2 w-full mb-2"
          />

          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Delivery Address"
            className="border p-2 w-full mb-2"
          />

          <button
            onClick={handleSubmit}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Place Order
          </button>
        </>
      )}

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
