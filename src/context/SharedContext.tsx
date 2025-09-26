"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// --- Types ---
export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  images: string[]; // Corrected: from image to images
  age_category: string;
  core_elements: string[];
};

export type CartItem = Product & { quantity: number };

export type User = {
  _id: string;
  phone: string;
  name?: string;
  age?: number;
  address?: string;
  orders: any[];
  wishlist: number[];
  email?: string;
};

type SharedContextType = {
  cart: CartItem[];
  total: number;
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  increaseQty: (id: number) => void;
  decreaseQty: (id: number) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  wishlist: number[];
  addToWishlist: (productId: number) => void;
  removeFromWishlist: (productId: number) => void;
  isWishlisted: (productId: number) => boolean;
};

const SharedContext = createContext<SharedContextType | undefined>(undefined);
const STORAGE_KEY = "swago_cart";

export function SharedProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) { console.error(e); }
  }, [cart]);

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
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
      } catch (error) { 
        setUser(null);
        setWishlist([]);
      }
    }
    checkUser();
  }, [pathname]);
  
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
  };

  const removeFromWishlist = async (productId: number) => {
    if (!user) return;
    setWishlist((prev) => prev.filter(id => id !== productId));
    await fetch('/api/wishlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
  };

  const isWishlisted = (productId: number) => {
    return wishlist.includes(productId);
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };
  
  const removeFromCart = (id: number) => setCart((prev) => prev.filter((p) => p.id !== id));
  const clearCart = () => setCart([]);
  const increaseQty = (id: number) => setCart((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: p.quantity + 1 } : p)));
  const decreaseQty = (id: number) => setCart((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(0, p.quantity - 1) } : p)).filter((p) => p.quantity > 0));
  const total = cart.reduce((s, it) => s + it.price * it.quantity, 0);

  return (
    <SharedContext.Provider
      value={{ cart, total, addToCart, removeFromCart, clearCart, increaseQty, decreaseQty, user, setUser, wishlist, addToWishlist, removeFromWishlist, isWishlisted }}
    >
      {children}
    </SharedContext.Provider>
  );
}

export function useSharedContext() {
  const ctx = useContext(SharedContext);
  if (!ctx) throw new Error("useSharedContext must be used within a SharedProvider");
  return ctx;
}