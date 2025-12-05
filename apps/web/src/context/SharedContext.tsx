// apps/web/src/context/SharedContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type PopulatedOrder = {
  _id: string;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number; price: number; }[];
};

// ✅ Updated Product type - supports BOTH old and new formats
export type Product = {
  // IDs (support both)
  id?: number;              // Old (hardcoded products)
  _id?: string;             // New (MongoDB products)
  
  // Basic fields
  name: string;
  description: string;
  price: number;
  
  // Price (support both naming conventions)
  original_price?: number;  // Old
  originalPrice?: number;   // New
  
  images: string[];
  
  // Age category (support both)
  age_category?: string;    // Old
  ageCategory?: string;     // New
  
  // Core elements (support both)
  core_elements?: string[]; // Old
  coreElements?: string[];  // New
  
  benefits?: string;
  
  // Box contents (support both)
  box_contents?: string;    // Old
  boxContents?: string;     // New
  
  // New fields (only in DB products)
  stock?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  slug?: string;
  lowStockThreshold?: number;
  totalSold?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CartItem = Product & { quantity: number };

export type User = {
  _id: string;
  phone: string;
  name?: string;
  age?: number;
  address?: string;
  orders: PopulatedOrder[];
  wishlist: (number | string)[]; // ✅ CHANGED: Support both types
  email?: string;
};

export type SelectedKid = {
  _id: string;
  name: string;
  age: number;
  avatarColor: string;
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
  wishlist: (number | string)[]; // ✅ CHANGED: Support both types
  addToWishlist: (productId: number | string) => void; // ✅ CHANGED
  removeFromWishlist: (productId: number | string) => void; // ✅ CHANGED
  isWishlisted: (productId: number | string) => boolean; // ✅ CHANGED
  selectedKid: SelectedKid | null;
  setSelectedKid: (kid: SelectedKid | null) => void;
  clearSelectedKid: () => void;
};

const SharedContext = createContext<SharedContextType | undefined>(undefined);
const STORAGE_KEY = "swago_cart";
const KID_STORAGE_KEY = "selectedKidProfile";

// Event names for user updates
const USER_EVENTS = {
  LOGIN: 'user:login',
  LOGOUT: 'user:logout',
  PROFILE_UPDATE: 'user:profile_update',
};

// Helper to get product ID (supports both formats)
const getProductId = (product: Product): string => {
  return product._id || product.id?.toString() || '';
};

export function SharedProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [wishlist, setWishlist] = useState<(number | string)[]>([]); // ✅ CHANGED
  const [selectedKid, setSelectedKidState] = useState<SelectedKid | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch (e) { 
      console.error("Error loading cart:", e); 
    }
  }, []);

  // Load selected kid from localStorage on mount
  useEffect(() => {
    try {
      const storedKid = localStorage.getItem(KID_STORAGE_KEY);
      if (storedKid) {
        setSelectedKidState(JSON.parse(storedKid));
      }
    } catch (e) {
      console.error("Error loading selected kid:", e);
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

  // Save selected kid to localStorage whenever it changes
  useEffect(() => {
    try {
      if (selectedKid) {
        localStorage.setItem(KID_STORAGE_KEY, JSON.stringify(selectedKid));
      } else {
        localStorage.removeItem(KID_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Error saving selected kid:", e);
    }
  }, [selectedKid]);

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

  // Manual refresh function
  const refreshUser = async () => {
    await fetchUserData();
  };

  // Check user on mount ONLY
  useEffect(() => {
    fetchUserData();
  }, []);

  // Listen for user update events (LOGIN, LOGOUT, PROFILE_UPDATE only)
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
  
  // ✅ FIXED: Improved wishlist functions with proper optimistic updates
  const addToWishlist = async (productId: number | string) => {
    if (!user) {
      alert("Please log in to add items to your wishlist.");
      return;
    }
    
    console.log('💝 Adding to wishlist:', productId, 'Type:', typeof productId);
    
    // ✅ Optimistic update with duplicate check
    setWishlist((prev) => {
      const exists = prev.some(id => {
        if (typeof id === typeof productId) return id === productId;
        return id.toString() === productId.toString();
      });
      
      if (exists) {
        console.log('⚠️ Already in wishlist (local check)');
        return prev;
      }
      
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
        // ✅ Revert optimistic update with proper type comparison
        setWishlist((prev) => prev.filter(id => {
          if (typeof id === typeof productId) return id !== productId;
          return id.toString() !== productId.toString();
        }));
        return;
      }
      
      const data = await res.json();
      console.log('✅ Added to wishlist successfully');
      
      // ✅ Update from server response (most reliable)
      if (data.wishlist) {
        setWishlist(data.wishlist);
      }
      
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      // ✅ Revert optimistic update with proper type comparison
      setWishlist((prev) => prev.filter(id => {
        if (typeof id === typeof productId) return id !== productId;
        return id.toString() !== productId.toString();
      }));
    }
  };

  const removeFromWishlist = async (productId: number | string) => {
    if (!user) return;
    
    console.log('💔 Removing from wishlist:', productId, 'Type:', typeof productId);
    
    // ✅ Optimistic update with proper type comparison
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
        // ✅ Revert optimistic update
        setWishlist((prev) => [...prev, productId]);
        return;
      }
      
      const data = await res.json();
      console.log('✅ Removed from wishlist successfully');
      
      // ✅ Update from server response (most reliable)
      if (data.wishlist) {
        setWishlist(data.wishlist);
      }
      
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      // ✅ Revert optimistic update
      setWishlist((prev) => [...prev, productId]);
    }
  };

  const isWishlisted = (productId: number | string) => {
    // ✅ Support both number and string comparison
    return wishlist.some(id => {
      // Direct match (handles same type comparison)
      if (id === productId) return true;
      
      // Cross-type match (string "123" === number 123)
      if (typeof id === 'string' && typeof productId === 'number') {
        return id === productId.toString();
      }
      if (typeof id === 'number' && typeof productId === 'string') {
        return id.toString() === productId;
      }
      
      return false;
    });
  };

  // Cart functions (updated to support both ID formats)
  const addToCart = (product: Product, quantity: number = 1) => {
    // Check stock before adding
    if (product.stock !== undefined && product.stock === 0) {
      alert("This product is out of stock");
      return;
    }

    setCart((prev) => {
      const productId = getProductId(product);
      const existing = prev.find((p) => getProductId(p) === productId);
      
      if (existing) {
        const newQuantity = existing.quantity + quantity;
        
        // Check if new quantity exceeds stock
        if (product.stock !== undefined && newQuantity > product.stock) {
          alert(`Only ${product.stock} items available in stock`);
          return prev;
        }
        
        return prev.map((p) =>
          getProductId(p) === productId ? { ...p, quantity: newQuantity } : p
        );
      }
      
      // Check stock for new item
      if (product.stock !== undefined && quantity > product.stock) {
        alert(`Only ${product.stock} items available in stock`);
        return prev;
      }
      
      return [...prev, { ...product, quantity }];
    });
  };
  
  const removeFromCart = (id: number | string) => 
    setCart((prev) => prev.filter((p) => getProductId(p) !== id.toString()));
  
  const clearCart = () => setCart([]);
  
  const increaseQty = (id: number | string) => 
    setCart((prev) => prev.map((p) => {
      if (getProductId(p) !== id.toString()) return p;
      
      const newQuantity = p.quantity + 1;
      
      // Check stock limit
      if (p.stock !== undefined && newQuantity > p.stock) {
        alert(`Only ${p.stock} items available in stock`);
        return p;
      }
      
      return { ...p, quantity: newQuantity };
    }));
  
  const decreaseQty = (id: number | string) => 
    setCart((prev) => 
      prev.map((p) => 
        getProductId(p) === id.toString() 
          ? { ...p, quantity: Math.max(0, p.quantity - 1) } 
          : p
      ).filter((p) => p.quantity > 0)
    );
  
  const total = cart.reduce((s, it) => s + it.price * it.quantity, 0);

  // Kid profile functions
  const setSelectedKid = (kid: SelectedKid | null) => {
    setSelectedKidState(kid);
  };

  const clearSelectedKid = () => {
    setSelectedKidState(null);
    try {
      localStorage.removeItem(KID_STORAGE_KEY);
    } catch (e) {
      console.error("Error clearing selected kid:", e);
    }
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
        selectedKid,
        setSelectedKid,
        clearSelectedKid
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
