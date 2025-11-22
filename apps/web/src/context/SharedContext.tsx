// apps/web/src/context/SharedContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type PopulatedOrder = {
  _id: string;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number; price: number; }[];
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  images: string[];
  age_category: string;
  core_elements: string[];
  benefits?: string;      // Changed from string[] to string
  box_contents?: string; // Changed from string[] to string
};

export type CartItem = Product & { quantity: number };

export type User = {
  _id: string;
  phone: string;
  name?: string;
  age?: number;
  address?: string;
  orders: PopulatedOrder[];
  wishlist: number[];
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
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  increaseQty: (id: number) => void;
  decreaseQty: (id: number) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  isLoadingUser: boolean;
  refreshUser: () => Promise<void>;
  wishlist: number[];
  addToWishlist: (productId: number) => void;
  removeFromWishlist: (productId: number) => void;
  isWishlisted: (productId: number) => boolean;
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
  WISHLIST_UPDATE: 'user:wishlist_update',
};

export function SharedProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [wishlist, setWishlist] = useState<number[]>([]);
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

  // Listen for user update events
  useEffect(() => {
    const handleUserEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('User event received:', customEvent.type);
      
      if (customEvent.type === USER_EVENTS.LOGIN || 
          customEvent.type === USER_EVENTS.PROFILE_UPDATE ||
          customEvent.type === USER_EVENTS.WISHLIST_UPDATE) {
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
    window.addEventListener(USER_EVENTS.WISHLIST_UPDATE, handleUserEvent);

    return () => {
      window.removeEventListener(USER_EVENTS.LOGIN, handleUserEvent);
      window.removeEventListener(USER_EVENTS.LOGOUT, handleUserEvent);
      window.removeEventListener(USER_EVENTS.PROFILE_UPDATE, handleUserEvent);
      window.removeEventListener(USER_EVENTS.WISHLIST_UPDATE, handleUserEvent);
    };
  }, []);
  
  // Wishlist functions
  const addToWishlist = async (productId: number) => {
    if (!user) {
      alert("Please log in to add items to your wishlist.");
      return;
    }
    setWishlist((prev) => [...prev, productId]);
    await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    window.dispatchEvent(new CustomEvent(USER_EVENTS.WISHLIST_UPDATE));
  };

  const removeFromWishlist = async (productId: number) => {
    if (!user) return;
    setWishlist((prev) => prev.filter(id => id !== productId));
    await fetch('/api/wishlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    window.dispatchEvent(new CustomEvent(USER_EVENTS.WISHLIST_UPDATE));
  };

  const isWishlisted = (productId: number) => {
    return wishlist.includes(productId);
  };

  // Cart functions
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + quantity } : p
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };
  
  const removeFromCart = (id: number) => setCart((prev) => prev.filter((p) => p.id !== id));
  const clearCart = () => setCart([]);
  const increaseQty = (id: number) => setCart((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: p.quantity + 1 } : p)));
  const decreaseQty = (id: number) => setCart((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(0, p.quantity - 1) } : p)).filter((p) => p.quantity > 0));
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