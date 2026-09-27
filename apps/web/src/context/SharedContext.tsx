// apps/web/src/context/SharedContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { Feedback } from "../lib/feedback";

type PopulatedOrder = {
  _id: string;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number; price: number; }[];
};

export type Product = {
  id?: number;
  _id?: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  originalPrice?: number;
  images: string[];
  videos?: string[];
  age_category?: string;
  ageCategory?: string;
  core_elements?: string[];
  coreElements?: string[];
  benefits?: string;
  box_contents?: string;
  boxContents?: string;
  stock?: number;
  availableStock?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  slug?: string;
  lowStockThreshold?: number;
  totalSold?: number;
  label?: string;
  rating?: number;
  numReviews?: number;
  showPromotionalMessage?: boolean;
  promotionalMessage?: string;
  skills?: { title: string; image: string }[];
  weight?: number;
  internationalPricing?: Record<string, { price: number; originalPrice?: number }> | Map<string, { price: number; originalPrice?: number }>;
  createdAt?: string;
  updatedAt?: string;
};

export type CartItem = Product & {
  quantity: number;
  productId?: string | number;
  addedAt?: Date | string;
  image?: string; // ✅ Legacy fallback from database
};

export type User = {
  _id: string;
  phone: string;
  name?: string;
  age?: number;
  address?: string;
  orders: PopulatedOrder[];
  wishlist: (number | string)[];
  email?: string;
  cart?: CartItem[];
  gender?: string;
  dob?: string;
  grade?: string;
  swagoMoney?: number;
  lotteryTickets?: { code: string; redeemedAt: string }[];
  ambassador?: {
    isAmbassador?: boolean;
    profileSetupRewardClaimed?: boolean;
    swagoMoney?: number;
    totalEarnings?: number;
    status?: string;
    currentStep?: number;
    badges?: { name: string; awardedAt: string }[];
    entryChallenge?: {
      submitted?: boolean;
      reelUrl?: string;
      instagramUsername?: string;
      submittedAt?: string;
      reviewedAt?: string;
      status?: string;
      reviewNotes?: string;
    };
    brainGym?: {
      completed?: boolean;
      reelUrl?: string;
      instagramUsername?: string;
      submittedAt?: string;
      reviewedAt?: string;
      status?: string;
      reviewNotes?: string;
    };

  };
};

export type CartPriceChange = {
  productId: string;
  productName: string;
  field: string;
  oldValue: string | number;
  newValue: string | number;
};

type SharedContextType = {
  cart: CartItem[];
  total: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (id: number | string) => void;
  clearCart: () => void;
  increaseQty: (id: number | string) => void;
  decreaseQty: (id: number | string) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  isLoadingUser: boolean;
  refreshUser: () => Promise<void>;
  wishlist: (number | string)[];
  addToWishlist: (productId: number | string) => void;
  removeFromWishlist: (productId: number | string) => void;
  isWishlisted: (productId: number | string) => boolean;
  isCartSidebarOpen: boolean;
  openCartSidebar: () => void;
  closeCartSidebar: () => void;
  appliedCoupon: any;
  setAppliedCoupon: (coupon: any) => void;
  appliedSwagoMoney: number;
  setAppliedSwagoMoney: (amount: number) => void;
  walletBalance: number;
  refreshCartPrices: () => Promise<CartPriceChange[]>;
  isRefreshingCart: boolean;
  lastCartRefreshAt: number | null;
};

const SharedContext = createContext<SharedContextType | undefined>(undefined);
const STORAGE_KEY = "swago_cart";

const USER_EVENTS = {
  LOGIN: 'user:login',
  LOGOUT: 'user:logout',
  PROFILE_UPDATE: 'user:profile_update',
};

const getProductId = (product: Product | CartItem): string => {
  if ('productId' in product && product.productId) {
    return product.productId.toString();
  }
  return product._id || product.id?.toString() || '';
};

// ✅ Helper to ensure cart items have the required images array
const normalizeCart = (items: any[]): CartItem[] => {
  return items.map(item => {
    const images = Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : (item.image ? [item.image] : []);
      
    return {
      ...item,
      images: images.length > 0 ? images : ['/images/placeholder.png']
    };
  });
};

