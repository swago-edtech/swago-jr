// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useSharedContext } from "@/context/SharedContext";
import { useState, useEffect, useRef } from "react";
import Logo from "./Logo";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { HiChevronDown, HiShoppingCart, HiHeart, HiUserCircle, HiMenu } from "react-icons/hi";

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

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const ageDropdownRef = useRef<HTMLDivElement>(null);
  const elementDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
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

  return (
    <nav className="w-full bg-white text-slate-800 p-4 flex justify-between items-center border-b border-slate-200 shadow-sm relative z-50">
      {/* Mobile: Hamburger on left */}
      <div className="md:hidden flex items-center">
        <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} aria-label="Open main menu">
          <HiMenu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile: Logo centered, Desktop: Logo left */}
      <div className="md:flex-none flex-1 flex justify-center md:justify-start">
        <Logo />
      </div>
      
      <div className="flex items-center gap-6">
        {/* --- Desktop Navigation --- */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <motion.div whileHover={{ y: -2 }}>
            <Link href="/about" className="transition-colors hover:text-[hsl(var(--swago-purple))]">About Us</Link>
          </motion.div>
          
          <motion.div className="relative" ref={ageDropdownRef} whileHover={{ y: -2 }}>
            <button onClick={() => setAgeDropdownOpen(!isAgeDropdownOpen)} className="transition-colors hover:text-[hsl(var(--swago-purple))] flex items-center gap-1">
              Shop by Age <HiChevronDown className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {isAgeDropdownOpen && (
                <motion.div 
                  className="absolute top-full right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-20 border border-slate-200 p-1 border-t-4 border-t-[hsl(var(--swago-teal))]"
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Link href="/products" onClick={() => setAgeDropdownOpen(false)} className="block px-3 py-1.5 text-sm rounded-sm font-semibold hover:bg-slate-100 hover:text-[hsl(var(--swago-teal))]">All Ages</Link>
                  <Link href="/products?age=5-7" onClick={() => setAgeDropdownOpen(false)} className="block px-3 py-1.5 text-sm rounded-sm hover:bg-slate-100 hover:text-[hsl(var(--swago-teal))]">Ages 5-7</Link>
                  <Link href="/products?age=8-10" onClick={() => setAgeDropdownOpen(false)} className="block px-3 py-1.5 text-sm rounded-sm hover:bg-slate-100 hover:text-[hsl(var(--swago-teal))]">Ages 8-10</Link>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          <motion.div className="relative" ref={elementDropdownRef} whileHover={{ y: -2 }}>
            <button onClick={() => setElementDropdownOpen(!isElementDropdownOpen)} className="transition-colors hover:text-[hsl(var(--swago-purple))] flex items-center gap-1">
              Swago Elements <HiChevronDown className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {isElementDropdownOpen && (
                <motion.div 
                  className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-slate-200 p-1 border-t-4 border-t-[hsl(var(--swago-orange))]"
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Link href="/products" onClick={() => setElementDropdownOpen(false)} className="block px-3 py-1.5 text-sm rounded-sm font-semibold hover:bg-slate-100 hover:text-[hsl(var(--swago-orange))]">All Elements</Link>
                  <Link href="/products?elements=S" onClick={() => setElementDropdownOpen(false)} className="block px-3 py-1.5 text-sm rounded-sm hover:bg-slate-100 hover:text-[hsl(var(--swago-orange))]">S – Smart Tech</Link>
                  <Link href="/products?elements=W" onClick={() => setElementDropdownOpen(false)} className="block px-3 py-1.5 text-sm rounded-sm hover:bg-slate-100 hover:text-[hsl(var(--swago-orange))]">W – Willpower</Link>
                  <Link href="/products?elements=A" onClick={() => setElementDropdownOpen(false)} className="block px-3 py-1.5 text-sm rounded-sm hover:bg-slate-100 hover:text-[hsl(var(--swago-orange))]">A – Ambition</Link>
                  <Link href="/products?elements=G" onClick={() => setElementDropdownOpen(false)} className="block px-3 py-1.5 text-sm rounded-sm hover:bg-slate-100 hover:text-[hsl(var(--swago-orange))]">G – Growth</Link>
                  <Link href="/products?elements=O" onClick={() => setElementDropdownOpen(false)} className="block px-3 py-1.5 text-sm rounded-sm hover:bg-slate-100 hover:text-[hsl(var(--swago-orange))]">O – Optimization</Link>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* --- Right side Icons (DESKTOP ONLY) --- */}
        <div className="hidden md:flex items-center gap-4">
          {/* Kids Zone Button - Desktop Only */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {selectedKid ? (
              <Link
                href="/kids/dashboard"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm shadow-md font-bold"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: selectedKid.avatarColor }}
                >
                  {selectedKid.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">{selectedKid.name}</span>
              </Link>
            ) : (
              <Link
                href="/kids"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 py-2 rounded-full text-sm shadow-md flex items-center gap-2"
              >
                <span>🎮</span>
                <span>Kids Zone</span>
              </Link>
            )}
          </motion.div>

          {/* Cart Button - Desktop */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button 
              onClick={openCartSidebar}
              className="flex items-center gap-2 text-white font-bold bg-[hsl(var(--swago-pink))] px-4 py-2 rounded-full text-sm shadow-md"
            >
              <HiShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && <span className="bg-white text-[hsl(var(--swago-pink))] rounded-full px-2 text-xs">{itemCount}</span>}
            </button>
          </motion.div>

          {/* Wishlist - Desktop */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/wishlist" className="flex items-center gap-2 text-white font-bold bg-[hsl(var(--swago-pink))] px-4 py-2 rounded-full text-sm shadow-md">
              <HiHeart className="w-5 h-5" />
              <span className="hidden sm:inline">Wishlist</span>
              {wishlist.length > 0 && <span className="bg-white text-[hsl(var(--swago-pink))] rounded-full px-2 text-xs">{wishlist.length}</span>}
            </Link>
          </motion.div>

          {/* User Menu - Desktop */}
          <div className="relative" ref={userMenuRef}>
            {user ? (
              <>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" aria-label="Open user menu" onClick={() => setUserMenuOpen(!isUserMenuOpen)} className="flex items-center p-1 rounded-full">
                  <HiUserCircle className="w-6 h-6 text-slate-500" />
                </motion.button>
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div 
                      className="absolute top-full right-0 mt-2 w-48 bg-white text-slate-800 rounded-md shadow-lg z-20 border border-slate-200 border-t-4 border-t-[hsl(var(--swago-purple))]"
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <div className="px-4 py-3 border-b">
                        <p className="text-sm">Signed in as</p>
                        <p className="text-sm font-medium">
                          {user.name || user.email || user.phone}
                        </p>
                      </div>
                      <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 hover:text-[hsl(var(--swago-purple))]">My Profile</Link>
                      <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 hover:text-[hsl(var(--swago-purple))]">My Orders</Link>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">Logout</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Link href="/login" aria-label="Login" className="flex items-center p-1 rounded-full">
                  <HiUserCircle className="w-6 h-6 text-slate-500" />
                </Link>
              </motion.div>
            )}
          </div>
        </div>

        {/* Mobile: User Menu on right */}
        <div className="md:hidden relative" ref={userMenuRef}>
          {user ? (
            <>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" aria-label="Open user menu" onClick={() => setUserMenuOpen(!isUserMenuOpen)} className="flex items-center p-1 rounded-full">
                <HiUserCircle className="w-6 h-6 text-slate-500" />
              </motion.button>
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div 
                    className="absolute top-full right-0 mt-2 w-56 bg-white text-slate-800 rounded-md shadow-lg z-20 border border-slate-200 border-t-4 border-t-[hsl(var(--swago-purple))]"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm">Signed in as</p>
                      <p className="text-sm font-medium truncate">
                        {user.name || user.email || user.phone}
                      </p>
                    </div>
                    
                    {/* Kids Zone in mobile user menu */}
                    {selectedKid ? (
                      <Link 
                        href="/kids/dashboard" 
                        onClick={() => setUserMenuOpen(false)} 
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-[hsl(var(--swago-purple))] border-b"
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: selectedKid.avatarColor }}
                        >
                          {selectedKid.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold">{selectedKid.name}&apos;s Dashboard</span>
                      </Link>
                    ) : (
                      <Link 
                        href="/kids" 
                        onClick={() => setUserMenuOpen(false)} 
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-[hsl(var(--swago-purple))] font-bold border-b"
                      >
                        <span>🎮</span> Kids Zone
                      </Link>
                    )}
                    
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 hover:text-[hsl(var(--swago-purple))]">My Profile</Link>
                    <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 hover:text-[hsl(var(--swago-purple))]">My Orders</Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">Logout</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Link href="/login" aria-label="Login" className="flex items-center p-1 rounded-full">
                <HiUserCircle className="w-6 h-6 text-slate-500" />
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* --- Mobile Main Menu (Hamburger) --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg z-20 border-t border-slate-200"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex flex-col p-4 space-y-2">
              {/* Cart moved to main menu */}
              <button 
                onClick={() => {
                  openCartSidebar();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 p-3 hover:bg-pink-50 rounded-md text-[hsl(var(--swago-pink))] font-bold"
              >
                <HiShoppingCart className="w-5 h-5" />
                <span>Cart</span>
                {itemCount > 0 && <span className="ml-auto bg-[hsl(var(--swago-pink))] text-white rounded-full px-2 py-0.5 text-xs">{itemCount}</span>}
              </button>

              <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 hover:bg-pink-50 rounded-md">
                <HiHeart className="w-5 h-5" />
                <span>Wishlist</span>
                {wishlist.length > 0 && <span className="ml-auto bg-slate-200 text-slate-700 rounded-full px-2 py-0.5 text-xs">{wishlist.length}</span>}
              </Link>
              
              <hr className="my-2"/>
              
              <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="p-3 hover:bg-slate-50 rounded-md">About Us</Link>
              
              <hr className="my-2"/>
              <h3 className="font-bold text-slate-400 text-xs uppercase px-3 pt-2">Shop By Age</h3>
              <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="p-3 pl-6 hover:bg-slate-50 rounded-md">All Ages</Link>
              <Link href="/products?age=5-7" onClick={() => setMobileMenuOpen(false)} className="p-3 pl-6 hover:bg-slate-50 rounded-md">Ages 5-7</Link>
              <Link href="/products?age=8-10" onClick={() => setMobileMenuOpen(false)} className="p-3 pl-6 hover:bg-slate-50 rounded-md">Ages 8-10</Link>
              
              <hr className="my-2"/>
              <h3 className="font-bold text-slate-400 text-xs uppercase px-3 pt-2">Swago Elements</h3>
              <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="p-3 pl-6 hover:bg-slate-50 rounded-md">All Elements</Link>
              <Link href="/products?elements=S" onClick={() => setMobileMenuOpen(false)} className="p-3 pl-6 hover:bg-slate-50 rounded-md">Smart Tech</Link>
              <Link href="/products?elements=W" onClick={() => setMobileMenuOpen(false)} className="p-3 pl-6 hover:bg-slate-50 rounded-md">Willpower</Link>
              <Link href="/products?elements=A" onClick={() => setMobileMenuOpen(false)} className="p-3 pl-6 hover:bg-slate-50 rounded-md">Ambition</Link>
              <Link href="/products?elements=G" onClick={() => setMobileMenuOpen(false)} className="p-3 pl-6 hover:bg-slate-50 rounded-md">Growth</Link>
              <Link href="/products?elements=O" onClick={() => setMobileMenuOpen(false)} className="p-3 pl-6 hover:bg-slate-50 rounded-md">Optimization</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
