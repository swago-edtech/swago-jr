"use client";

import { useSharedContext, type CartItem, type Product } from "@/context/SharedContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// Assuming this is the intended local definition or clarification for CartItem
// The original CartItem type is imported from "@/context/SharedContext"
// This local definition might be intended to resolve a lint error if the imported type was different.
interface LocalCartItem {
  productId?: string | number;
  id?: number;
  _id?: string;
  name: string;
  price?: number;
  originalPrice?: number;
  quantity: number;
  images?: string[];
  stock?: number;
}

interface StockInfo {
  [key: string]: {
    available: number;
    reserved: number;
    total: number;
  };
}

export default function CartSidebar() {
  const {
    cart,
    total,
    isCartSidebarOpen,
    closeCartSidebar,
    increaseQty,
    decreaseQty,
    removeFromCart,
    addToCart
  } = useSharedContext();

  const router = useRouter();
  const [stockInfo, setStockInfo] = useState<StockInfo>({});
  const [loading, setLoading] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState('Today');

  // Get product ID for operations
  const getProductId = (item: CartItem): string => {
    return item.productId?.toString() || item._id?.toString() || item.id?.toString() || '';
  };

  // Fetch recommended products
  useEffect(() => {
    if (!isCartSidebarOpen) return;
    const fetchRecommendations = async () => {
      try {
        const res = await fetch('/api/products?limit=6&featured=true');
        const data = await res.json();
        if (data.success && data.products) {
          const cartProductIds = cart.map(item => getProductId(item));
          const filtered = data.products.filter((p: Product) =>
            !cartProductIds.includes(p._id?.toString() || p.id?.toString() || '')
          );
          setRecommendedProducts(filtered);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };
    fetchRecommendations();
  }, [isCartSidebarOpen, cart]);

  const handleCheckout = () => {
    closeCartSidebar();
    router.push("/cart");
  };

  const shippingThreshold = 500;
  const giftThreshold = 1000;
  const progressPercent = Math.min((total / giftThreshold) * 100, 100);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isCartSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            onClick={closeCartSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isCartSidebarOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[460px] bg-[#F7F7F9] shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 bg-white">
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                Your Cart ({cart.length})
              </h2>
              <button
                onClick={closeCartSidebar}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Promo Banner */}
            <div className="bg-[#61498C] py-2.5 px-5 text-center">
              <p className="text-white text-[11px] font-black uppercase tracking-wider">
                Enjoy Free Shipping, Free Wrapping & Free Gifts!
              </p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-4 scrollbar-none">

              {/* Rewards Progress Section */}
              <div className="bg-white px-5 pt-3 pb-8 mb-2 shadow-sm">
                <p className="text-[#6B5A99] text-xs font-bold text-center mb-4 uppercase tracking-wider">
                  {total >= giftThreshold
                    ? "🎉 All rewards added!"
                    : total >= shippingThreshold
                      ? "🚚 Free Shipping unlocked!"
                      : "Free Gift on PRE-PAID orders"}
                </p>

                <div className="relative px-6">
                  {/* Progress Line Background */}
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full" />

                  {/* Active Progress Line */}
                  <div
                    className="absolute top-1/2 left-0 h-1 bg-[#61498C] -translate-y-1/2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />

                  {/* Milestones */}
                  <div className="flex justify-between items-center relative z-10">
                    <div /> {/* Start of progress bar spacing */}

                    {/* Free Shipping Milestone */}
                    <div className="relative">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border-4 border-white shadow-md transition-all duration-500 scale-110 ${total >= shippingThreshold ? 'bg-[#61498C] text-white' : 'bg-slate-50 text-slate-300'}`}>
                        {total >= shippingThreshold ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.127V11.25M7.5 7.5h7.875c.621 0 1.125.504 1.125 1.125v17.25m-17.25-4.5V3.375C3.375 2.754 3.879 2.25 4.5 2.25H9.75m11.25 7.5V10.5M3.375 14.25h17.25m-17.25 0V5.25m17.25 9V5.25" />
                          </svg>
                        )}
                      </div>
                      <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                        <span className={`block text-[10px] font-black ${total >= shippingThreshold ? 'text-slate-800' : 'text-slate-400'}`}>₹{shippingThreshold}</span>
                        <span className={`block text-[9px] font-bold uppercase tracking-tight ${total >= shippingThreshold ? 'text-slate-600' : 'text-slate-400'}`}>Free Shipping</span>
                      </div>
                    </div>

                    {/* Free Gift Milestone */}
                    <div className="relative">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border-4 border-white shadow-md transition-all duration-500 scale-110 ${total >= giftThreshold ? 'bg-[#61498C] text-white' : 'bg-slate-50 text-slate-300'}`}>
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
                      <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                        <span className={`block text-[10px] font-black ${total >= giftThreshold ? 'text-slate-800' : 'text-slate-400'}`}>₹{giftThreshold}</span>
                        <span className={`block text-[9px] font-bold uppercase tracking-tight ${total >= giftThreshold ? 'text-slate-600' : 'text-slate-400'}`}>+ Free Gift</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Message Banner */}
                <div className="mt-12 text-center px-4">
                  {total >= giftThreshold ? (
                    <div className="bg-emerald-50 text-[#1E8B4F] py-2 px-4 rounded-xl border border-emerald-100 flex items-center justify-center gap-2 animate-bounce-subtle">
                      <span className="text-lg">🎉</span>
                      <p className="text-[10px] font-black uppercase tracking-widest leading-none">Free Toy Added!</p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 py-2 px-4 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-500 leading-tight">
                        Add <span className="text-[#61498C] font-black tracking-tight text-xs">₹{(giftThreshold - total).toFixed(0)}</span> more for <span className="font-black whitespace-nowrap">FREE Toy! 🎁</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cart Items List */}
              <div className="p-3 space-y-3">
                {cart.map((item) => {
                  const imageUrl = item.images?.[0] || '/images/placeholder.png';
                  const productId = getProductId(item);
                  const price = item.price || 0;
                  const originalPrice = item.originalPrice || price * 1.5;

                  return (
                    <div key={productId} className="bg-white rounded-2xl p-2.5 border border-slate-100 flex gap-3">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-50">
                        <Image src={imageUrl} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col pt-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-sm font-bold text-slate-800 leading-tight pr-4">{item.name}</h3>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900">₹{price}</p>
                            <p className="text-[11px] text-slate-400 line-through opacity-60 font-bold">₹{originalPrice.toFixed(0)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-auto">
                          {/* Trash Button */}
                          <button
                            onClick={() => removeFromCart(productId)}
                            className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>

                          {/* Qty Selector */}
                          <div className="flex items-center border border-slate-200 rounded-lg h-9">
                            <button onClick={() => decreaseQty(productId)} className="w-9 h-full flex items-center justify-center text-slate-400 hover:text-slate-800 font-black">−</button>
                            <span className="w-9 text-center text-xs font-black text-slate-800">{item.quantity}</span>
                            <button onClick={() => increaseQty(productId)} className="w-9 h-full flex items-center justify-center text-slate-400 hover:text-slate-800 font-black">+</button>
                          </div>

                          {/* Wishlist Button */}
                          <button className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-amber-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupons Section */}
              <div className="mb-1">
                <button className="w-full bg-white border border-[#E1E5E9] p-4 rounded-xl flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="bg-[#DFEDE5] text-[#1EAA5F] p-1.5 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                        <path d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z" className="hidden" />
                        <path d="M2.25 12a.75.75 0 0 1 .75-.75h1.12a.75.75 0 1 1 0 1.5H3a.75.75 0 0 1-.75-.75Zm6.732-5.464a.75.75 0 0 1 1.06 0l.793.793a.75.75 0 1 1-1.06 1.06l-.793-.793a.75.75 0 0 1 0-1.06Zm1.06 9.868a.75.75 0 0 1 0 1.06l-.793.793a.75.75 0 1 1-1.06-1.06l.793-.793a.75.75 0 0 1 1.06 0ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0a.75.75 0 0 1 .75-.75H21a.75.75 0 0 1 0 1.5h-2.25a.75.75 0 0 1-.75-.75Zm-6.732-5.464a.75.75 0 0 1 0 1.06l-.793.793a.75.75 0 0 1-1.06-1.06l.793-.793a.75.75 0 0 1 1.06 0Zm-1.06 9.868a.75.75 0 0 1-1.06 0l-.793-.793a.75.75 0 1 1 1.06-1.06l.793.793a.75.75 0 0 1 0 1.06ZM12 2.25a.75.75 0 0 1 .75.75V4.12a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75Zm0 17.63a.75.75 0 0 1 .75.75v1.12a.75.75 0 0 1-1.5 0V20.63a.75.75 0 0 1 .75-.75Z" />
                      </svg>
                    </span>
                    <span className="text-sm font-black text-slate-700">View Coupons</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>

              {/* Recommendations */}
              <div className="mt-4 px-3">
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm overflow-hidden">
                  <div className="flex gap-6 mb-5 border-b border-slate-100">
                    <button
                      onClick={() => setActiveTab('Today')}
                      className={`pb-3 text-sm font-black tracking-tight transition-all relative ${activeTab === 'Today' ? 'text-[#1EAA5F]' : 'text-slate-400'}`}
                    >
                      Only for Today
                      {activeTab === 'Today' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#1EAA5F] rounded-full" />}
                    </button>
                    <button
                      onClick={() => setActiveTab('Under299')}
                      className={`pb-3 text-sm font-black tracking-tight transition-all relative ${activeTab === 'Under299' ? 'text-[#1EAA5F]' : 'text-slate-400'}`}
                    >
                      Under ₹299
                      {activeTab === 'Under299' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#1EAA5F] rounded-full" />}
                    </button>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
                    {recommendedProducts.map((p) => (
                      <div key={p._id || p.id} className="flex-shrink-0 w-44 snap-start group">
                        <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-slate-50 border border-slate-50">
                          <Image src={p.images?.[0] || ''} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-0 left-0 p-1">
                            <div className="bg-[#1E8B4F] text-white text-[9px] font-black px-1.5 py-1 rounded-md shadow-lg">17% OFF</div>
                          </div>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">{p.name}</h4>
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap my-1.5">
                          <span className="text-[10px] text-slate-400 line-through font-bold tracking-tighter">₹799</span>
                          <span className="text-sm font-black text-slate-900 tracking-tight">₹{p.price}</span>
                        </div>
                        <button
                          onClick={() => addToCart(p, 1)}
                          className="w-full py-2 rounded-lg border-2 border-[#1EAA5F] text-[#1EAA5F] text-[10px] font-black uppercase tracking-widest hover:bg-[#1EAA5F] hover:text-white transition-all flex items-center justify-center gap-1.5"
                        >
                          <span className="text-base leading-none">+</span> ADD
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upsell Item */}
              <div className="mt-4 px-3 mb-4">
                <div className="bg-white rounded-xl p-3 border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-[#61498C] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-slate-50">
                      <Image src="/images/products/gift-wrap.png" alt="Gift Wrap" fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 leading-tight">Gift Wrap (Purple/yellow)</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">(one per item)</p>
                      <p className="text-[11px] font-black text-slate-900 mt-1">₹0</p>
                    </div>
                  </div>
                  <button className="text-[#61498C] text-xs font-black tracking-widest uppercase py-2 px-4 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1">
                    <span className="text-lg leading-none">+</span> Add
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] pb-2">

              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 group cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-slate-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25-9 3.694-9 8.25c0 1.618.491 3.123 1.334 4.373L3 20.25l4.583-1.352A8.908 8.908 0 0 0 12 20.25Z" />
                    </svg>
                    <span className="text-sm font-black text-slate-700 tracking-tight">Estimated total</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-slate-800">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">₹{total.toFixed(0)}</p>
                    <p className="text-[10px] font-black text-[#1EAA5F] uppercase tracking-wide">You saved ₹75!</p>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-[#61498C] text-white font-black py-4.5 px-6 rounded-2xl text-base shadow-xl shadow-purple-100 hover:bg-[#533d7a] transition-all transform active:scale-[0.98] flex items-center justify-center md:justify-between uppercase tracking-[0.2em]"
                >
                  <span className="md:ml-2">Checkout</span>
                  <div className="flex md:hidden items-center bg-white/20 px-3 py-2 rounded-xl border border-white/20 gap-2">
                    <div className="w-8 h-4 bg-white/10 rounded flex items-center justify-center text-[8px] font-black italic">UPI</div>
                    <div className="w-8 h-4 bg-white/10 rounded flex items-center justify-center text-[8px] font-black">VISA</div>
                    <div className="w-8 h-4 bg-white/10 rounded flex items-center justify-center text-[8px] font-black">PAY</div>
                  </div>
                </button>

                <div className="flex items-center justify-center gap-1.5 opacity-30 mt-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Powered by</span>
                  <span className="text-[10px] font-black text-slate-600 tracking-tighter lowercase">shopflo</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