export function SharedProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [wishlist, setWishlist] = useState<(number | string)[]>([]);
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [appliedSwagoMoney, setAppliedSwagoMoney] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isRefreshingCart, setIsRefreshingCart] = useState(false);
  const [lastCartRefreshAt, setLastCartRefreshAt] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetch('/api/wallet/balance')
        .then(r => r.json())
        .then(d => {
          if (d.success) setWalletBalance(d.totalSwagoMoney || 0);
        })
        .catch(console.error);
    } else {
      setWalletBalance(0);
    }
  }, [user]);

  useEffect(() => {
    setAppliedSwagoMoney((prev) => {
      if (prev === 0) return 0;

      const currentTotal = cart.reduce((s, it) => s + it.price * it.quantity, 0);
      const discount = appliedCoupon ? appliedCoupon.discount : 0;
      const amountAfterCoupon = currentTotal - discount;

      if (amountAfterCoupon < 799) return 0;

      const maxAllowed = Math.trunc(amountAfterCoupon * 0.05);
      const applicable = Math.min(walletBalance, maxAllowed);

      return prev !== applicable ? applicable : prev;
    });
  }, [cart, appliedCoupon, walletBalance]);

  const cartKeyRef = useRef<string>('');

  useEffect(() => {
    if (cart.length === 0) {
      if (appliedCoupon) setAppliedCoupon(null);
      if (appliedSwagoMoney > 0) setAppliedSwagoMoney(0);
      cartKeyRef.current = '';
      return;
    }

    const cartKey = JSON.stringify(cart.map(c => ({ id: getProductId(c), qty: c.quantity, price: c.price })));

    if (cartKey !== cartKeyRef.current) {
      cartKeyRef.current = cartKey;

      if (appliedCoupon && appliedCoupon.code) {
        const orderAmount = cart.reduce((s, it) => s + it.price * it.quantity, 0);

        const revalidate = async () => {
          try {
            const res = await fetch('/api/coupon/validate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                couponCode: appliedCoupon.code,
                orderAmount,
                cartItems: cart,
              }),
            });
            const data = await res.json();

            if (data.success && data.coupon && data.discount) {
              setAppliedCoupon((prev: any) => {
                if (prev?.code === data.coupon.code && prev?.discount === data.discount.amount) {
                  return prev;
                }
                return { code: data.coupon.code, discount: data.discount.amount, type: data.coupon.type, value: data.coupon.value, maxDiscount: data.coupon.maxDiscount };
              });
            } else {
              setAppliedCoupon(null);
            }
          } catch (e) {
            console.error("Error revalidating coupon on cart update:", e);
          }
        };

        const timer = setTimeout(revalidate, 500); // 500ms debounce
        return () => clearTimeout(timer);
      }
    }
  }, [cart, appliedCoupon, appliedSwagoMoney]);

  const cartSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedCartRef = useRef<string>('');
  const skipNextSyncRef = useRef(false);

  // =============================================
  // ✅ CART PRICE REFRESH — Syncs cart with DB
  // =============================================
  const REFRESH_DEBOUNCE_MS = 30_000; // 30 seconds minimum between refreshes
  const lastRefreshAttemptRef = useRef<number>(0);

  const refreshCartPrices = useCallback(async (): Promise<CartPriceChange[]> => {
    const currentCart = cartRef.current;
    if (currentCart.length === 0) return [];

    const now = Date.now();
    if (now - lastRefreshAttemptRef.current < REFRESH_DEBOUNCE_MS) {
      console.log('⏭️ Cart refresh skipped (debounced)');
      return [];
    }
    lastRefreshAttemptRef.current = now;

    setIsRefreshingCart(true);
    try {
      const requestItems = currentCart.map(item => ({
        productId: getProductId(item),
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        weight: item.weight,
      }));

      const res = await fetch('/api/cart/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: requestItems }),
      });

      if (!res.ok) {
        console.error('❌ Cart refresh API failed:', res.status);
        return [];
      }

      const data = await res.json();

      if (!data.success) {
        console.error('❌ Cart refresh failed:', data.error);
        return [];
      }

      const changes: CartPriceChange[] = data.changes || [];
      const removedItems: { productId: string; name: string; reason: string }[] = data.removedItems || [];

      if (data.hasChanges || data.items?.length > 0) {
        setCart(prevCart => {
          let updatedCart = [...prevCart];

          if (removedItems.length > 0) {
            const removedIds = new Set(removedItems.map(r => r.productId));
            updatedCart = updatedCart.filter(item => !removedIds.has(getProductId(item)));
          }

          updatedCart = updatedCart.map(item => {
            const itemId = getProductId(item);
            const refreshed = data.items.find((r: any) =>
              r.productId === itemId || r._id === itemId || r.slug === itemId
            );

            if (!refreshed) return item;

            return {
              ...item,
              price: refreshed.price,
              name: refreshed.name,
              images: refreshed.images || item.images,
              stock: refreshed.stock,
              originalPrice: refreshed.originalPrice || item.originalPrice,
              slug: refreshed.slug || item.slug,
              weight: refreshed.weight !== undefined ? refreshed.weight : item.weight,
              internationalPricing:
                refreshed.internationalPricing !== undefined
                  ? refreshed.internationalPricing
                  : item.internationalPricing,
              quantity: item.quantity, // Stock decoupled
            };
          }).filter(item => item.quantity > 0);

          return normalizeCart(updatedCart);
        });
      }

      setLastCartRefreshAt(Date.now());

      if (changes.length > 0 || removedItems.length > 0) {
        console.log('🔄 Cart refreshed with changes:', changes.length, 'changes,', removedItems.length, 'removed');
      } else {
        console.log('✅ Cart prices verified — no changes');
      }

      return changes;
    } catch (error) {
      console.error('❌ Cart refresh error:', error);
      return [];
    } finally {
      setIsRefreshingCart(false);
    }
  }, []);

  const cartRef = useRef<CartItem[]>([]);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Auto-refresh cart prices on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (cartRef.current.length > 0) {
        refreshCartPrices();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshCartPrices]);

  // Load cart from localStorage on mount + trigger initial refresh
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const loadedCart = normalizeCart(JSON.parse(raw));
        setCart(loadedCart);
        if (loadedCart.length > 0) {
          setTimeout(() => refreshCartPrices(), 500);
        }
      }
    } catch (e) {
      console.error("Error loading cart:", e);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Error saving cart:", e);
    }
  }, [cart]);

  // Load cart from server when user logs in
  useEffect(() => {
    if (user && user.cart && user.cart.length > 0) {
      console.log('🔄 Loading merged cart from server:', user.cart.length, 'items');
      setCart(normalizeCart(user.cart));
      skipNextSyncRef.current = true;
    }
  }, [user?._id]);

  const syncCartToDatabase = useCallback(async (cartData: CartItem[]) => {
    if (!user) return;

    if (skipNextSyncRef.current) {
      console.log('⏭️ Skipping sync (just loaded from server)');
      skipNextSyncRef.current = false;

      const dbCart = cartData.map(item => ({
        productId: getProductId(item),
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        slug: item.slug,
        weight: item.weight,
        image: item.images?.[0] || '/images/placeholder.png',
        images: item.images || ['/images/placeholder.png'],
        addedAt: new Date()
      }));
      lastSyncedCartRef.current = JSON.stringify(dbCart);
      return;
    }

    const dbCart = cartData.map(item => ({
      productId: getProductId(item),
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      slug: item.slug,
      weight: item.weight,
      image: item.images?.[0] || '/images/placeholder.png',
      images: item.images || ['/images/placeholder.png'],
      addedAt: new Date()
    }));

    const cartString = JSON.stringify(dbCart);

    if (cartString === lastSyncedCartRef.current) {
      console.log('⏭️ Cart unchanged, skipping sync');
      return;
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: dbCart }),
      });

      if (res.ok) {
        lastSyncedCartRef.current = cartString;
        console.log('✅ Cart synced to database:', dbCart.length, 'items');
      } else {
        console.error('❌ Failed to sync cart');
      }
    } catch (error) {
      console.error('❌ Cart sync error:', error);
    }
  }, [user]);

  // Debounced cart sync effect
  useEffect(() => {
    if (!user) return;

    if (cartSyncTimerRef.current) {
      clearTimeout(cartSyncTimerRef.current);
    }

    cartSyncTimerRef.current = setTimeout(() => {
      syncCartToDatabase(cart);
    }, 500);

    return () => {
      if (cartSyncTimerRef.current) {
        clearTimeout(cartSyncTimerRef.current);
      }
    };
  }, [cart, user, syncCartToDatabase]);

  // Centralized function to fetch user data
  const fetchUserData = async () => {
    try {
      setIsLoadingUser(true);
      const res = await fetch("/api/me", {
        headers: {
          'Cache-Control': 'private, max-age=5, stale-while-revalidate=30',
        }
      });

      if (res.ok) {
        const data = await res.json();
        const loggedInUser = data.loggedIn ? data.user : null;
        setUser(loggedInUser);
        if (loggedInUser) {
          setWishlist(loggedInUser.wishlist || []);
          if (loggedInUser.cart && loggedInUser.cart.length > 0) {
            console.log('✅ Cart loaded from /api/me:', loggedInUser.cart.length, 'items');
            setCart(normalizeCart(loggedInUser.cart));
            skipNextSyncRef.current = true;
          }
        } else {
          setWishlist([]);
        }
      } else {
        setUser(null);
        setWishlist([]);
      }
    } catch (error: unknown) {
      console.error("Failed to check user:", error);
      setUser(null);
      setWishlist([]);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const refreshUser = async () => {
    await fetchUserData();
  };

  // Check user on mount ONLY
  useEffect(() => {
    fetchUserData();
  }, []);

  // Listen for user update events
  useEffect(() => {
    const handleUserEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('User event received:', customEvent.type);

      if (customEvent.type === USER_EVENTS.LOGIN ||
        customEvent.type === USER_EVENTS.PROFILE_UPDATE) {
        fetchUserData();
      } else if (customEvent.type === USER_EVENTS.LOGOUT) {
        setUser(null);
        setWishlist([]);
        setIsLoadingUser(false);
      }
    };

    window.addEventListener(USER_EVENTS.LOGIN, handleUserEvent);
    window.addEventListener(USER_EVENTS.LOGOUT, handleUserEvent);
    window.addEventListener(USER_EVENTS.PROFILE_UPDATE, handleUserEvent);

    return () => {
      window.removeEventListener(USER_EVENTS.LOGIN, handleUserEvent);
      window.removeEventListener(USER_EVENTS.LOGOUT, handleUserEvent);
      window.removeEventListener(USER_EVENTS.PROFILE_UPDATE, handleUserEvent);
    };
  }, []);

  const addToWishlist = async (productId: number | string) => {
    if (!user) {
      alert("Please log in to add items to your wishlist.");
      return;
    }

    console.log('💝 Adding to wishlist:', productId, 'Type:', typeof productId);

    setWishlist((prev) => {
      const exists = prev.some(id => {
        if (typeof id === typeof productId) return id === productId;
        return id.toString() === productId.toString();
      });

      if (exists) {
        console.log('⚠️ Already in wishlist (local check)');
        return prev;
      }

      Feedback.playPop();
      return [...prev, productId];
    });

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        console.error('Failed to add to wishlist');
        setWishlist((prev) => prev.filter(id => {
          if (typeof id === typeof productId) return id !== productId;
          return id.toString() !== productId.toString();
        }));
        return;
      }

      const data = await res.json();
      console.log('✅ Added to wishlist successfully');

      if (data.wishlist) {
        setWishlist(data.wishlist);
      }

    } catch (error) {
      console.error('Error adding to wishlist:', error);
      setWishlist((prev) => prev.filter(id => {
        if (typeof id === typeof productId) return id !== productId;
        return id.toString() !== productId.toString();
      }));
    }
  };

  const removeFromWishlist = async (productId: number | string) => {
    if (!user) return;

    console.log('💔 Removing from wishlist:', productId, 'Type:', typeof productId);
    
    Feedback.playRemove();

    setWishlist((prev) => prev.filter(id => {
      if (typeof id === typeof productId) return id !== productId;
      return id.toString() !== productId.toString();
    }));

    try {
      const res = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        console.error('Failed to remove from wishlist');
        setWishlist((prev) => [...prev, productId]);
        return;
      }

      const data = await res.json();
      console.log('✅ Removed from wishlist successfully');

      if (data.wishlist) {
        setWishlist(data.wishlist);
      }

    } catch (error) {
      console.error('Error removing from wishlist:', error);
      setWishlist((prev) => [...prev, productId]);
    }
  };

  const isWishlisted = (productId: number | string) => {
    return wishlist.some(id => {
      if (id === productId) return true;

      if (typeof id === 'string' && typeof productId === 'number') {
        return id === productId.toString();
      }
      if (typeof id === 'number' && typeof productId === 'string') {
        return id.toString() === productId;
      }

      return false;
    });
  };

  // Cart functions
  const addToCart = (product: Product, quantity: number = 1) => {
    const available =
      product.availableStock ??
      (product.stock !== undefined ? product.stock : undefined);

    if (available !== undefined && available === 0) {
      alert("This product is out of stock");
      return;
    }

    // Stock decoupled: always allow adding to cart
    setCart((prev) => {
      const productId = getProductId(product);
      const existing = prev.find((p) => getProductId(p) === productId);

      if (existing) {
        const newQuantity = existing.quantity + quantity;

        if (available !== undefined && newQuantity > available) {
          alert(`Only ${available} items available in stock`);
          return prev;
        }

        return prev.map((p) =>
          getProductId(p) === productId ? { ...p, quantity: newQuantity } : p
        );
      }

      if (available !== undefined && quantity > available) {
        alert(`Only ${available} items available in stock`);
        return prev;
      }

      Feedback.playPop();
      return [...prev, { ...product, quantity, availableStock: available }];
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (id: number | string) => {
    Feedback.playRemove();
    setCart((prev) => prev.filter((p) => getProductId(p) !== id.toString()));
  };

  const clearCart = () => setCart([]);

  const increaseQty = (id: number | string) =>
    setCart((prev) => prev.map((p) => {
      if (getProductId(p) !== id.toString()) return p;

      // Stock decoupled: always allow increase
      const newQuantity = p.quantity + 1;
      const available =
        p.availableStock ??
        (p.stock !== undefined ? p.stock : undefined);

      if (available !== undefined && newQuantity > available) {
        alert(`Only ${available} items available in stock`);
        return p;
      }

      
      Feedback.playPop();
      return { ...p, quantity: newQuantity };
    }));

  const decreaseQty = (id: number | string) => {
    Feedback.playRemove();
    setCart((prev) =>
      prev.map((p) =>
        getProductId(p) === id.toString()
          ? { ...p, quantity: Math.max(0, p.quantity - 1) }
          : p
      ).filter((p) => p.quantity > 0)
    );
  };

  const total = cart.reduce((s, it) => s + it.price * it.quantity, 0);

  // ✅ Cart Sidebar Functions
  const openCartSidebar = () => {
    setIsCartSidebarOpen(true);
  };

  const closeCartSidebar = () => {
    setIsCartSidebarOpen(false);
  };

  return (
    <SharedContext.Provider
      value={{
        cart,
        total,
        addToCart,
        removeFromCart,
        clearCart,
        increaseQty,
        decreaseQty,
        user,
        setUser,
        isLoadingUser,
        refreshUser,
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isWishlisted,
        isCartSidebarOpen,
        openCartSidebar,
        closeCartSidebar,
        appliedCoupon,
        setAppliedCoupon,
        appliedSwagoMoney,
        setAppliedSwagoMoney,
        walletBalance,
        refreshCartPrices,
        isRefreshingCart,
        lastCartRefreshAt
      }}
    >
      {children}
    </SharedContext.Provider>
  );
}

export { USER_EVENTS };

export function useSharedContext() {
  const ctx = useContext(SharedContext);
  if (!ctx) throw new Error("useSharedContext must be used within a SharedProvider");
  return ctx;
}
