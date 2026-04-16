"use client";

import { useSharedContext, type CartItem, type Product } from "@/context/SharedContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import RelatedProductsCompact from "@/components/RelatedProductsCompact";
import CouponSheet from "@/components/CouponSheet";

interface StockInfo {
  [key: string]: {
    available: number;
    reserved: number;
    total: number;
  };
}

export default function CartPage() {
  const { cart, total, removeFromCart, increaseQty, decreaseQty, appliedCoupon, setAppliedCoupon, appliedSwagoMoney, setAppliedSwagoMoney } = useSharedContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState<StockInfo>({});
  const [walletBalance, setWalletBalance] = useState(0);

  const [couponSheetOpen, setCouponSheetOpen] = useState(false);

  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch('/api/coupon/public');
        const data = await res.json();
        if (data.success) {
          const formatted = data.coupons.map((c: any) => ({
            code: c.code,
            label: c.type === 'percentage' ? `${c.value}% Off` : `Flat ₹${c.value}`,
            description: c.description,
            minOrder: c.minAmount || 0,
            color: 'bg-indigo-50',
            accent: 'hsl(var(--swago-purple))'
          }));
          setAvailableCoupons(formatted);
        }
      } catch (e) {
        console.error('Failed to fetch public coupons', e);
      }
    };
    fetchCoupons();

    const fetchWallet = async () => {
      try {
        const res = await fetch('/api/wallet/balance');
        const data = await res.json();
        if (data.success) {
          setWalletBalance(data.totalSwagoMoney || 0);
        }
      } catch (e) {
        console.error('Failed to fetch wallet balance', e);
      }
    };
    fetchWallet();
  }, []);

  const applyCoupon = async (code: string) => {
    if (!code.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: code.toUpperCase(), orderAmount: total, cartItems: cart }),
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon({ code: data.coupon.code, discount: data.discount.amount });
        setCouponSheetOpen(false);
      } else {
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch {
      setCouponError('Could not validate coupon. Try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => setAppliedCoupon(null);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const itemIds = cart.map((item) => item.productId || item._id || item.id);
        if (itemIds.length === 0) return;
        const res = await fetch(`/api/stock?ids=${itemIds.join(',')}`);
        const data = await res.json();
        if (data.success) {
          setStockInfo(data.stock);
        }
      } catch (error) {
        console.error('Error fetching stock:', error);
      }
    };
    if (cart.length > 0) fetchStock();
  }, [cart]);

  const handleCheckout = () => {
    setLoading(true);
    router.push("/checkout");
  };

  const getProductKey = (item: CartItem): string => {
    return (item.productId?.toString() || item._id?.toString() || item.id?.toString() || '');
  };

  const savings = appliedCoupon?.discount || 0;
  const amountAfterCoupon = total - savings;
  const canUseSwagoDollars = amountAfterCoupon >= 800;
  const maxSwagoDollarsAllowed = Math.trunc(amountAfterCoupon * 0.05);
  const applicableSwagoDollars = Math.min(walletBalance, maxSwagoDollarsAllowed);

  // Reset if conditions fail
  useEffect(() => {
    if (appliedSwagoMoney > 0 && (!canUseSwagoDollars || appliedSwagoMoney > applicableSwagoDollars)) {
      setAppliedSwagoMoney(0);
    }
  }, [amountAfterCoupon, canUseSwagoDollars, applicableSwagoDollars, appliedSwagoMoney, setAppliedSwagoMoney]);

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6 sm:mb-8 border border-slate-100">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Your cart is empty</h2>
        <p className="text-sm sm:text-base text-slate-500 mb-8 font-medium">Add some smart toys to start your journey!</p>
        <Link
          href="/products"
          className="bg-[hsl(var(--swago-purple))] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs sm:text-sm shadow-md hover:opacity-90 transition-opacity"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const shippingThreshold = 500;
  const giftThreshold = 1000;
  const progressPercent = Math.min((total / giftThreshold) * 100, 100);

  return (
    <div className="bg-[#FBFCFD] min-h-screen pb-20">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 px-4 py-3 sm:py-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/products" className="p-2 hover:bg-slate-50 rounded-full transition-colors flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-800">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter">My Cart</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Secure Checkout</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-emerald-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 lg:py-10 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          <div className="w-full lg:w-2/3 flex flex-col gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl px-4 sm:px-5 py-5 border border-slate-100 shadow-sm">
              <p className={`text-[10px] sm:text-xs font-black text-center mb-4 tracking-widest ${total >= shippingThreshold ? 'text-[#1EAA5F]' : 'text-slate-600'}`}>
                {total >= giftThreshold
                  ? "🎉 All rewards added to your order!"
                  : total >= shippingThreshold
                    ? "🚚 Free Shipping unlocked!"
                    : "Free Gift on Prepaid Orders"}
              </p>

              <div className="relative mx-3 sm:mx-4 mt-2 mb-6">
                <div className="relative h-6 sm:h-8">
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
                  <div
                    className="absolute top-1/2 left-0 h-1 bg-[#61498C] -translate-y-1/2 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#61498C] z-10" />

                  <div
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{ left: `${(shippingThreshold / giftThreshold) * 100}%` }}
                  >
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 border-white transition-all duration-500 ${total >= shippingThreshold ? 'bg-[#61498C] text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d={total >= shippingThreshold ? "M4.5 12.75l6 6 9-13.5" : "M4.5 19.5h15"} />
                      </svg>
                    </div>
                  </div>

                  <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 z-10">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 border-white transition-all duration-500 ${total >= giftThreshold ? 'bg-[#61498C] text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d={total >= giftThreshold ? "M4.5 12.75l6 6 9-13.5" : "M12 4.5v15m7.5-7.5h-15"} />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="relative h-6 mt-2">
                  <div
                    className="absolute -translate-x-1/2 text-center"
                    style={{ left: `${(shippingThreshold / giftThreshold) * 100}%` }}
                  >
                    <span className={`block text-[9px] sm:text-[10px] font-black leading-none ${total >= shippingThreshold ? 'text-slate-800' : 'text-slate-400'}`}>₹{shippingThreshold}</span>
                    <span className={`block text-[8px] font-bold tracking-tight whitespace-nowrap mt-0.5 ${total >= shippingThreshold ? 'text-slate-500' : 'text-slate-400'}`}>Free Shipping</span>
                  </div>
                  <div className="absolute right-0 translate-x-[20%] sm:translate-x-0 text-right sm:text-center">
                    <span className={`block text-[9px] sm:text-[10px] font-black leading-none ${total >= giftThreshold ? 'text-slate-800' : 'text-slate-400'}`}>₹{giftThreshold}</span>
                    <span className={`block text-[8px] font-bold tracking-tight whitespace-nowrap mt-0.5 ${total >= giftThreshold ? 'text-slate-500' : 'text-slate-400'}`}>+ Gift</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              {cart.map((item) => {
                const imageUrl = item.images?.[0] || '/images/placeholder.png';
                const productId = getProductKey(item);
                const stock = stockInfo[productId];
                const isOutOfStock = stock && stock.available === 0;
                const price = typeof item.price === "number" ? item.price : 0;
                const originalPrice = item.originalPrice || price * 1.5;

                return (
                  <div key={productId} className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-sm flex flex-row gap-3 sm:gap-4 overflow-hidden items-stretch">
                    <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-xl bg-slate-50 flex-shrink-0 border border-slate-100 overflow-hidden">
                      <Image src={imageUrl} alt={item.name} fill className="object-cover" />
                      {isOutOfStock && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[9px] font-black tracking-wider backdrop-blur-sm">Out of Stock</div>}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-1 sm:gap-3">
                        <div className="flex-1 min-w-0 w-full sm:w-auto pr-0 sm:pr-2">
                          <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-snug mb-1 line-clamp-2 sm:truncate">{item.name}</h3>
                          <span className="text-[8px] sm:text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full tracking-widest inline-block truncate max-w-full">
                            Mystery reward inside
                          </span>
                        </div>
                        <div className="flex flex-row sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0 mt-1 sm:mt-0 w-full sm:w-auto">
                          <span className="text-sm sm:text-lg font-black text-slate-900 tabular-nums leading-none">₹{price}</span>
                          <span className="text-[10px] text-slate-400 line-through font-bold tabular-nums sm:mt-0.5">₹{originalPrice.toFixed(0)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-3 sm:mt-auto pt-2 border-t border-slate-50 sm:border-none sm:pt-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <button
                            onClick={() => removeFromCart(productId)}
                            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-slate-50 rounded-lg sm:rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-slate-100 flex-shrink-0"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>

                          <div className="flex items-center bg-slate-50 rounded-lg sm:rounded-xl border border-slate-100 h-8 sm:h-10">
                            <button onClick={() => decreaseQty(productId)} className="w-8 sm:w-10 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 font-bold transition-colors">−</button>
                            <span className="w-6 sm:w-8 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                            <button onClick={() => increaseQty(productId)} disabled={isOutOfStock} className="w-8 sm:w-10 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 font-bold transition-colors">+</button>
                          </div>
                        </div>

                        <div className="flex flex-col items-end whitespace-nowrap">
                          <span className="hidden sm:block text-[9px] font-bold text-slate-400 tracking-widest mb-0.5">Subtotal</span>
                          <span className="text-sm sm:text-base font-black text-slate-900 tabular-nums">₹{(price * item.quantity).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl px-4 sm:px-5 py-4 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                    <path d="M2.25 12a.75.75 0 0 1 .75-.75h1.12a.75.75 0 1 1 0 1.5H3a.75.75 0 0 1-.75-.75Zm6.732-5.464a.75.75 0 0 1 1.06 0l.793.793a.75.75 0 1 1-1.06 1.06l-.793-.793a.75.75 0 0 1 0-1.06Zm1.06 9.868a.75.75 0 0 1 0 1.06l-.793.793a.75.75 0 1 1-1.06-1.06l.793-.793a.75.75 0 0 1 1.06 0ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0a.75.75 0 0 1 .75-.75H21a.75.75 0 1 1 0 1.5h-2.25a.75.75 0 0 1-.75-.75Zm-6.732-5.464a.75.75 0 0 1 0 1.06l-.793.793a.75.75 0 0 1-1.06-1.06l.793-.793a.75.75 0 0 1 1.06 0Zm-1.06 9.868a.75.75 0 0 1-1.06 0l-.793-.793a.75.75 0 1 1 1.06-1.06l.793.793a.75.75 0 0 1 0 1.06ZM12 2.25a.75.75 0 0 1 .75.75V4.12a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Zm0 17.63a.75.75 0 0 1 .75.75v1.12a.75.75 0 0 1-1.5 0V20.63a.75.75 0 0 1 .75-.75Z" />
                  </svg>
                </div>
                <h2 className="text-xs font-black text-slate-800 tracking-wide flex-1 m-0">Coupons</h2>
                {appliedCoupon && (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full tracking-widest">Applied</span>
                )}
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <div>
                    <span className="text-xs font-black text-emerald-800 tracking-wide">{appliedCoupon.code}</span>
                    <p className="text-[10px] text-emerald-600 font-bold m-0 mt-0.5">Saved ₹{appliedCoupon.discount.toFixed(0)}!</p>
                  </div>
                  <button onClick={removeCoupon} className="text-[10px] font-bold text-rose-600 tracking-widest border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-100/50 transition-colors bg-white">Remove</button>
                </div>
              ) : (
                <button
                  onClick={() => setCouponSheetOpen(true)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 group flex items-center justify-between hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg text-slate-600 border border-slate-200 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75-3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v5.25a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-slate-700 tracking-tight">View Coupons</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">{availableCoupons.length} Offers</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </button>
              )}

              {walletBalance > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-purple-50 p-1.5 rounded-lg text-purple-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.484-1.112 2.428 0 1.369.962 2.406 2.022 2.898 1.201.558 2.397.864 2.397 1.468 0 .584-.528.924-1.15.924-.407 0-.76-.17-1.127-.446a.75.75 0 00-1.15.924c.712.886 1.706 1.417 2.766 1.572V18a.75.75 0 001.5 0v-.816a3.836 3.836 0 001.72-.756c.712-.566 1.112-1.484 1.112-2.428 0-1.369-.962-2.406-2.022-2.898-1.201-.558-2.397-.864-2.397-1.468 0-.584.528-.924 1.15-.924.407 0 .76.17 1.127.446a.75.75 0 001.15-.924c-.712-.886-1.706-1.417-2.766-1.572V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h2 className="text-xs font-black text-slate-800 tracking-wide flex-1 m-0">Swago Dollars</h2>
                    {appliedSwagoMoney > 0 && (
                      <span className="text-[10px] font-black text-purple-600 font-bold bg-purple-100 px-2 py-0.5 rounded-full tracking-widest">Applied</span>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-xs font-bold text-slate-700 flex flex-col">
                        <span>Balance: {walletBalance} SD</span>
                      </div>

                      {canUseSwagoDollars && applicableSwagoDollars > 0 ? (
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={appliedSwagoMoney > 0}
                              onChange={(e) => setAppliedSwagoMoney(e.target.checked ? applicableSwagoDollars : 0)}
                            />
                            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                          </label>
                        </div>
                      ) : null}
                    </div>

                    {!canUseSwagoDollars ? (
                      <p className="text-[10px] text-slate-500 font-bold mt-1 leading-tight">
                        Add ₹{(800 - amountAfterCoupon).toFixed(0)} more to unlock max 5% Swago Dollars savings!
                      </p>
                    ) : applicableSwagoDollars > 0 ? (
                      <p className="text-[10px] text-purple-600 font-bold mt-1 leading-tight">
                        You can use {applicableSwagoDollars} SD (5% of order) for this purchase.
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-sm overflow-hidden">
              <h2 className="text-[11px] sm:text-xs font-black text-slate-800 tracking-wide mb-2 sm:mb-3 flex items-center gap-2">
                <span className="text-pink-500">✨</span> Also Love To Buy
              </h2>
              <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none snap-x snap-mandatory">
                <RelatedProductsCompact currentProductId="cart" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-3">
              <h2 className="text-xs sm:text-sm font-black text-slate-800 tracking-wide mb-2">Final Summary</h2>

              <div className="space-y-2.5">
                <div className="flex justify-between text-slate-500 text-[10px] sm:text-[11px] font-bold tracking-widest">
                  <span>Cart Total</span>
                  <span className="text-slate-900 tabular-nums font-black">₹{total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[10px] sm:text-[11px] font-bold tracking-widest">
                  <span>Shipping Fee</span>
                  <span className="text-[#1EAA5F] font-black">Free</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[10px] sm:text-[11px] font-bold tracking-widest">
                  <span>Savings</span>
                  <span className="text-[#1EAA5F] font-black tabular-nums">-₹{savings.toFixed(0)}</span>
                </div>
                {appliedSwagoMoney > 0 && (
                  <div className="flex justify-between text-slate-500 text-[10px] sm:text-[11px] font-bold tracking-widest">
                    <span>Swago Dollars</span>
                    <span className="text-purple-600 font-black tabular-nums">-₹{appliedSwagoMoney}</span>
                  </div>
                )}

                <hr className="border-dashed border-slate-200 my-3" />

                <div className="flex justify-between items-start pt-1">
                  <span className="text-xs sm:text-sm font-black text-slate-700 tracking-tight mt-1">Estimated total</span>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter tabular-nums leading-none block">₹{(amountAfterCoupon - appliedSwagoMoney).toFixed(0)}</span>
                    <span className="text-[9px] sm:text-[10px] font-black text-[#1EAA5F] tracking-wider mt-1 block">You saved ₹{(savings + appliedSwagoMoney).toFixed(0)}!</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-[hsl(var(--swago-purple))] text-white font-black py-4 px-6 rounded-xl text-sm hover:opacity-90 transition-opacity transform active:scale-[0.98] tracking-[0.15em] mt-3 flex items-center justify-between group disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <span className="ml-1 tracking-widest">Proceed</span>
                <div className="bg-white/20 p-1.5 rounded-lg group-hover:translate-x-1 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </button>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025 4.486 4.486 0 0 0-.619-1.813C4.03 15.656 3 13.921 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Support</p>
                <p className="text-sm font-black text-slate-800 tracking-tighter">+91 62838 83397</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-4 max-w-xl mx-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 tracking-tight mb-1 leading-none">Estimated total</span>
            <div className="flex flex-col items-start gap-1">
              <span className="text-xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">₹{(amountAfterCoupon - appliedSwagoMoney).toFixed(0)}</span>
              <span className="text-[9px] font-black text-[#1EAA5F] tracking-wider leading-none">You saved ₹{(savings + appliedSwagoMoney).toFixed(0)}!</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="flex-[1.5] bg-[hsl(var(--swago-purple))] text-white font-black h-12 rounded-xl active:scale-[0.98] transition-transform text-xs tracking-[0.1em] flex items-center justify-center gap-2 disabled:opacity-75"
          >
            Checkout
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>

      <CouponSheet
        isOpen={couponSheetOpen}
        onClose={() => setCouponSheetOpen(false)}
        onApply={applyCoupon}
        total={total}
        availableCoupons={availableCoupons}
        loading={couponLoading}
        error={couponError}
      />
    </div>
  );
}
