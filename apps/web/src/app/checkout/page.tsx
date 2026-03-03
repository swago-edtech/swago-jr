"use client";
import { useEffect, useState } from "react";
import { useSharedContext } from "@/context/SharedContext";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Image from "next/image";
import PhoneInput from 'react-phone-number-input';
import { RazorpayOptions, RazorpaySuccessResponse, RazorpayInstance, RazorpayFailedEvent } from "@swago/types";
import 'react-phone-number-input/style.css';
import { isPossiblePhoneNumber, parsePhoneNumber } from 'react-phone-number-input';


import { motion } from "framer-motion";

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

const DEFAULT_REDEMPTION_TIERS = [
  { target: 799, off: 50 },
  { target: 1200, off: 75 },
  { target: 2000, off: 100 },
  { target: 3000, off: 150 }
];

const DEFAULT_BONUS_ITEMS = [
  { threshold: 999, label: "Mini Swago Game Card", slug: "mini-swago-game-card" },
  { threshold: 1499, label: "Swago Blind Bag", slug: "swago-blind-bag" },
  { threshold: 1999, label: "Special Edition Item", slug: "special-edition-item" }
];

// ✅ ZEPRO Reference: Redemption Progress Component
const RedemptionProgress = ({ total, tiers }: { total: number, tiers: any[] }) => {
  const TIERS = tiers.length > 0 ? tiers : DEFAULT_REDEMPTION_TIERS;

  const currentTierIndex = TIERS.findLastIndex(t => total >= t.target);
  const nextTier = TIERS.find(t => total < t.target);

  if (!nextTier) return (
    <div className="bg-green-50 border border-green-100 p-4 rounded-xl mb-4 text-center">
      <p className="text-sm font-bold text-green-700">🎉 Maximum Redemption Unlocked!</p>
      <p className="text-xs text-green-600">You can redeem up to ₹150 Swago Money on this order.</p>
    </div>
  );

  const currentStart = currentTierIndex === -1 ? 0 : TIERS[currentTierIndex].target;
  const progress = Math.min(100, Math.max(0, ((total - currentStart) / (nextTier.target - currentStart)) * 100));
  const remaining = nextTier.target - total;

  return (
    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4">
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs font-bold text-blue-800">
          Add <span className="text-lg">₹{Math.ceil(remaining)}</span> more to unlock <span className="text-lg">₹{nextTier.off}</span> redemption
        </p>
        <div className="text-[10px] bg-blue-100 px-2 py-0.5 rounded-full text-blue-600 font-black">
          LEVEL UP 🚀
        </div>
      </div>

      <div className="relative h-2.5 w-full bg-blue-100 rounded-full overflow-hidden mb-1">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-600"
        />
      </div>

      <div className="flex justify-between text-[10px] font-bold text-blue-400">
        <span>₹{currentStart}</span>
        <span>₹{nextTier.target}</span>
      </div>
    </div>
  );
};

