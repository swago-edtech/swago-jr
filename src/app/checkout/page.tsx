"use client";
import { useEffect, useState } from "react";
import { useSharedContext } from "@/context/SharedContext";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", age: "", address: "" });
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
      handler: async function (response: any) {
        // --- This handler is now updated ---
        const verificationRes = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            orderDetails: {
              ...form,
              cart,
            }
          }),
        });
        
        if (verificationRes.ok) {
          clearCart();
          router.push('/orders'); // Redirect to orders page on success
        } else {
          setMessage("❌ Payment verification failed. Please contact support.");
        }
      },
      prefill: {
        name: form.name,
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

    paymentObject.on('payment.failed', function (response: any){
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
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Complete Your Purchase</h1>
      <p className="mb-2"><strong>Phone:</strong> {user.phone}</p>
      <p className="mb-4 font-semibold"><strong>Total Amount: ₹{total.toFixed(2)}</strong></p>

      <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your Full Name" className="border p-2 w-full mb-2" />
      <input type="text" name="age" value={form.age} onChange={handleChange} placeholder="Kid's Age" className="border p-2 w-full mb-2" />
      <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Full Delivery Address" className="border p-2 w-full mb-2" />
      
      <button onClick={handlePayment} className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
        Proceed to Pay
      </button>

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}