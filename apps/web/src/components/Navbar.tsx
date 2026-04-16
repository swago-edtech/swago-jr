// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useSharedContext, USER_EVENTS } from "@/context/SharedContext";
import { useState, useEffect, useRef } from "react";
import Logo from "./Logo";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { HiChevronDown, HiHeart, HiMenu } from "react-icons/hi";

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15, ease: "easeIn" } }
};

export default function Navbar() {
  const { user, cart, wishlist, selectedKid, openCartSidebar } = useSharedContext();

  const [isAgeDropdownOpen, setAgeDropdownOpen] = useState(false);
  const [isElementDropdownOpen, setElementDropdownOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const ageDropdownRef = useRef<HTMLDivElement>(null);
  const elementDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // ✅ UPDATED: Dispatch logout event to clear context
  const handleLogout = async () => {
    window.dispatchEvent(new CustomEvent(USER_EVENTS.LOGOUT));
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ageDropdownRef.current && !ageDropdownRef.current.contains(event.target as Node)) { setAgeDropdownOpen(false); }
      if (elementDropdownRef.current && !elementDropdownRef.current.contains(event.target as Node)) { setElementDropdownOpen(false); }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) { setUserMenuOpen(false); }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetch('/api/wallet/balance')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setWalletBalance(data.totalSwagoMoney || 0);
          }
        })
        .catch(console.error);
    } else {
      setWalletBalance(null);
    }
  }, [user]);

  return (
    <nav className="w-full bg-white text-slate-800 py-1.5 md:py-2.5 px-4 flex items-center justify-between border-b border-slate-200 shadow-sm sticky top-0 z-[100]">
      {/* 1. LEFT SECTION: Hamburger (Mobile) / Nav Links (Desktop) */}
      <div className="flex-initial md:flex-1 flex items-center">
        {/* Mobile Hamburger Icon */}
        {process.env.NEXT_PUBLIC_BLOG_ONLY_MODE !== "true" && (
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Open main menu"
              className="p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors"
            >
              <HiMenu className="w-6 h-6" />
            </button>
          </div>
        )}

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {process.env.NEXT_PUBLIC_BLOG_ONLY_MODE === "true" ? (
            <Link href="/blog/child-brain-quiz" className="transition-colors hover:text-black font-bold">Child Brain Quiz</Link>
          ) : (
            <>
              <motion.div whileHover={{ y: -2 }}>
                <Link href="/about" className="transition-colors hover:text-black">About Us</Link>
              </motion.div>

              {/* Shop By Categories Dropdown */}
              <motion.div className="relative" ref={elementDropdownRef} whileHover={{ y: -2 }}>
                <button onClick={() => setElementDropdownOpen(!isElementDropdownOpen)} className="transition-colors hover:text-black flex items-center gap-1">
                  Shop by Categories <HiChevronDown className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {isElementDropdownOpen && (
                    <motion.div
                      className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-slate-200 p-1 border-t-4 border-t-black"
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <Link href="/products" onClick={() => setElementDropdownOpen(false)} className="block px-3 py-1.5 text-sm rounded-sm font-semibold hover:bg-slate-100 uppercase tracking-tighter">All Categories</Link>
                      <Link href="/products?elements=S" onClick={() => setElementDropdownOpen(false)} className="block px-3 py-1.5 text-sm rounded-sm hover:bg-slate-100">S – Smart Tech</Link>
                      <Link href="/products?elements=W" onClick={() => setElementDropdownOpen(false)} className="block px-3 py-1.5 text-sm rounded-sm hover:bg-slate-100">W – Willpower</Link>
                      <Link href="/products?elements=A" onClick={() => setElementDropdownOpen(false)} className="block px-3 py-1.5 text-sm rounded-sm hover:bg-slate-100">A – Ambition</Link>
                      <Link href="/products?elements=G" onClick={() => setElementDropdownOpen(false)} className="block px-3 py-1.5 text-sm rounded-sm hover:bg-slate-100">G – Growth</Link>
                      <Link href="/products?elements=O" onClick={() => setElementDropdownOpen(false)} className="block px-3 py-1.5 text-sm rounded-sm hover:bg-slate-100">O – Optimization</Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* 2. CENTER SECTION: Logo */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <Logo />
      </div>

      {/* 3. RIGHT SECTION: Icons (Wishlist, Cart, User) */}
      <div className="flex-initial md:flex-1 flex justify-end items-center gap-2 md:gap-4">
        {process.env.NEXT_PUBLIC_BLOG_ONLY_MODE !== "true" && (
          <>
            {/* Swago Dollars Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href={user ? "/profile" : "/login?redirect=/profile"} className="relative p-1.5 sm:p-2 flex items-center gap-1.5 group transition-colors bg-purple-50 hover:bg-purple-100 rounded-lg sm:rounded-full md:rounded-lg" aria-label="Swago Dollars">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.484-1.112 2.428 0 1.369.962 2.406 2.022 2.898 1.201.558 2.397.864 2.397 1.468 0 .584-.528.924-1.15.924-.407 0-.76-.17-1.127-.446a.75.75 0 00-1.15.924c.712.886 1.706 1.417 2.766 1.572V18a.75.75 0 001.5 0v-.816a3.836 3.836 0 001.72-.756c.712-.566 1.112-1.484 1.112-2.428 0-1.369-.962-2.406-2.022-2.898-1.201-.558-2.397-.864-2.397-1.468 0-.584.528-.924 1.15-.924.407 0 .76.17 1.127.446a.75.75 0 001.15-.924c-.712-.886-1.706-1.417-2.766-1.572V6z" clipRule="evenodd" />
                </svg>
                {walletBalance !== null ? (
                  <span className="hidden lg:inline text-xs font-black text-purple-700 tracking-wide">{walletBalance} SD</span>
                ) : (
                  <span className="hidden lg:inline text-xs font-black text-purple-700 tracking-wide">Swago $</span>
                )}
              </Link>
            </motion.div>

            {/* Wishlist Button - Desktop Only */}
            <motion.div className="hidden md:block" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/wishlist" className="relative p-2 flex items-center gap-1 group transition-colors" aria-label="Wishlist">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-black group-hover:scale-110 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                {wishlist.length > 0 && (
                  <span className="absolute top-0 right-1 sm:right-0 bg-black text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] font-bold">
                    {wishlist.length}
                  </span>
                )}
                <span className="hidden lg:inline text-sm font-bold text-black">Wishlist</span>
              </Link>
            </motion.div>

            {/* Cart Button - Desktop & Mobile */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/cart" className="relative p-2 flex items-center gap-1 group transition-colors" aria-label="Cart">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-black group-hover:scale-110 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute top-0 right-1 sm:right-0 bg-purple-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] font-bold">
                    {itemCount}
                  </span>
                )}
                <span className="hidden lg:inline text-sm font-bold text-black">Cart</span>
              </Link>
            </motion.div>
          </>
        )}

        {/* User Menu */}
        {process.env.NEXT_PUBLIC_BLOG_ONLY_MODE !== "true" && (
          <div className="relative" ref={userMenuRef}>
            {user ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setUserMenuOpen(!isUserMenuOpen)}
                  className="p-2 -mr-2 rounded-full border border-transparent hover:border-slate-200 transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-black">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </motion.button>
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      className="absolute top-full right-0 mt-3 w-56 bg-white text-slate-800 rounded-xl shadow-2xl z-20 border border-slate-100 border-t-4 border-t-black overflow-hidden"
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <div className="px-4 py-4 bg-slate-50 border-b text-left">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-bold truncate text-slate-800 mt-1">
                          {user.name || user.email || user.phone}
                        </p>
                      </div>


                      <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-3 text-sm hover:bg-slate-50 text-slate-700 font-medium text-left">My Profile</Link>
                      <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="block px-4 py-3 text-sm hover:bg-slate-50 text-slate-700 font-medium text-left">My Orders</Link>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold border-t">Logout</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Link href="/login" aria-label="Login" className="p-2 -mr-2 rounded-full text-black hover:bg-slate-100 transition-colors flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </Link>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* --- Mobile Hamburger Menu Content --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden" />
            <motion.div
              className="md:hidden fixed top-0 left-0 h-full w-[80%] max-w-xs bg-white shadow-2xl z-40 overflow-y-auto"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center mb-8">
                  <Logo />
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">✕</button>
                </div>

                <div className="space-y-4">
                  <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between text-xl font-bold text-slate-800">
                    <div className="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-black">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                      </svg>
                      Wishlist
                    </div>
                    {wishlist.length > 0 && (
                      <span className="bg-black text-white rounded-full px-2 py-0.5 text-xs">
                        {wishlist.length}
                      </span>
                    )}
                  </Link>
                  <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="block text-xl font-bold text-slate-800">About Us</Link>
                  <hr className="border-slate-100" />

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Swago Elements</h3>
                    <div className="grid grid-cols-1 gap-3 pl-2">
                      <Link href="/products?elements=S" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 hover:text-black font-medium">Smart Tech</Link>
                      <Link href="/products?elements=W" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 hover:text-black font-medium">Willpower</Link>
                      <Link href="/products?elements=A" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 hover:text-black font-medium">Ambition</Link>
                      <Link href="/products?elements=G" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 hover:text-black font-medium">Growth</Link>
                      <Link href="/products?elements=O" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 hover:text-black font-medium">Optimization</Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
