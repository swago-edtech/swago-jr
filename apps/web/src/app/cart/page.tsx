"use client";

import { useSharedContext, type CartItem, type Product } from "@/context/SharedContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import RelatedProductsCompact from "@/components/RelatedProductsCompact";

interface StockInfo {
  [key: string]: {
    available: number;
    reserved: number;
    total: number;
  };
}

export default function CartPage() {
  const { cart, total, removeFromCart, increaseQty, decreaseQty } = useSharedContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState<StockInfo>({});
  const [activeTab, setActiveTab] = useState('Today');

  // Coupon state
  const [couponSheetOpen, setCouponSheetOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const AVAILABLE_COUPONS = [
    { code: 'SAVE25', label: '25% Off', description: 'Get 25% off on your order', minOrder: 0, color: 'from-purple-50 to-purple-100', accent: '#61498C' },
    { code: 'EXTRA10', label: '10% Off', description: 'Extra 10% off on orders above ₹500', minOrder: 500, color: 'from-emerald-50 to-emerald-100', accent: '#1E8B4F' },
    { code: 'FLAT50', label: 'Flat ₹50', description: 'Flat ₹50 off on prepaid orders', minOrder: 0, color: 'from-orange-50 to-orange-100', accent: '#EA580C' },
  ];

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
        setCouponInput('');
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

  // Fetch stock info for items in cart
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const itemIds = cart.map(item => item.productId || item._id || item.id);
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
    return item.productId?.toString() || item._id?.toString() || item.id?.toString() || '';
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
           </svg>
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Your cart is empty</h2>
        <p className="text-slate-500 mb-8 font-medium">Add some smart toys to start your journey!</p>
        <Link 
          href="/products" 
          className="bg-[hsl(var(--swago-purple))] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-100 hover:scale-105 transition-transform"
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
    <div className="bg-[#FBFCFD] min-h-screen pb-24">
      {/* Header Sticky Section */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 px-4 py-2 md:py-3 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Link href="/products" className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-800">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                 </svg>
              </Link>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">My Cart</h1>
           </div>
           <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Secure Checkout</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-emerald-500">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-8 items-start">
          
          {/* Main Cart Items Column */}
          <div className="lg:col-span-8 space-y-3">
            
            {/* Rewards Progress Banner */}
            <div className="bg-white rounded-[2rem] px-5 pt-3 pb-5 border border-slate-100 shadow-sm">
                <p className="text-[#6B5A99] text-[10px] font-bold text-center mb-4 uppercase tracking-wider">
                  {total >= giftThreshold 
                    ? "🎉 All rewards added to your order!" 
                    : total >= shippingThreshold 
                      ? "🚚 Free Shipping unlocked!" 
                      : "Free Gift on PRE-PAID orders"}
                </p>

                {/* Progress track — milestones positioned at exact % */}
                <div className="relative mx-4">
                  {/* Height container for icons (36px) */}
                  <div className="relative h-9">
                    {/* Background track */}
                    <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-slate-100 -translate-y-1/2 rounded-full" />
                    {/* Progress fill */}
                    <div
                      className="absolute top-1/2 left-0 h-[3px] bg-[#61498C] -translate-y-1/2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                    {/* Start dot at left edge */}
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#61498C] ring-2 ring-white shadow-md z-10" />

                    {/* ₹500 Shipping — centered at exactly 50% of bar */}
                    <div
                      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                      style={{ left: `${(shippingThreshold / giftThreshold) * 100}%` }}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border-[3px] border-white shadow-lg transition-all duration-500 ${total >= shippingThreshold ? 'bg-[#61498C] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {total >= shippingThreshold ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.127V11.25M7.5 7.5h7.875c.621 0 1.125.504 1.125 1.125v7.25m-17.25-4.5V3.375C3.375 2.754 3.879 2.25 4.5 2.25H9.75" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* ₹1000 Gift — right edge of bar */}
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 z-10">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border-[3px] border-white shadow-lg transition-all duration-500 ${total >= giftThreshold ? 'bg-[#61498C] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {total >= giftThreshold ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h17.25" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Labels row — exactly aligned under their icons */}
                  <div className="relative h-7 mt-1">
                    {/* ₹500 label centered at 50% */}
                    <div
                      className="absolute -translate-x-1/2 text-center"
                      style={{ left: `${(shippingThreshold / giftThreshold) * 100}%` }}
                    >
                      <span className={`block text-[10px] font-black leading-none ${total >= shippingThreshold ? 'text-slate-900' : 'text-slate-400'}`}>₹{shippingThreshold}</span>
                      <span className={`block text-[8px] font-bold uppercase tracking-tight whitespace-nowrap mt-0.5 ${total >= shippingThreshold ? 'text-slate-500' : 'text-slate-400'}`}>Free Shipping</span>
                    </div>
                    {/* ₹1000 label right-aligned */}
                    <div className="absolute right-0 text-right">
                      <span className={`block text-[10px] font-black leading-none ${total >= giftThreshold ? 'text-slate-900' : 'text-slate-400'}`}>₹{giftThreshold}</span>
                      <span className={`block text-[8px] font-bold uppercase tracking-tight whitespace-nowrap mt-0.5 ${total >= giftThreshold ? 'text-slate-500' : 'text-slate-400'}`}>+ Free Gift</span>
                    </div>
                  </div>
                </div>

                {/* Progress Message Banner */}
                <div className="mt-3 text-center">
                  {total >= giftThreshold ? (
                    <div className="bg-emerald-50 text-[#1E8B4F] py-2 px-4 rounded-xl border border-emerald-100 inline-flex items-center justify-center gap-2">
                      <span className="text-lg">🎉</span>
                      <p className="text-[10px] font-black uppercase tracking-widest">Surprise Toy Added!</p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-100 inline-flex items-center gap-1">
                      <p className="text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
                        Add <span className="text-[#61498C] font-black text-xs md:text-sm mx-0.5 tabular-nums">₹{(giftThreshold - total).toFixed(0)}</span> more for your <span className="text-slate-800 font-black">FREE TOY! 🎁</span>
                      </p>
                    </div>
                  )}
                </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-4">
              {cart.map((item) => {
                const imageUrl = item.images?.[0] || '/images/placeholder.png';
                const productId = getProductKey(item);
                const stock = stockInfo[productId];
                const isOutOfStock = stock && stock.available === 0;
                const price = typeof item.price === "number" ? item.price : 0;
                const originalPrice = item.originalPrice || price * 1.5;

                return (
                   <div key={productId} className="bg-white rounded-[1.25rem] border border-slate-100 p-2 shadow-sm relative overflow-hidden flex flex-row gap-3 group">
                    <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-[0.75rem] overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-50">
                      <Image src={imageUrl} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                      {isOutOfStock && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[7px] sm:text-[9px] font-black uppercase backdrop-blur-sm">Out of Stock</div>}
                    </div>
                     <div className="flex-1 min-w-0 flex flex-col pt-1">
                       <div className="flex justify-between items-start mb-3">
                          <div>
                             <h3 className="text-lg font-bold text-slate-900 leading-tight mb-0.5">{item.name}</h3>
                             <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 inline-block px-2 py-0.5 rounded-full">
                               🎁 Mystery reward inside
                             </p>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-black text-slate-900 tabular-nums leading-none">₹{price}</p>
                             <p className="text-[10px] text-slate-400 line-through opacity-60 font-black tabular-nums mt-0.5">₹{originalPrice.toFixed(0)}</p>
                          </div>
                       </div>
                       
                       <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             {/* Delete Button */}
                             <button 
                               onClick={() => removeFromCart(productId)}
                               className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all border border-slate-50"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                   <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                             </button>

                             {/* Quantity Control */}
                             <div className="flex items-center bg-slate-50 rounded-xl border border-slate-50 h-10">
                               <button onClick={() => decreaseQty(productId)} className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-900 font-bold">−</button>
                               <span className="w-8 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                               <button onClick={() => increaseQty(productId)} className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-900 font-bold" disabled={isOutOfStock}>+</button>
                             </div>
                          </div>

                          <div className="flex flex-col items-end">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Subtotal</span>
                             <span className="text-base font-black text-slate-900 tabular-nums">₹{(price * item.quantity).toFixed(0)}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar / Bottom Bar Column */}
          <div className="lg:col-span-4 space-y-4">
            
             {/* Coupons Card */}
             <div className="bg-white rounded-[1.5rem] p-3 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                   <div className="bg-emerald-50 p-1 rounded-xl text-emerald-500">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                        <path d="M2.25 12a.75.75 0 0 1 .75-.75h1.12a.75.75 0 1 1 0 1.5H3a.75.75 0 0 1-.75-.75Zm6.732-5.464a.75.75 0 0 1 1.06 0l.793.793a.75.75 0 1 1-1.06 1.06l-.793-.793a.75.75 0 0 1 0-1.06Zm1.06 9.868a.75.75 0 0 1 0 1.06l-.793.793a.75.75 0 1 1-1.06-1.06l.793-.793a.75.75 0 0 1 1.06 0ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0a.75.75 0 0 1 .75-.75H21a.75.75 0 1 1 0 1.5h-2.25a.75.75 0 0 1-.75-.75Zm-6.732-5.464a.75.75 0 0 1 0 1.06l-.793.793a.75.75 0 0 1-1.06-1.06l.793-.793a.75.75 0 0 1 1.06 0Zm-1.06 9.868a.75.75 0 0 1-1.06 0l-.793-.793a.75.75 0 1 1 1.06-1.06l.793.793a.75.75 0 0 1 0 1.06ZM12 2.25a.75.75 0 0 1 .75.75V4.12a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Zm0 17.63a.75.75 0 0 1 .75.75v1.12a.75.75 0 0 1-1.5 0V20.63a.75.75 0 0 1 .75-.75Z" />
                      </svg>
                   </div>
                   <h2 className="text-[13px] font-black text-slate-900 tracking-tight uppercase flex-1">Coupons</h2>
                   {appliedCoupon && (
                     <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Applied</span>
                   )}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-2">
                    <div>
                      <span className="text-[11px] font-black text-emerald-700 tracking-wide">{appliedCoupon.code}</span>
                      <p className="text-[9px] text-emerald-600 font-bold">Saved ₹{appliedCoupon.discount.toFixed(0)}!</p>
                    </div>
                    <button onClick={removeCoupon} className="text-[9px] font-black text-rose-500 uppercase tracking-widest border border-rose-100 px-2 py-1 rounded-lg hover:bg-rose-50 transition-all">Remove</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setCouponSheetOpen(true)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 group flex items-center justify-between hover:bg-white hover:border-[#61498C] transition-all"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-[13px] font-black text-slate-800 tracking-wide">Have a coupon?</span>
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">{AVAILABLE_COUPONS.length} offers available for you!</span>
                    </div>
                    <div className="bg-[#61498C] p-1.5 rounded-lg text-white shadow-sm group-hover:scale-105 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </button>
                )}
             </div>

            {/* You will also love to buy section */}
            <div className="bg-white rounded-[1.25rem] p-2 border border-slate-100 shadow-sm overflow-hidden">
               <h2 className="text-[10px] font-black text-slate-900 tracking-tight uppercase mb-1.5 flex items-center gap-2">
                  <span className="text-pink-500">✨</span> You will also love to buy
               </h2>
               <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none snap-x snap-mandatory">
                  <RelatedProductsCompact currentProductId="cart" />
               </div>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-md space-y-3">
              <h2 className="text-base font-black text-slate-900 tracking-tight uppercase mb-1">Final Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <span>Cart Item Total</span>
                  <span className="text-slate-900 tabular-nums font-black">₹{total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <span>Shipping Fee</span>
                  <span className="text-[#1EAA5F] font-black uppercase">Free</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <span>Savings</span>
                  <span className="text-[#1EAA5F] font-black tabular-nums">-₹75</span>
                </div>
                
                <hr className="border-dashed border-slate-100 my-4" />
                
                <div className="flex justify-between items-end pt-1">
                  <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">Amount to Pay</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">₹{total.toFixed(0)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-[#61498C] text-white font-black py-4 px-6 rounded-[1.5rem] text-base shadow-2xl shadow-purple-100 hover:bg-[#533d7a] transition-all transform active:scale-[0.98] uppercase tracking-[0.15em] mt-4 flex items-center justify-between group"
              >
                <span className="ml-2">Proceed</span>
                <div className="bg-white/20 p-1.5 rounded-xl backdrop-blur-md group-hover:translate-x-1 transition-transform">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                   </svg>
                </div>
              </button>
            </div>

            {/* Support Info */}
            <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm flex items-center gap-4">
               <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025 4.486 4.486 0 0 0-.619-1.813C4.03 15.656 3 13.921 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Support</p>
                  <p className="text-sm font-black text-[#61498C] tracking-tighter">+91 91501 50051</p>
               </div>
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Sticky CTA: Precise & Professional */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-40 shadow-[0_-15px_40px_rgba(0,0,0,0.08)]">
         <div className="flex items-center justify-between gap-4 max-w-xl mx-auto">
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Total</span>
               <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">₹{total.toFixed(0)}</span>
                  <span className="text-[9px] font-black text-[#1EAA5F] bg-[#DFEDE5] px-1.5 py-0.5 rounded uppercase leading-none">Saved ₹75</span>
               </div>
            </div>
            <button 
               onClick={handleCheckout}
               className="flex-1 bg-[#61498C] text-white font-black h-12 rounded-xl shadow-xl shadow-purple-100 active:scale-95 transition-all text-xs uppercase tracking-[0.15em] whitespace-nowrap flex items-center justify-center gap-2"
            >
               Checkout
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
               </svg>
            </button>
         </div>
      </div>
      {/* Coupon Bottom Sheet */}
      {couponSheetOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setCouponSheetOpen(false)} />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[2rem] shadow-[0_-20px_60px_rgba(0,0,0,0.15)] max-h-[85vh] flex flex-col"
            style={{ animation: 'slideUp 0.3s cubic-bezier(0.32,0.72,0,1)' }}
          >
            <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Coupons & Offers</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Cart value · ₹{total.toFixed(0)}</p>
              </div>
              <button onClick={() => setCouponSheetOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 gap-2 focus-within:border-[#61498C] transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                  </svg>
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                    placeholder="Enter coupon code"
                    className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none uppercase tracking-widest"
                  />
                </div>
                <button
                  onClick={() => applyCoupon(couponInput)}
                  disabled={!couponInput.trim() || couponLoading}
                  className="bg-[#61498C] text-white font-black text-xs px-4 rounded-2xl uppercase tracking-wider disabled:opacity-50 transition-all active:scale-95"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-[10px] text-rose-500 font-bold mt-2 ml-1">❌ {couponError}</p>}
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Coupons</p>
              {AVAILABLE_COUPONS.map((coupon) => {
                const isEligible = total >= coupon.minOrder;
                return (
                  <div key={coupon.code} className={`rounded-2xl border p-4 ${isEligible ? 'border-slate-100 bg-white shadow-sm' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: coupon.accent }}>{coupon.label}</span>
                          <span className="text-sm font-black text-slate-900 tracking-wide">{coupon.code}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">{coupon.description}</p>
                        {isEligible
                          ? <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Eligible on your order</p>
                          : <p className="text-[10px] text-rose-500 font-bold mt-1">Add ₹{(coupon.minOrder - total).toFixed(0)} more to use this</p>
                        }
                      </div>
                      <button
                        onClick={() => isEligible && applyCoupon(coupon.code)}
                        disabled={!isEligible || couponLoading}
                        className={`flex-shrink-0 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all active:scale-95 ${isEligible ? 'bg-[#61498C] text-white hover:bg-[#533d7a] shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
