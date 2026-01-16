// apps/web/src/context/SharedContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";

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
  age_category?: string;
  ageCategory?: string;
  core_elements?: string[];
  coreElements?: string[];
  benefits?: string;
  box_contents?: string;
  boxContents?: string;
  stock?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  slug?: string;
  lowStockThreshold?: number;
  totalSold?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CartItem = Product & { 
  quantity: number;
  productId?: string | number;
  addedAt?: Date | string;
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
  wishlist: (number | string)[];
  addToWishlist: (productId: number | string) => void;
  removeFromWishlist: (productId: number | string) => void;
  isWishlisted: (productId: number | string) => boolean;
  selectedKid: SelectedKid | null;
  setSelectedKid: (kid: SelectedKid | null) => void;
  clearSelectedKid: () => void;
  isCartSidebarOpen: boolean;
  openCartSidebar: () => void;
  closeCartSidebar: () => void;
};

const SharedContext = createContext<SharedContextType | undefined>(undefined);
const STORAGE_KEY = "swago_cart";
const KID_STORAGE_KEY = "selectedKidProfile";

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

export function SharedProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [wishlist, setWishlist] = useState<(number | string)[]>([]);
  const [selectedKid, setSelectedKidState] = useState<SelectedKid | null>(null);
  const [isCartSidebarOpen, setIsCartSidebarOpen] = useState(false);
  
  const cartSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedCartRef = useRef<string>('');
  const skipNextSyncRef = useRef(false);

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

  // Load cart from server when user logs in
  useEffect(() => {
    if (user && user.cart && user.cart.length > 0) {
      console.log('🔄 Loading merged cart from server:', user.cart.length, 'items');
      setCart(user.cart);
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
        image: item.images?.[0] || '/images/placeholder.png',
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
      image: item.images?.[0] || '/images/placeholder.png',
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
            setCart(loggedInUser.cart);
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
        clearSelectedKid(); // ✅ ADDED THIS LINE
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
    if (product.stock !== undefined && product.stock === 0) {
      alert("This product is out of stock");
      return;
    }

    setCart((prev) => {
      const productId = getProductId(product);
      const existing = prev.find((p) => getProductId(p) === productId);
      
      if (existing) {
        const newQuantity = existing.quantity + quantity;
        
        if (product.stock !== undefined && newQuantity > product.stock) {
          alert(`Only ${product.stock} items available in stock`);
          return prev;
        }
        
        return prev.map((p) =>
          getProductId(p) === productId ? { ...p, quantity: newQuantity } : p
        );
      }
      
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
        selectedKid,
        setSelectedKid,
        clearSelectedKid,
        isCartSidebarOpen,
        openCartSidebar,
        closeCartSidebar
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
