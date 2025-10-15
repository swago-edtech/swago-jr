"use client";
import { useEffect, useState } from "react";
import { useSharedContext } from "@/context/SharedContext";
import { useRouter } from "next/navigation";
import Script from "next/script"; // 🔥 ADDED: Import Script

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailedEvent = {
  error: { description: string };
};

type RazorpayOptions = {
  key?: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
};

interface RazorpayInstance {
  open: () => void;
  on(event: "payment.failed", callback: (response: RazorpayFailedEvent) => void): void;
  on(event: string, callback: (response: unknown) => void): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type Coupon = {
  code: string;
  description: string;
  type: string;
  value: number;
};

type Discount = {
  amount: number;
  originalAmount: number;
  finalAmount: number;
  savedAmount: number;
};

export default function CheckoutPage() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", age: "", address: "", email: "" });
  const [message, setMessage] = useState("");
  const { cart, clearCart, user, total } = useSharedContext();
  const router = useRouter();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponMessage("Validating coupon...");

    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          orderAmount: total,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setAppliedCoupon(data.coupon);
        setDiscount(data.discount);
        setCouponMessage(`✅ Coupon applied! You saved ₹${data.discount.savedAmount}`);
      } else {
        setCouponMessage(`❌ ${data.error}`);
        setAppliedCoupon(null);
        setDiscount(null);
      }
    } catch (error) {
      console.error("Coupon error:", error);
      setCouponMessage("❌ Failed to validate coupon");
      setAppliedCoupon(null);
      setDiscount(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(null);
    setCouponCode("");
    setCouponMessage("");
  };

  const getFinalTotal = () => {
    return discount ? discount.finalAmount : total;
  };

  const handlePayment = async () => {
    setMessage("Processing payment...");

    const finalAmount = getFinalTotal();

    // Step 1: Create Razorpay order
    const res = await fetch("/api/payment/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalAmount: finalAmount }),
    });

    if (!res.ok) {
      setMessage("❌ Failed to create payment order.");
      return;
    }

    const razorpayOrder = await res.json();

    // Step 2: Fetch Razorpay key securely from backend
    const configRes = await fetch("/api/razorpay/config");
    if (!configRes.ok) {
      setMessage("❌ Failed to load payment configuration.");
      return;
    }
    const config = await configRes.json();

    const options: RazorpayOptions = {
      key: config.keyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: "Swago Junior",
      description: "Learning Kits Purchase",
      order_id: razorpayOrder.id,
      handler: async function (response) {
        const verificationRes = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            orderDetails: {
              ...form,
              cart,
              coupon: appliedCoupon,
              discount: discount,
              originalAmount: total,
              finalAmount: finalAmount,
            },
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

    paymentObject.on("payment.failed", function (response) {
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
    <>
      {/* 🔥 ADDED: Load Razorpay script only on checkout page */}
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Complete Your Purchase</h1>
        <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-white p-8 rounded-xl shadow-lg border">
            <h2 className="text-xl font-bold mb-6">Customer Details</h2>
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
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

            <div className="mb-6 p-4 bg-white rounded-lg border">
              <h3 className="font-semibold mb-3">Have a Coupon?</h3>
              {!appliedCoupon ? (
                <div className="space-y-3">
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                      className="w-full rounded-md border-slate-300 px-3 py-2 pr-20 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={couponLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-[hsl(var(--swago-purple))] px-3 py-1 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {couponLoading ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponMessage && (
                    <p className="text-xs text-center">{couponMessage}</p>
                  )}
                  <div className="text-xs text-slate-500">
                    <p>
                      <strong>Try these codes:</strong>
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs">WELCOME10</span>
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs">FLAT50</span>
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs">SAVE20</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-green-600">✅ {appliedCoupon.code}</p>
                      <p className="text-xs text-slate-600">{appliedCoupon.description}</p>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span>Subtotal:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>

              {discount && (
                <>
                  <div className="flex justify-between items-center text-green-600">
                    <span>Discount ({appliedCoupon?.code}):</span>
                    <span>-₹{discount.savedAmount.toFixed(2)}</span>
                  </div>
                  <hr className="border-slate-200" />
                </>
              )}

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Amount:</span>
                <span className={discount ? "text-green-600" : ""}>
                  ₹{getFinalTotal().toFixed(2)}
                </span>
              </div>

              {discount && (
                <p className="text-sm text-green-600 text-center">
                  🎉 You saved ₹{discount.savedAmount.toFixed(2)}!
                </p>
              )}
            </div>

            <button
              onClick={handlePayment}
              disabled={!form.name || !form.email || !form.age || !form.address}
              className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pay ₹{getFinalTotal().toFixed(2)} Securely
            </button>

            {message && <p className="mt-4 text-center text-sm">{message}</p>}
          </div>
        </div>
      </div>
    </>
  );
}