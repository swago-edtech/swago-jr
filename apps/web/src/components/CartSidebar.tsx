"use client";

import { useSharedContext, type CartItem, type Product } from "@/context/SharedContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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

  // Get product ID for operations
  const getProductId = (item: CartItem): string => {
    return item.productId?.toString() || item._id?.toString() || item.id?.toString() || '';
  };

  // Fetch stock data when sidebar opens
  useEffect(() => {
    if (!isCartSidebarOpen || cart.length === 0) return;

    const fetchStock = async () => {
      setLoading(true);
      try {
        const stockData: StockInfo = {};

        for (const item of cart) {
          const productId = getProductId(item);
          if (!productId) continue;

          try {
            const res = await fetch(`/api/products/${productId}`);
            
            if (res.status === 404) {
              console.log(`⚠️ Product ${productId} not found (404), skipping stock check`);
              continue;
            }

            const data = await res.json();

            if (data.success && data.product) {
              const hasStockTracking = typeof data.product.stock === 'number';
              const available = hasStockTracking 
                ? Math.max(0, data.product.stock - (data.product.reservedStock || 0))
                : 999999;
              
              stockData[productId] = {
                available: available,
                reserved: data.product.reservedStock || 0,
                total: data.product.stock || 0
              };
            }
          } catch (error) {
            console.error(`Error fetching stock for ${productId}:`, error);
          }
        }

        setStockInfo(stockData);
      } catch (error) {
        console.error('Error fetching stock:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, [isCartSidebarOpen, cart]);

  // Fetch recommended products
  useEffect(() => {
    if (!isCartSidebarOpen) return;

    const fetchRecommendations = async () => {
      try {
        const res = await fetch('/api/products?limit=2&featured=true');
        const data = await res.json();
        
        if (data.success && data.products) {
          // Filter out products already in cart
          const cartProductIds = cart.map(item => getProductId(item));
          const filtered = data.products.filter((p: Product) => 
            !cartProductIds.includes(p._id?.toString() || p.id?.toString() || '')
          ).slice(0, 2);
          
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
    router.push("/checkout");
  };

  const handleAddRecommended = (product: Product) => {
    addToCart(product, 1);
  };

  const hasStockIssues = Object.keys(stockInfo).some(productId => {
    const item = cart.find(i => getProductId(i) === productId);
    const stock = stockInfo[productId];
    return item && stock && (stock.available === 0 || item.quantity > stock.available);
  });

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
            className="fixed inset-0 bg-black/50 z-[60]"
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
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
              <h2 className="text-lg font-bold text-gray-900">
                Shopping Cart→
              </h2>
              <button
                onClick={closeCartSidebar}
                className="p-1.5 hover:bg-gray-100 rounded-full transition"
                aria-label="Close cart"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart Items */}
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                  className="w-24 h-24 text-gray-300 mb-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.087 0 2.062-.812 2.062-1.875V6.373c0-1.063-.975-1.875-2.062-1.875H7.5"
                  />
                </svg>
                <p className="text-gray-500 text-lg font-medium mb-2">Your cart is empty</p>
                <p className="text-gray-400 text-sm mb-6">Add items to get started!</p>
                <button
                  onClick={closeCartSidebar}
                  className="bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 transition font-semibold"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                {/* Scrollable Items Area */}
                <div className="flex-1 overflow-y-auto">
                  {/* Cart Items List */}
                  <div className="p-4 space-y-3">
                    {loading && (
                      <div className="text-center py-2 text-sm text-gray-500">
                        Checking stock availability...
                      </div>
                    )}
                    
                    {cart.map((item) => {
                      const imageUrl = item.images?.[0] || '/images/placeholder.png';
                      const productId = getProductId(item);
                      const itemPrice = typeof item.price === "number" ? item.price : 0;
                      const originalPrice = item.originalPrice || item.original_price;
                      const hasDiscount = originalPrice && originalPrice > itemPrice;
                      const discountPercent = hasDiscount 
                        ? Math.round(((originalPrice - itemPrice) / originalPrice) * 100) 
                        : 0;
                      
                      const stock = stockInfo[productId];
                      const isOutOfStock = stock && stock.available === 0;
                      const hasQuantityIssue = stock && item.quantity > stock.available;

                      return (
                        <motion.div
                          key={productId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 100 }}
                          className="border-b pb-3 last:border-b-0"
                        >
                          <div className="flex gap-3">
                            {/* Product Image */}
                            <div className="relative w-20 h-20 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden">
                              <Image
                                src={imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                              {(isOutOfStock || hasQuantityIssue) && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">!</span>
                                </div>
                              )}
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                                {item.name}
                              </h3>
                              
                              {/* Price */}
                              <div className="flex items-center gap-2 mb-2">
                                {hasDiscount && (
                                  <span className="text-xs text-gray-400 line-through">
                                    ₹{originalPrice}
                                  </span>
                                )}
                                <span className="text-base font-bold text-gray-900">
                                  ₹{itemPrice}
                                </span>
                                {hasDiscount && (
                                  <span className="text-xs font-semibold text-green-600">
                                    {discountPercent}% off
                                  </span>
                                )}
                              </div>

                              {/* Stock Warning */}
                              {isOutOfStock && (
                                <p className="text-xs text-red-600 font-medium mb-2">
                                  ❌ Out of stock - Please remove
                                </p>
                              )}
                              {hasQuantityIssue && !isOutOfStock && (
                                <p className="text-xs text-orange-600 font-medium mb-2">
                                  ⚠️ Only {stock?.available} available
                                </p>
                              )}

                              {/* Quantity Controls & Remove */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 border border-gray-300 rounded-md bg-white">
                                  <button
                                    onClick={() => decreaseQty(productId)}
                                    className="px-3 py-1.5 hover:bg-gray-50 transition text-gray-700 font-medium"
                                    aria-label="Decrease quantity"
                                  >
                                    -
                                  </button>
                                  <span className="text-sm font-semibold w-8 text-center text-gray-900">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => increaseQty(productId)}
                                    className="px-3 py-1.5 hover:bg-gray-50 transition text-gray-700 font-medium"
                                    aria-label="Increase quantity"
                                    disabled={isOutOfStock || (stock && item.quantity >= stock.available)}
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Remove Link */}
                                <button
                                  onClick={() => removeFromCart(productId)}
                                  className="text-xs text-gray-600 hover:text-red-600 font-medium underline"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Recommendations Section */}
                  {recommendedProducts.length > 0 && (
                    <div className="border-t bg-gray-50 p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Would you like to add this too?
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">We specially chosen these for you</p>
                      
                      <div className="space-y-3">
                        {recommendedProducts.map((product) => {
                          const recPrice = product.price || 0;
                          const recOriginalPrice = product.originalPrice || product.original_price;
                          const recHasDiscount = recOriginalPrice && recOriginalPrice > recPrice;
                          const recDiscountPercent = recHasDiscount
                            ? Math.round(((recOriginalPrice - recPrice) / recPrice) * 100)
                            : 0;

                          return (
                            <div 
                              key={product._id?.toString() || product.id?.toString()} 
                              className="flex items-center gap-3 bg-white p-3 rounded-lg border"
                            >
                              <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden">
                                <Image
                                  src={product.images?.[0] || '/images/placeholder.png'}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold text-gray-900 line-clamp-1 mb-1">
                                  {product.name}
                                </h4>
                                <div className="flex items-center gap-2">
                                  {recHasDiscount && (
                                    <span className="text-xs text-gray-400 line-through">
                                      ₹{recOriginalPrice}
                                    </span>
                                  )}
                                  <span className="text-sm font-bold text-gray-900">
                                    ₹{recPrice}
                                  </span>
                                  {recHasDiscount && (
                                    <span className="text-xs font-semibold text-green-600">
                                      {recDiscountPercent}% off
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => handleAddRecommended(product)}
                                className="p-2 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition flex-shrink-0"
                                aria-label="Add to cart"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" className="w-5 h-5">
                                  <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 4 0h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 11.5 3H2.52l-.21-1.054A.5.5 0 0 0 2 1.5H.5zM6 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM9 5.5V7h1.5a.5.5 0 0 1 0 1H9v1.5a.5.5 0 0 1-1 0V8H6.5a.5.5 0 0 1 0-1H8V5.5a.5.5 0 0 1 1 0z"/>
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer - Summary & Actions */}
                <div className="border-t bg-white p-4 space-y-3 sticky bottom-0">
                  {/* Prepaid Offer Banner */}
                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2.5 text-center">
                    <p className="text-xs font-semibold text-yellow-800">
                      ₹25 off on All Prepaid Orders
                    </p>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Total MRP</span>
                      <span>₹{total.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Total Discount</span>
                      <span className="text-green-600">-₹0</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping Fee</span>
                      <span className="text-green-600 font-semibold">₹90 FREE</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-base font-bold text-gray-900">
                      <span>To Pay Subtotal</span>
                      <span>₹{total.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Stock Issues Warning */}
                  {hasStockIssues && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5">
                      <p className="text-xs text-orange-700 font-medium">
                        ⚠️ Please resolve stock issues before checkout
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={handleCheckout}
                      disabled={hasStockIssues || loading}
                      className={`w-full font-bold py-3 rounded-lg transition shadow-md flex items-center justify-center gap-2 ${
                        hasStockIssues || loading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800'
                      }`}
                    >
                      <span>Confirm Order</span>
                      <Image 
                        src="/images/payment-icons.png" 
                        alt="Payment methods" 
                        width={60} 
                        height={20}
                        className="inline"
                        onError={(e) => {
                          // Hide image if it doesn't exist
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </button>

                    <Link
                      href="/cart"
                      onClick={closeCartSidebar}
                      className="block w-full text-center border-2 border-purple-600 text-purple-600 font-semibold py-2.5 rounded-lg hover:bg-purple-50 transition"
                    >
                      View Full Cart
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
