"use client";

import { useSharedContext, type CartItem, type Product } from "@/context/SharedContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import CouponSheet from "./CouponSheet";
import CartProgress from "./CartProgress";

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
    addToCart,
    appliedCoupon,
    setAppliedCoupon,
    appliedSwagoMoney
  } = useSharedContext();

  const router = useRouter();
  const [stockInfo, setStockInfo] = useState<StockInfo>({});
  const [loading, setLoading] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState('Today');

  // Coupon state
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

  const [promotion, setPromotion] = useState<any>(null);

  useEffect(() => {
    fetch("/api/promotion")
      .then(r => r.json())
      .then(d => {
        if (d.success) setPromotion(d.promotion);
      })
      .catch(console.error);
  }, []);

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
          <>
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed right-0 top-0 h-full w-full sm:w-[460px] bg-[#F7F7F9] shadow-2xl z-[70] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 bg-white text-slate-900 overflow-hidden">
                <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                  Your Cart ({cart.length})
                </h2>
                <button
                  onClick={closeCartSidebar}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors border-none outline-none"
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
                <div className="p-4">
                  <CartProgress total={total} promotionData={promotion} />
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
                            <button
                              onClick={() => removeFromCart(productId)}
                              className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79" />
                              </svg>
                            </button>
                            <div className="flex items-center border border-slate-200 rounded-lg h-9">
                              <button onClick={() => decreaseQty(productId)} className="w-9 h-full flex items-center justify-center text-slate-400 font-black">−</button>
                              <span className="w-9 text-center text-xs font-black text-slate-800">{item.quantity}</span>
                              <button onClick={() => increaseQty(productId)} className="w-9 h-full flex items-center justify-center text-slate-400 font-black">+</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Coupons Section */}
                <div className="mb-3 px-3">
                  {appliedCoupon ? (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Coupon Applied</p>
                        <p className="text-sm font-black text-emerald-800">{appliedCoupon.code}</p>
                        <p className="text-[10px] font-bold text-emerald-600 mt-0.5">You saved ₹{appliedCoupon.discount}!</p>
                      </div>
                      <button onClick={() => setAppliedCoupon(null)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-3 py-1.5 border border-rose-100 rounded-lg hover:bg-rose-50 transition-colors">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCouponSheetOpen(true)}
                      className="w-full bg-white border border-[#E1E5E9] p-4 rounded-xl flex items-center justify-between group shadow-sm hover:border-[hsl(var(--swago-purple))] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                            <path d="M2.25 12a.75.75 0 0 1 .75-.75h1.12a.75.75 0 1 1 0 1.5H3a.75.75 0 0 1-.75-.75Zm6.732-5.464a.75.75 0 0 1 1.06 0l.793.793a.75.75 0 1 1-1.06 1.06l-.793-.793a.75.75 0 0 1 0-1.06Z" />
                          </svg>
                        </span>
                        <span className="text-sm font-black text-slate-700">View Coupons</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-[hsl(var(--swago-purple))] uppercase tracking-widest">{availableCoupons.length} OFFERS</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </button>
                  )}
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
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">{p.name}</h4>
                          <div className="flex items-center gap-2 flex-wrap my-1.5">
                            <span className="text-sm font-black text-slate-900 tracking-tight">₹{p.price}</span>
                          </div>
                          <button
                            onClick={() => addToCart(p, 1)}
                            className="w-full py-2 rounded-lg border-2 border-[#1EAA5F] text-[#1EAA5F] text-[10px] font-black uppercase tracking-widest hover:bg-[#1EAA5F] hover:text-white transition-all flex items-center justify-center"
                          >
                            + ADD
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
                    <button className="text-[#61498C] text-xs font-black tracking-widest uppercase py-2 px-4 hover:bg-purple-50 rounded-lg transition-colors">
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-700 tracking-tight">Estimated total</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">₹{((appliedCoupon ? total - appliedCoupon.discount : total) - (appliedSwagoMoney || 0)).toFixed(0)}</p>
                    {((appliedCoupon?.discount || 0) + (appliedSwagoMoney || 0)) > 0 && <p className="text-[10px] font-black text-[#1EAA5F] uppercase tracking-wide">You saved ₹{((appliedCoupon?.discount || 0) + (appliedSwagoMoney || 0)).toFixed(0)}!</p>}
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-[#61498C] text-white font-black py-4.5 px-6 rounded-2xl text-base shadow-xl shadow-purple-100 hover:bg-[#533d7a] transition-all transform active:scale-[0.98] flex items-center justify-center uppercase tracking-[0.2em]"
                >
                  Checkout
                </button>

                <div className="flex items-center justify-center gap-1.5 opacity-30 mt-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Powered by</span>
                  <span className="text-[10px] font-black text-slate-600 tracking-tighter lowercase">shopflo</span>
                </div>
              </div>
            </motion.div>
            <CouponSheet
              isOpen={couponSheetOpen}
              onClose={() => setCouponSheetOpen(false)}
              onApply={applyCoupon}
              total={total}
              availableCoupons={availableCoupons}
              loading={couponLoading}
              error={couponError}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