// ✅ ZEPRO Reference: Bonus Item Unlock Component
const BonusUnlocker = ({ total, cart, addToCart, bonusItems }: { total: number, cart: any[], addToCart: any, bonusItems: any[] }) => {
  const THRESHOLDS = bonusItems.length > 0 ? bonusItems : DEFAULT_BONUS_ITEMS;

  const unlocked = THRESHOLDS.filter(t => total >= t.threshold);
  const isAlreadyAdded = (slug: string) => cart.some(item => (item.slug === slug || item._id === slug) && item.price === 1);

  if (unlocked.length === 0) {
    const next = THRESHOLDS[0];
    return (
      <div className="bg-orange-50 border-dashed border-2 border-orange-200 p-4 rounded-xl mb-6 text-center">
        <p className="text-xs text-orange-600 mb-1">🎁 Unlock a mystery gift at ₹1</p>
        <p className="text-[10px] font-bold text-orange-400">Shop for ₹{next.threshold - total} more to unlock</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-dashed border-purple-200 p-4 rounded-xl mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🌟</span>
        <div>
          <h3 className="text-sm font-black text-purple-800">Bonus Unlocked!</h3>
          <p className="text-[10px] text-purple-500">Add these special items for just ₹1 each</p>
        </div>
      </div>

      <div className="space-y-2">
        {unlocked.map(item => {
          const added = isAlreadyAdded(item.slug);
          return (
            <div key={item.slug} className="flex items-center justify-between bg-white/60 p-2 rounded-lg border border-purple-100">
              <span className="text-xs font-bold text-purple-800">{item.label}</span>
              <button
                onClick={async () => {
                  if (added) return;
                  const res = await fetch(`/api/products/${item.slug}`);
                  const data = await res.json();
                  if (data.success && data.product) {
                    addToCart({ ...data.product, price: 1 }, 1);
                  } else {
                    addToCart({
                      name: item.label,
                      price: 1,
                      images: ['/images/placeholder.png'],
                      slug: item.slug,
                      id: item.slug,
                      _id: item.slug
                    }, 1);
                  }
                }}
                disabled={added}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${added
                  ? "bg-green-100 text-green-600"
                  : "bg-purple-600 text-white hover:scale-105 active:scale-95"
                  }`}
              >
                {added ? "ADDED ✅" : "ADD AT ₹1"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
  const { cart, clearCart, user, total, isLoadingUser, addToCart } = useSharedContext();
  const router = useRouter();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");

  const [isIndianNumber, setIsIndianNumber] = useState(true);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  // ✅ Payment method selector (kept for potential future use)
  const [, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  // NOTE: showPaymentModal removed - now using dedicated /checkout/payment page

  const [kidProfiles, setKidProfiles] = useState<any[]>([]);
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
  const [swagoMoneyRedeemed, setSwagoMoneyRedeemed] = useState(0);
  const [bonusProducts, setBonusProducts] = useState<any[]>([]);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [promotion, setPromotion] = useState<any>(null);

  // ✅ Pre-fill form and fetch kid profiles
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        name: user.name || prev.name,
      }));
      fetchKidProfiles();
      fetchPromotion();
    }
  }, [user]);

  const fetchKidProfiles = async () => {
    try {
      const res = await fetch("/api/kid-profiles");
      if (res.ok) {
        const data = await res.json();
        setKidProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error("Failed to fetch kid profiles:", error);
    }
  };

  const fetchPromotion = async () => {
    try {
      const res = await fetch("/api/promotion");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.promotion) {
          setPromotion(data.promotion);
          fetchBonusProducts(data.promotion.bonusItems);
        }
      }
    } catch (error) {
      console.error("Failed to fetch promotion:", error);
      fetchBonusProducts(DEFAULT_BONUS_ITEMS);
    }
  };

  const fetchBonusProducts = async (bonusItems: any[] = []) => {
    const itemsToFetch = bonusItems.length > 0 ? bonusItems : DEFAULT_BONUS_ITEMS;
    setBonusLoading(true);
    try {
      const slugs = itemsToFetch.map(item => item.slug);
      const products = [];
      for (const slug of slugs) {
        const res = await fetch(`/api/products/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.product) products.push(data.product);
        }
      }
      setBonusProducts(products);
    } catch (error) {
      console.error("Failed to fetch bonus products:", error);
    } finally {
      setBonusLoading(false);
    }
  };

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

  const calculateMaxRedeemable = (orderAmount: number) => {
    const tiers = (promotion?.redemptionTiers || DEFAULT_REDEMPTION_TIERS)
      .sort((a: any, b: any) => a.target - b.target);

    let maxOff = 0;
    for (const tier of tiers) {
      if (orderAmount >= tier.target) {
        maxOff = tier.off;
      } else {
        break;
      }
    }
    return maxOff;
  };

  const currentMaxRedeemable = calculateMaxRedeemable(discount ? discount.finalAmount : total);

  const getFinalTotal = () => {
    const amountAfterCoupon = discount ? discount.finalAmount : total;
    return Math.max(0, amountAfterCoupon - swagoMoneyRedeemed);
  };

  // ✅ NEW: Redirect to payment method selection page
  const proceedToPayment = () => {
    // Store checkout data in sessionStorage
    const checkoutData = {
      form: form,
      appliedCoupon: appliedCoupon,
      discount: discount,
      total: total,
      swagoMoneyRedeemed: swagoMoneyRedeemed,
      swagoMoneyKidId: selectedKidId,
      finalAmount: getFinalTotal(),
    };

    try {
      sessionStorage.setItem("checkout_data", JSON.stringify(checkoutData));
      router.push("/checkout/payment");
    } catch (e) {
      console.error("Error storing checkout data:", e);
      setMessage("❌ Failed to proceed. Please try again.");
    }
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
      setMessage("Creating your order...");

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
        const errorData = await res.json();
        setMessage(errorData.error || "❌ Failed to create order.");
        setProcessing(false);
        return;
      }

      const razorpayOrder = await res.json();

      // ✅ NEW: Get our custom orderId from response
      const orderId = razorpayOrder.orderId;
      console.log('📦 Order created:', orderId);

      setMessage(`Order ${orderId} created. Opening payment...`);

      const configRes = await fetch("/api/razorpay/config");
      if (!configRes.ok) {
        setMessage("❌ Failed to load payment configuration.");
        setProcessing(false);
        return;
      }
      const config = await configRes.json();

      const options: RazorpayOptions = {
        key: config.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Swago ",
        description: "Learning Kits Purchase",
        order_id: razorpayOrder.id,
        handler: async function (response) {
          setMessage(`Verifying payment for ${orderId}...`);

          const verificationRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId,  // ✅ Pass our orderId
            }),
          });

          if (verificationRes.ok) {
            const result = await verificationRes.json();
            setMessage(`✅ Payment successful! Order ${result.orderId} confirmed. Redirecting...`);
            clearCart();
            setTimeout(() => {
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
          orderId: orderId,  // ✅ Include orderId in Razorpay notes
        },
        theme: {
          color: "#3b82f6",
        },
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on("payment.failed", function (response) {
        setMessage(`❌ Payment failed for ${orderId}. Error: ${response.error.description}`);
        setProcessing(false);
      });

      paymentObject.open();

    } catch (error) {
      console.error("Payment error:", error);
      setMessage("❌ An error occurred. Please try again.");
      setProcessing(false);
    }
  };

  // ✅ COD Order Handler
  const handleCODOrder = async () => {
    setProcessing(true);
    setMessage("Creating your COD order...");

    const finalAmount = getFinalTotal();

    try {
      // Validate checkout
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
            coupon: appliedCoupon,
            discount: discount,
            originalAmount: total,
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
      setMessage(`✅ COD Order ${result.orderId} placed successfully! Redirecting...`);
      clearCart();
      setTimeout(() => {
        router.push("/orders");
      }, 1500);

    } catch (error) {
      console.error("COD order error:", error);
      setMessage("❌ An error occurred. Please try again.");
      setProcessing(false);
    }
  };

  // NOTE: handleCheckout removed - payment selection now on dedicated /checkout/payment page

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

  // ✅ India-only: We only deliver to Indian addresses
  const isFormValid = form.name && form.email && form.phone &&
    isPossiblePhoneNumber(form.phone || '') &&
    isIndianNumber &&  // Must be Indian number
    form.age && form.address &&
    form.city && form.state &&
    form.pincode && form.pincode.length === 6;

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
                  {/* ZEPRO Reference: Redemption Progress */}
                  <RedemptionProgress total={total} tiers={promotion?.redemptionTiers || []} />

                  {/* ZEPRO Reference: Bonus Item Unlock */}
                  <BonusUnlocker
                    total={total}
                    cart={cart}
                    addToCart={addToCart}
                    bonusItems={promotion?.bonusItems || []}
                  />

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
                      {swagoMoneyRedeemed > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>Swago Money Redeemed:</span>
                          <span>-₹{swagoMoneyRedeemed.toFixed(2)}</span>
                        </div>
                      )}

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

              <div className="bg-white rounded-lg border p-4 mb-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="text-xl">💰</span> Swago Wallet
                </h3>

                {kidProfiles.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No kid profiles found with Swago Money.</p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600">
                      Redeem your Swago Dollars (SD) for instant discounts.
                      <br />
                      <span className="font-medium text-[hsl(var(--swago-purple))]">1 SD = ₹1</span>
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                      {kidProfiles.map((kid) => {
                        const balance = kid.ambassador?.swagoMoney || 0;
                        const isSelected = selectedKidId === kid._id;
                        const canRedeem = balance > 0;

                        return (
                          <button
                            key={kid._id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedKidId(null);
                                setSwagoMoneyRedeemed(0);
                              } else {
                                setSelectedKidId(kid._id);
                                setSwagoMoneyRedeemed(Math.min(balance, currentMaxRedeemable));
                              }
                            }}
                            disabled={!canRedeem && !isSelected}
                            className={`flex justify-between items-center p-3 rounded-lg border-2 transition-all ${isSelected
                              ? "border-[hsl(var(--swago-purple))] bg-[hsl(var(--swago-purple))]/5"
                              : "border-slate-100 bg-slate-50 hover:border-slate-300"
                              } ${!canRedeem && !isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <div className="flex items-center gap-3 text-left">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-white flex-shrink-0 border">
                                <Image
                                  src={kid.avatarColor || "/images/swoo.png"}
                                  alt={kid.name}
                                  width={32}
                                  height={32}
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{kid.name}</p>
                                <p className="text-[10px] text-slate-500">{balance} SD Available</p>
                              </div>
                            </div>

                            {isSelected ? (
                              <div className="text-right">
                                <span className="text-xs font-black text-green-600">-₹{swagoMoneyRedeemed}</span>
                                <div className="text-[10px] text-green-600 font-bold">Applied</div>
                              </div>
                            ) : (
                              <div className="text-xs font-bold text-slate-400">
                                {canRedeem ? "Click to use" : "Empty"}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {selectedKidId && (
                      <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg text-[10px] text-blue-700">
                        ℹ️ Max redeemable for this order: ₹{currentMaxRedeemable}
                      </div>
                    )}
                  </div>
                )}
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

              {/* ✅ India-only notice */}
              {!isIndianNumber && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-amber-700 text-sm">
                    ⚠️ We currently only deliver to India. Please use an Indian phone number (+91).
                  </p>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Amount to Pay</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{getFinalTotal().toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Secure Checkout</p>
                    <p className="font-semibold text-slate-700">Swago</p>
                  </div>
                </div>

                <button
                  onClick={proceedToPayment}
                  disabled={!isFormValid || processing}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processing ? "Processing..." : "🔒 Proceed to Pay"}
                </button>

                {!isFormValid && (
                  <p className="text-xs text-red-500 text-center mt-2">
                    {!isIndianNumber
                      ? 'We only deliver to India (+91 numbers)'
                      : 'Please fill all required fields correctly'
                    }
                  </p>
                )}
              </div>

              {message && (
                <div className={`rounded-lg p-3 text-center ${message.includes('✅')
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

      {/* Payment method selection is now on a separate page: /checkout/payment */}
    </>
  );
}
