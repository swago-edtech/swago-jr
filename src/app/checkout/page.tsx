"use client";
import { useEffect, useState } from "react";
import { useSharedContext, User } from "@/context/SharedContext"; // Import User type
import { useRouter } from "next/navigation";

// Define a minimal Razorpay type instead of using "any"
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void; // flexible callback type
    };
  }
}

export default function CheckoutPage() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", age: "", address: "", email: "" });
  const [message, setMessage] = useState("");
  const { cart, clearCart, user, total } = useSharedContext();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePayment = async () => {
    setMessage("Processing payment...");

    const res = await fetch("/api/payment/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalAmount: total }),
    });

    if (!res.ok) {
      setMessage("❌ Failed to create payment order.");
      return;
    }

    const razorpayOrder = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: "Swago Junior",
      description: "Learning Kits Purchase",
      order_id: razorpayOrder.id,
      handler: async function (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) {
        const verificationRes = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            orderDetails: { ...form, cart },
          }),
        });

        if (verificationRes.ok) {
          clearCart();
          router.push("/orders");
        } else {
          setMessage("❌ Payment verification failed. Please contact support.");
        }
      },
      prefill: {
        name: form.name,
        email: form.email,
        contact: user?.phone,
      },
      notes: {
        address: form.address,
      },
      theme: {
        color: "#3b82f6",
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();

    paymentObject.on("payment.failed", function (response: { error: { description: string } }) {
      setMessage(`❌ Payment failed. Error: ${response.error.description}`);
    });
  };

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.push("/login?redirect=/checkout");
    } else {
      setLoading(false);
    }
  }, [user, router]);

  if (loading || !user) return <p className="p-6">Checking your login status...</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Complete Your Purchase</h1>
      <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-white p-8 rounded-xl shadow-lg border">
          <div className="space-y-4">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your Full Name"
              className="w-full border-slate-300 rounded-md p-3"
              required
            />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Your Email Address"
              className="w-full border-slate-300 rounded-md p-3"
              required
            />
            <input
              type="text"
              name="age"
              value={form.age}
              onChange={handleChange}
              placeholder="Kid's Age"
              className="w-full border-slate-300 rounded-md p-3"
              required
            />
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Full Delivery Address"
              className="w-full border-slate-300 rounded-md p-3"
              required
            />
          </div>
        </div>
        <div className="bg-slate-50 p-8 rounded-xl border">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="flex justify-between items-center text-lg">
            <span>Total Amount:</span>
            <span className="font-bold">₹{total.toFixed(2)}</span>
          </div>
          <button
            onClick={handlePayment}
            className="mt-6 w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600"
          >
            Proceed to Pay Securely
          </button>
          {message && <p className="mt-4 text-center text-sm">{message}</p>}
        </div>
      </div>
    </div>
  );
}
