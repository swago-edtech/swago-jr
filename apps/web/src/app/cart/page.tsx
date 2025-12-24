"use client";

import { useSharedContext } from "@/context/SharedContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

interface CartItem {
  productId?: string | number;  // ✅ NEW: The actual product reference
  id?: number;
  _id?: string;  // MongoDB subdocument ID (NOT the product ID)
  name: string;
  price?: number;
  quantity: number;
  images?: string[];
  image?: string;
  stock?: number;
}

interface StockInfo {
  [key: string]: {
    available: number;
    reserved: number;
    total: number;
  };
}

export default function CartPage() {
  const { cart, increaseQty, decreaseQty, removeFromCart, total } = useSharedContext();
  const router = useRouter();
  const [stockInfo, setStockInfo] = useState<StockInfo>({});
  const [loading, setLoading] = useState(true);
  const [stockErrors, setStockErrors] = useState<string[]>([]);

  // Fetch fresh stock data for all cart items
  useEffect(() => {
    const fetchStock = async () => {
      if (cart.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const stockData: StockInfo = {};
        const errors: string[] = [];

        for (const item of cart) {
          // ✅ FIXED: Use productId first (actual product reference), not _id (subdocument ID)
          const productId = item.productId?.toString() || item.id?.toString() || item._id;
          if (!productId) continue;

          try {
            const res = await fetch(`/api/products/${productId}`);
            
            // ✅ FIX: If product doesn't exist (404), just skip stock check
            if (res.status === 404) {
              console.log(`⚠️ Product ${productId} not found (404), skipping stock check`);
              continue;
            }

            const data = await res.json();

            if (data.success && data.product) {
              // ✅ FIXED: Hardcoded products have stock: undefined (unlimited)
              const hasStockTracking = typeof data.product.stock === 'number';
              const available = hasStockTracking 
                ? Math.max(0, data.product.stock - (data.product.reservedStock || 0))
                : 999999; // Unlimited for hardcoded products
              
              stockData[productId] = {
                available: available,
                reserved: data.product.reservedStock || 0,
                total: data.product.stock || 0
              };

              // ✅ Only check stock issues for products that track stock
              if (hasStockTracking) {
                if (available === 0) {
                  errors.push(`${item.name} is out of stock`);
                } else if (item.quantity > available) {
                  errors.push(`${item.name}: Only ${available} available (you have ${item.quantity} in cart)`);
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching stock for ${productId}:`, error);
          }
        }

        setStockInfo(stockData);
        setStockErrors(errors);
      } catch (error) {
        console.error('Error fetching stock:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, [cart]);

  // ✅ FIXED: Use productId first
  const getProductKey = (item: CartItem): string => {
    return item.productId?.toString() || item.id?.toString() || item._id || '';
  };

  const hasStockIssues = stockErrors.length > 0;

  if (cart.length === 0) {
    return (
      <div className="text-center py-20">
        <CartIconLarge />
        <h2 className="text-2xl font-bold mt-4">Your cart is empty</h2>
        <p className="text-slate-500 mt-2">Looks like you haven&apos;t added anything to your cart yet.</p>
        <Link 
          href="/products" 
          className="mt-6 inline-block bg-[hsl(var(--swago-purple))] text-white font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      
      {/* Stock Issues Alert */}
      {hasStockIssues && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-800 mb-2">Stock Availability Issues</h3>
              <ul className="space-y-1 text-sm text-orange-700">
                {stockErrors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
              <p className="text-sm text-orange-600 mt-2">
                Please update quantities or remove items to proceed to checkout.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-slate-500">Checking stock availability...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item: CartItem) => {
                // ✅ Guard against undefined price
                const unitPrice = typeof item.price === "number" ? item.price : 0;
                
                const imageUrl = item.images?.[0] || item.image || '/images/placeholder.png';
                const productKey = getProductKey(item);
                const stock = stockInfo[productKey];
                const available = stock?.available ?? 999;
                const isOutOfStock = available === 0;
                const hasQuantityIssue = item.quantity > available;
                
                return (
                  <div 
                    key={productKey} 
                    className={`flex gap-4 bg-white p-4 rounded-xl border shadow-sm ${
                      isOutOfStock || hasQuantityIssue ? 'border-orange-300' : ''
                    }`}
                  >
                    <div className="relative">
                      <Image 
                        src={imageUrl}
                        alt={item.name} 
                        width={96}
                        height={96}
                        className="object-cover rounded-md" 
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                          <span className="text-white text-xs font-bold">Out of Stock</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-grow flex flex-col">
                      <h2 className="font-semibold text-lg">{item.name}</h2>
                      <p className="text-slate-500">Price: ₹{unitPrice.toFixed(2)}</p>
                      
                      {/* Stock Status */}
                      {stock && (
                        <div className="mt-1">
                          {isOutOfStock ? (
                            <p className="text-sm text-red-600 font-medium">
                              ❌ Out of stock - Please remove
                            </p>
                          ) : hasQuantityIssue ? (
                            <p className="text-sm text-orange-600 font-medium">
                              ⚠️ Only {available} available
                            </p>
                          ) : available < 10 ? (
                            <p className="text-sm text-orange-500">
                              Only {available} left in stock
                            </p>
                          ) : (
                            <p className="text-sm text-green-600">
                              ✓ In stock
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex-grow"></div>
                      <div className="flex items-center gap-2 mt-2">
                        <button 
                          onClick={() => decreaseQty(item.productId || item.id || item._id!)} 
                          className="px-2 py-1 border rounded-md hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => increaseQty(item.productId || item.id || item._id!)} 
                          className="px-2 py-1 border rounded-md hover:bg-slate-100"
                          disabled={isOutOfStock || item.quantity >= available}
                        >
                          +
                        </button>
                        {hasQuantityIssue && (
                          <button
                            onClick={() => {
                              const currentQty = item.quantity;
                              const diff = currentQty - available;
                              for (let i = 0; i < diff; i++) {
                                decreaseQty(item.productId || item.id || item._id!);
                              }
                            }}
                            className="ml-2 text-xs text-blue-600 hover:underline"
                          >
                            Fix quantity
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-between items-end">
                      <p className="font-bold text-lg">₹{(unitPrice * item.quantity).toFixed(2)}</p>
                      <button 
                        onClick={() => removeFromCart(item.productId || item.id || item._id!)} 
                        className="text-sm text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-slate-50 p-6 rounded-xl border sticky top-24">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="font-semibold">Free</span></div>
            </div>
            <hr className="my-4"/>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            
            <button
              onClick={() => router.push("/checkout")}
              disabled={hasStockIssues || loading}
              className={`mt-6 w-full font-bold py-3 rounded-lg transition-colors ${
                hasStockIssues || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {loading ? 'Checking stock...' : hasStockIssues ? 'Fix cart issues' : 'Proceed to Checkout'}
            </button>
            
            {hasStockIssues && (
              <p className="text-xs text-center text-orange-600 mt-2">
                Please resolve stock issues above
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const CartIconLarge = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24 mx-auto text-slate-300">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c.51 0 .962-.344 1.087-.835l1.858-6.491A1.125 1.125 0 0 0 18 5.25H4.236a1.125 1.125 0 0 0-1.087.835L2.25 3Z" />
  </svg>
);
