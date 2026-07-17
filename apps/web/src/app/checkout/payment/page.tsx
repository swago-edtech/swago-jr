"use client";

import { useEffect, useState } from "react";
import { useSharedContext } from "@/context/SharedContext";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { formatPrice } from "@swago/utils";
import { RazorpayOptions, RazorpaySuccessResponse, RazorpayInstance, RazorpayFailedEvent } from "@swago/types";
import { Feedback } from "@/lib/feedback";



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

type CheckoutData = {
    form: {
        name: string;
        age: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
    };
    appliedCoupon: Coupon | null;
    discount: Discount | null;
    total: number;
    swagoMoneyRedeemed: number;
    swagoMoneyKidId: string | null;
    finalAmount: number;
};

export default function PaymentMethodPage() {
    const { cart, clearCart, total, refreshCartPrices } = useSharedContext();
    const router = useRouter();
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState("");
    const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
    // Check if Razorpay is already loaded (cached)
    const [razorpayLoaded, setRazorpayLoaded] = useState(() => {
        if (typeof window !== 'undefined' && window.Razorpay) {
            return true;
        }
        return false;
    });

    // Load checkout data from sessionStorage
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem("checkout_data");
            if (stored) {
                const data = JSON.parse(stored);
                setCheckoutData(data);
            } else {
                // No checkout data - redirect back
                router.push("/checkout");
            }
        } catch (e) {
            console.error("Error loading checkout data:", e);
            router.push("/checkout");
        }
    }, [router]);

    // Refresh cart prices on mount
    useEffect(() => {
        refreshCartPrices();
    }, []);

    // Redirect if cart is empty
    useEffect(() => {
        if (cart.length === 0 && !processing) {
            // Check if we just completed an order
            const justCompleted = sessionStorage.getItem("order_completed");
            if (!justCompleted) {
                router.push("/checkout");
            }
        }
    }, [cart, router, processing]);

    const finalAmount = checkoutData?.finalAmount || total;
    const form = checkoutData?.form;


    // Handle Razorpay payment
    const handlePayOnline = async () => {
        if (!form || !checkoutData) return;

        // Check if Razorpay script is loaded
        if (!window.Razorpay) {
            setMessage("⏳ Payment gateway loading... Please wait a moment and try again.");
            return;
        }

        setProcessing(true);
        setMessage("Verifying prices...");

        // ✅ Pre-payment price validation
        try {
            const requestItems = cart.map(item => ({
                productId: (item as any).productId?.toString() || item._id?.toString() || item.id?.toString() || '',
                quantity: item.quantity,
                price: item.price,
                name: item.name,
            }));

            const refreshRes = await fetch('/api/cart/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: requestItems }),
            });

            if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                if (refreshData.hasChanges && (refreshData.changes?.length > 0 || refreshData.removedItems?.length > 0)) {
                    // Apply updates and redirect back to checkout
                    await refreshCartPrices();
                    setMessage("");
                    setProcessing(false);
                    alert("Some prices have changed. Please review your updated cart before proceeding.");
                    router.push("/checkout");
                    return;
                }
            }
        } catch (error) {
            console.error('Pre-payment price check failed:', error);
        }

        setMessage("Processing payment...");

        try {
            // Validate checkout data
            const validateRes = await fetch("/api/validate-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const validateData = await validateRes.json();

            if (!validateData.valid) {
                setMessage(validateData.error || "❌ Validation failed. Please check your details.");
                setProcessing(false);
                return;
            }

            // Create Razorpay order
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
                        coupon: checkoutData.appliedCoupon,
                        discount: checkoutData.discount,
                        originalAmount: total,
                        swagoMoneyRedeemed: checkoutData.swagoMoneyRedeemed,
                        swagoMoneyKidId: checkoutData.swagoMoneyKidId,
                        finalAmount: finalAmount,
                    }
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                setMessage(errorData.error || "❌ Failed to create order.");
                setProcessing(false);
                return;
            }

            const { id: razorpay_order_id, amount, key, orderId } = await res.json();

            // Open Razorpay
            const options: RazorpayOptions = {
                key: key,
                amount: amount,
                currency: "INR",
                name: "Swago Jr",
                description: `Order ${orderId}`,
                order_id: razorpay_order_id,
                handler: async function (response) {
                    console.log('🎯 Razorpay response:', response);

                    // Validate response
                    if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
                        console.error("❌ Missing fields:", response);
                        setMessage("❌ Payment verification failed: Incomplete response.");
                        setProcessing(false);
                        return;
                    }

                    setMessage("Verifying payment...");

                    const verificationRes = await fetch("/api/payment/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: orderId,
                        }),
                    });

                    if (verificationRes.ok) {
                        const result = await verificationRes.json();
                        setMessage(`✅ Payment successful! Order ${result.orderId} confirmed.`);
                        Feedback.playSuccess();
                        clearCart();
                        sessionStorage.removeItem("checkout_data");
                        sessionStorage.setItem("order_completed", "true");
                        setTimeout(() => {
                            sessionStorage.removeItem("order_completed");
                            router.push("/orders");
                        }, 1500);
                    } else {
                        setMessage(`❌ Payment verification failed for ${orderId}. Please contact support.`);
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
                    orderId: orderId,
                },
                theme: {
                    color: "#7c3aed",
                },
                modal: {
                    ondismiss: function () {
                        console.log("⚠️ Razorpay modal dismissed");
                        setMessage("❌ Payment cancelled");
                        setProcessing(false);
                    },
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

    // Handle COD order
    const handleCOD = async () => {
        if (!form || !checkoutData) return;

        setProcessing(true);
        setMessage("Verifying prices...");

        // ✅ Pre-payment price validation for COD
        try {
            const requestItems = cart.map(item => ({
                productId: (item as any).productId?.toString() || item._id?.toString() || item.id?.toString() || '',
                quantity: item.quantity,
                price: item.price,
                name: item.name,
            }));

            const refreshRes = await fetch('/api/cart/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: requestItems }),
            });

            if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                if (refreshData.hasChanges && (refreshData.changes?.length > 0 || refreshData.removedItems?.length > 0)) {
                    await refreshCartPrices();
                    setMessage("");
                    setProcessing(false);
                    alert("Some prices have changed. Please review your updated cart before proceeding.");
                    router.push("/checkout");
                    return;
                }
            }
        } catch (error) {
            console.error('Pre-payment price check failed:', error);
        }

        setMessage("Processing COD order...");

        try {
            // Validate checkout data
            const validateRes = await fetch("/api/validate-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const validateData = await validateRes.json();

            if (!validateData.valid) {
                setMessage(validateData.error || "❌ Validation failed. Please check your details.");
                setProcessing(false);
                return;
            }

            // Create COD order
            const res = await fetch("/api/payment/cod", {
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
                        coupon: checkoutData.appliedCoupon,
                        discount: checkoutData.discount,
                        originalAmount: total,
                        swagoMoneyRedeemed: checkoutData.swagoMoneyRedeemed,
                        swagoMoneyKidId: checkoutData.swagoMoneyKidId,
                        finalAmount: finalAmount,
                    }
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                setMessage(errorData.error || "❌ Failed to create COD order.");
                setProcessing(false);
                return;
            }

            const result = await res.json();
            setMessage(`✅ Order ${result.orderId} placed successfully!`);
            Feedback.playSuccess();
            clearCart();
            sessionStorage.removeItem("checkout_data");
            sessionStorage.setItem("order_completed", "true");
            setTimeout(() => {
                sessionStorage.removeItem("order_completed");
                router.push("/orders");
            }, 1500);

        } catch (error) {
            console.error("COD order error:", error);
            setMessage("❌ An error occurred. Please try again.");
            setProcessing(false);
        }
    };

    if (!checkoutData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <>
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="beforeInteractive"
                onLoad={() => setRazorpayLoaded(true)}
                onReady={() => setRazorpayLoaded(true)}
            />

            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    {/* Back Button */}
                    <Link
                        href="/checkout"
                        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to checkout
                    </Link>

                    <div className="max-w-2xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                                Choose Payment Method
                            </h1>
                            <p className="text-slate-600">
                                Select how you&apos;d like to pay for your order
                            </p>
                        </div>

                        {/* Order Summary Card */}
                        <div className="bg-white rounded-2xl shadow-lg border p-6 mb-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="text-2xl">🛒</span> Order Summary
                            </h2>

                            <div className="space-y-3">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal ({cart.length} items)</span>
                                    <span>{formatPrice(checkoutData.total)}</span>
                                </div>

                                {checkoutData.discount && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount ({checkoutData.appliedCoupon?.code})</span>
                                        <span>-{formatPrice(checkoutData.discount.savedAmount)}</span>
                                    </div>
                                )}

                                {checkoutData.swagoMoneyRedeemed > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Swago Money Redeemed</span>
                                        <span>-{formatPrice(checkoutData.swagoMoneyRedeemed)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-slate-600">
                                    <span>Shipping</span>
                                    <span className="text-green-600 font-medium">FREE*</span>
                                </div>
                                <p className="text-[10px] text-slate-400 text-right font-bold tracking-tight">*Free on Online Pay / COD above ₹1450</p>

                                <div className="border-t pt-3 flex justify-between text-xl font-bold">
                                    <span>Total</span>
                                    <span className="text-purple-600">{formatPrice(finalAmount)}</span>
                                </div>
                            </div>

                            {/* Delivery Address Preview */}
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-sm text-slate-500 mb-1">Delivering to:</p>
                                <p className="font-medium">{form?.name}</p>
                                <p className="text-sm text-slate-600">
                                    {form?.address}, {form?.city}, {form?.state} - {form?.pincode}
                                </p>
                            </div>
                        </div>

                        {/* Message */}
                        {message && (
                            <div className={`p-4 rounded-xl mb-6 text-center font-medium ${message.includes("✅")
                                ? "bg-green-100 text-green-700"
                                : message.includes("❌")
                                    ? "bg-red-100 text-red-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}>
                                {message}
                            </div>
                        )}

                        {/* Payment Options */}
                        <div className="space-y-4">
                            {/* Pay Online Card */}
                            <button
                                onClick={handlePayOnline}
                                disabled={processing}
                                className="w-full bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-green-500 p-6 text-left transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                                        💳
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-900 mb-1">
                                            {!razorpayLoaded ? 'Loading...' : 'Pay Online'}
                                        </h3>
                                        <p className="text-slate-600 text-sm mb-3">
                                            UPI, Credit/Debit Cards, Net Banking, Wallets
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">UPI</span>
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">Visa</span>
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">Mastercard</span>
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">Paytm</span>
                                        </div>
                                    </div>
                                    <div className="text-green-500 text-2xl">
                                        →
                                    </div>
                                </div>
                            </button>

                            {/* COD Card */}
                            <button
                                onClick={handleCOD}
                                disabled={processing}
                                className="w-full bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-amber-500 p-6 text-left transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
                                        🏠
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-900 mb-1">
                                            Cash on Delivery
                                        </h3>
                                        <p className="text-slate-600 text-sm mb-3">
                                            Pay when your order arrives at your doorstep
                                        </p>
                                        <div className="flex items-center gap-2 text-amber-700 bg-amber-100 rounded-lg px-3 py-1.5 text-sm font-medium w-fit">
                                            <span>💰</span>
                                            <span>Pay {formatPrice(finalAmount)} on delivery</span>
                                        </div>
                                    </div>
                                    <div className="text-amber-500 text-2xl">
                                        →
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Security Badge */}
                        <div className="mt-8 text-center">
                            <div className="inline-flex items-center gap-2 text-slate-500 text-sm">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>Your payment information is secure and encrypted</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
