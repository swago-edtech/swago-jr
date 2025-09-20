"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// --- Types ---
export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
};
export type CartItem = Product & { quantity: number };
export type User = {
  _id: string;
  phone: string;
  name?: string;
  age?: number;
  address?: string;
  orders: any[];
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
  setUser: (user: User | null) => void; // Function to update user
};

// --- Context Definition ---
const SharedContext = createContext<SharedContextType | undefined>(undefined);
const STORAGE_KEY = "swago_cart";

// --- Provider Component ---
export function SharedProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  // Effect to load cart from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch (e) { console.error(e); }
  }, []);

  // Effect to save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) { console.error(e); }
  }, [cart]);

  // Effect to check session status on navigation
  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.loggedIn ? data.user : null);
        } else {
          setUser(null);
        }
      } catch (error) { setUser(null); }
    }
    checkUser();
  }, [pathname]);

  // --- Cart Functions ---
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
  const increaseQty = (id: number) =>
    setCart((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: p.quantity + 1 } : p)));
  const decreaseQty = (id: number) =>
    setCart((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, quantity: Math.max(0, p.quantity - 1) } : p))
        .filter((p) => p.quantity > 0)
    );
  const total = cart.reduce((s, it) => s + it.price * it.quantity, 0);

  // --- Provider Value ---
  return (
    <SharedContext.Provider
      value={{ cart, total, addToCart, removeFromCart, clearCart, increaseQty, decreaseQty, user, setUser }}
    >
      {children}
    </SharedContext.Provider>
  );
}

// --- Custom Hook ---
export function useSharedContext() {
  const ctx = useContext(SharedContext);
  if (!ctx) throw new Error("useSharedContext must be used within a SharedProvider");
  return ctx;
}