"use client";
import { useEffect, useState } from "react";
import { useSharedContext } from "@/context/SharedContext";
import { useRouter } from "next/navigation";
import Script from "next/script";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { isPossiblePhoneNumber, parsePhoneNumber } from 'react-phone-number-input';

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

// ✅ Indian States List
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

export default function CheckoutPage() {
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({ 
    name: "", 
    age: "", 
    email: "",
    phone: "",
    address: "", 
    city: "",
    state: "",
    pincode: ""
  });
  const [message, setMessage] = useState("");
  const { cart, clearCart, user, total, isLoadingUser } = useSharedContext();
  const router = useRouter();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  
  const [isIndianNumber, setIsIndianNumber] = useState(true);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  // ✅ Pre-fill form with user data
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        name: user.name || prev.name,
      }));
    }
  }, [user]);

  // ✅ Detect if phone is Indian
  useEffect(() => {
    if (form.phone) {
      try {
        const phoneNumber = parsePhoneNumber(form.phone);
        setIsIndianNumber(phoneNumber?.country === 'IN');
      } catch {
        setIsIndianNumber(false);
      }
    }
  }, [form.phone]);

  // ✅ Auto-fill city/state from pincode (India only)
  useEffect(() => {
    if (!isIndianNumber || form.pincode.length !== 6) return;

    const fetchPincodeData = async () => {
      setPincodeLoading(true);
      setPincodeError("");

      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${form.pincode}`);
        const data = await response.json();

        if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
          const postOffice = data[0].PostOffice[0];
          setForm(prev => ({
            ...prev,
            city: postOffice.District || prev.city,
            state: postOffice.State || prev.state,
          }));
          setPincodeError("");
        } else {
          setPincodeError("Invalid pincode");
        }
      } catch (error) {
        console.error("Pincode lookup error:", error);
        setPincodeError("Could not verify pincode");
      } finally {
        setPincodeLoading(false);
      }
    };

    const debounce = setTimeout(fetchPincodeData, 500);
    return () => clearTimeout(debounce);
  }, [form.pincode, isIndianNumber]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    setProcessing(true);
    setMessage("Validating your details...");

    const finalAmount = getFinalTotal();

    try {
      console.log('🔍 Validating checkout data...');
      const validateRes = await fetch('/api/validate-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          phone: form.phone,
        }),
      });

      const validateData = await validateRes.json();
      
      if (!validateData.valid) {
        setMessage(validateData.error || '❌ Validation failed. Please check your details.');
        setProcessing(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      console.log('✅ Validation passed');
      setMessage("Creating payment order...");

      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          totalAmount: finalAmount,
          orderDetails: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            age: form.age,
            address: form.address,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            cart: cart,
            coupon: appliedCoupon,
            discount: discount,
            originalAmount: total,
            finalAmount: finalAmount,
          }
        }),
      });

      if (!res.ok) {
        setMessage("❌ Failed to create payment order.");
        setProcessing(false);
        return;
      }

      const razorpayOrder = await res.json();

      const configRes = await fetch("/api/razorpay/config");
      if (!configRes.ok) {
        setMessage("❌ Failed to load payment configuration.");
        setProcessing(false);
        return;
      }
      const config = await configRes.json();

      setMessage("Opening payment gateway...");

      const options: RazorpayOptions = {
        key: config.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Swago ",
        description: "Learning Kits Purchase",
        order_id: razorpayOrder.id,
        handler: async function (response) {
          setMessage("Verifying payment...");
          
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
            setMessage("✅ Payment successful! Redirecting...");
            clearCart();
            setTimeout(() => {
              router.push("/orders");
            }, 1000);
          } else {
            setMessage("❌ Payment verification failed. Please contact support.");
            setProcessing(false);
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        notes: {
          address: form.address,
        },
        theme: {
          color: "#3b82f6",
        },
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on("payment.failed", function (response) {
        setMessage(`❌ Payment failed. Error: ${response.error.description}`);
        setProcessing(false);
      });

      paymentObject.open();

    } catch (error) {
      console.error("Payment error:", error);
      setMessage("❌ An error occurred. Please try again.");
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (isLoadingUser) return;
    
    if (!user) {
      router.push("/login?redirect=/checkout");
    }
  }, [user, isLoadingUser, router]);

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center p-12">Loading checkout...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-slate-600 mb-6">Add some products to continue checkout</p>
          <button
            onClick={() => router.push('/products')}
            className="bg-[hsl(var(--swago-purple))] text-white px-6 py-3 rounded-lg hover:opacity-90"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const isFormValid = form.name && form.email && form.phone && 
                     isPossiblePhoneNumber(form.phone || '') &&
                     form.age && form.address && 
                     form.city && form.state &&
                     (isIndianNumber ? (form.pincode && form.pincode.length === 6) : true);

  return (
    <>
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Complete Your Purchase</h1>
        
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
            
            {/* Section 1: Order Summary & Coupon */}
            <div className="bg-slate-50 p-6 border-b">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="bg-white rounded-lg border p-4 mb-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Subtotal ({cart.length} items):</span>
                    <span className="font-medium">₹{total.toFixed(2)}</span>
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
                    <p className="text-sm text-green-600 text-center pt-2">
                      🎉 You saved ₹{discount.savedAmount.toFixed(2)}!
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold mb-3">Have a Coupon?</h3>
                {!appliedCoupon ? (
                  <div className="space-y-3">
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 pr-20 text-sm"
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
                      <p><strong>Try these codes:</strong></p>
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
            </div>

            {/* Section 2: Delivery Details */}
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold mb-6">Delivery Details</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full border border-slate-300 rounded-md p-3"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Your email address"
                      className="w-full border border-slate-300 rounded-md p-3"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <PhoneInput
                    international
                    defaultCountry="IN"
                    value={form.phone}
                    onChange={(value) => setForm({ ...form, phone: value || '' })}
                    placeholder="Enter phone number"
                    numberInputProps={{
                      className: "w-full border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    }}
                    countrySelectProps={{
                      className: "border-slate-300 rounded-l-md"
                    }}
                  />

                  {form.phone && !isPossiblePhoneNumber(form.phone) && (
                    <p className="text-red-500 text-xs mt-1">Please enter a valid phone number</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Kid&apos;s Age *
                  </label>
                  <input
                    type="text"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    placeholder="Enter kid's age"
                    className="w-full border border-slate-300 rounded-md p-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Enter complete delivery address"
                    className="w-full border border-slate-300 rounded-md p-3 resize-none"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* ✅ Smart Pincode - Only for India */}
                  {isIndianNumber && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={form.pincode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setForm({ ...form, pincode: value });
                        }}
                        placeholder="6 digits"
                        className="w-full border border-slate-300 rounded-md p-3"
                        maxLength={6}
                        required
                      />
                      {pincodeLoading && (
                        <p className="text-blue-500 text-xs mt-1">Looking up pincode...</p>
                      )}
                      {pincodeError && (
                        <p className="text-red-500 text-xs mt-1">{pincodeError}</p>
                      )}
                      {form.pincode && form.pincode.length === 6 && !pincodeError && !pincodeLoading && (
                        <p className="text-green-500 text-xs mt-1">✓ Pincode verified</p>
                      )}
                    </div>
                  )}

                  {/* ✅ Optional Postal Code for International */}
                  {!isIndianNumber && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={form.pincode}
                        onChange={(e) => setForm({ ...form, pincode: e.target.value.slice(0, 10) })}
                        placeholder="Optional"
                        className="w-full border border-slate-300 rounded-md p-3"
                        maxLength={10}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full border border-slate-300 rounded-md p-3"
                      required
                    />
                  </div>

                  {/* ✅ State Dropdown for India, Text Input for International */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      State *
                    </label>
                    {isIndianNumber ? (
                      <select
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-md p-3 bg-white"
                        required
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        placeholder="State/Province"
                        className="w-full border border-slate-300 rounded-md p-3"
                        required
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Payment */}
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Payment</h2>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Amount to Pay</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{getFinalTotal().toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Secured by</p>
                    <p className="font-semibold text-slate-700">Razorpay</p>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={!isFormValid || processing}
                  className="w-full bg-green-500 text-white font-bold py-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processing ? "Processing..." : "🔒 Pay Securely Now"}
                </button>

                {!isFormValid && (
                  <p className="text-xs text-red-500 text-center mt-2">
                    Please fill all required fields correctly
                  </p>
                )}
              </div>

              {message && (
                <div className={`rounded-lg p-3 text-center ${
                  message.includes('✅') 
                    ? 'bg-green-100 text-green-700' 
                    : message.includes('❌') 
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  <p className="text-sm">{message}</p>
                </div>
              )}

              <div className="mt-6 space-y-2">
                <p className="text-xs text-slate-500 text-center">
                  By placing this order, you agree to our Terms & Conditions
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                  <span>✓ SSL Secured</span>
                  <span>✓ Safe Payment</span>
                  <span>✓ 100% Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
