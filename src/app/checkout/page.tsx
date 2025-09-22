"use client";
import { useEffect, useState } from "react";
import { useSharedContext } from "@/context/SharedContext";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", age: "", address: "" });
  const [message, setMessage] = useState("");
  const { cart, clearCart, user } = useSharedContext();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setMessage("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, cart }),
    });
    if (res.ok) {
      clearCart();
      router.push("/orders");
    } else {
      setMessage("❌ Failed to place order");
    }
  };

  useEffect(() => {
    // If the context is still loading user data, do nothing yet.
    if (user === undefined) return;

    if (!user) {
      // Updated: Add a redirect query parameter
      router.push("/login?redirect=/checkout");
    } else {
      setLoading(false);
    }
  }, [user, router]);

  if (loading || !user) return <p className="p-6">Checking your login status...</p>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Checkout</h1>
      <p className="mb-2">Phone: {user.phone}</p>
      <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your Name" className="border p-2 w-full mb-2" />
      <input type="text" name="age" value={form.age} onChange={handleChange} placeholder="Kid's Age" className="border p-2 w-full mb-2" />
      <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Delivery Address" className="border p-2 w-full mb-2" />
      <button onClick={handleSubmit} className="bg-green-500 text-white px-4 py-2 rounded">Place Order</button>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}