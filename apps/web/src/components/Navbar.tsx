// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useSharedContext } from "@/context/SharedContext";
import { useState, useEffect, useRef } from "react";
import Logo from "./Logo";
import { motion, AnimatePresence, Variants } from "framer-motion";

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15, ease: "easeIn" } }
};

export default function Navbar() {
  const { user, cart, wishlist, selectedKid, openCartSidebar } = useSharedContext(); // ✅ UPDATED: Added openCartSidebar
  
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
      <Logo />
      
      <div className="flex items-center gap-6">
        {/* --- Desktop Navigation --- */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <motion.div whileHover={{ y: -2 }}>
            <Link href="/about" className="transition-colors hover:text-[hsl(var(--swago-purple))]">About Us</Link>
          </motion.div>

          
          
          <motion.div className="relative" ref={ageDropdownRef} whileHover={{ y: -2 }}>
            <button onClick={() => setAgeDropdownOpen(!isAgeDropdownOpen)} className="transition-colors hover:text-[hsl(var(--swago-purple))] flex items-center gap-1">
              Shop by Age <DropdownArrow />
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
              Swago Elements <DropdownArrow />
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

        {/* --- Right side Icons --- */}
        <div className="flex items-center gap-4">
          {/* Kids Zone Button */}
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
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 py-2 rounded-full text-sm shadow-md hidden md:flex items-center gap-2"
              >
                <span>🎮</span>
                <span>Kids Zone</span>
              </Link>
            )}
          </motion.div>

          {/* ✅ UPDATED: Cart Button now opens sidebar instead of navigating */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button 
              onClick={openCartSidebar}
              className="flex items-center gap-2 text-white font-bold bg-[hsl(var(--swago-pink))] px-4 py-2 rounded-full text-sm shadow-md"
            >
              <CartIcon />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && <span className="bg-white text-[hsl(var(--swago-pink))] rounded-full px-2 text-xs">{itemCount}</span>}
            </button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden md:block">
            <Link href="/wishlist" className="flex items-center gap-2 text-white font-bold bg-[hsl(var(--swago-pink))] px-4 py-2 rounded-full text-sm shadow-md">
              <WishlistIcon />
              <span className="hidden sm:inline">Wishlist</span>
              {wishlist.length > 0 && <span className="bg-white text-[hsl(var(--swago-pink))] rounded-full px-2 text-xs">{wishlist.length}</span>}
            </Link>
          </motion.div>
          <div className="relative" ref={userMenuRef}>
            {user ? (
              <>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" aria-label="Open user menu" onClick={() => setUserMenuOpen(!isUserMenuOpen)} className="flex items-center p-1 rounded-full">
                  <UserIcon />
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
                  <UserIcon />
                </Link>
              </motion.div>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} aria-label="Open main menu">
              <HamburgerIcon />
            </button>
          </div>
        </div>
      </div>

      {/* --- Mobile Menu --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg z-20 border-t border-slate-200"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex flex-col p-4 space-y-2">
              <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded-md">About Us</Link>
              
              {/* Kids Zone Mobile Link */}
              <Link 
                href="/kids" 
                onClick={() => setMobileMenuOpen(false)} 
                className="p-2 hover:bg-slate-50 rounded-md flex items-center gap-2 font-bold text-purple-600"
              >
                <span>🎮</span> Kids Zone
              </Link>
              
              <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded-md">Wishlist ({wishlist.length})</Link>
              {user && <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded-md">My Profile</Link>}
              {user && <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded-md">My Orders</Link>}
              <hr/>
              <h3 className="font-bold text-slate-400 text-xs uppercase px-2 pt-2">Shop By Age</h3>
              <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="p-2 pl-4 hover:bg-slate-50 rounded-md">All Ages</Link>
              <Link href="/products?age=5-7" onClick={() => setMobileMenuOpen(false)} className="p-2 pl-4 hover:bg-slate-50 rounded-md">Ages 5-7</Link>
              <Link href="/products?age=8-10" onClick={() => setMobileMenuOpen(false)} className="p-2 pl-4 hover:bg-slate-50 rounded-md">Ages 8-10</Link>
              <hr/>
              <h3 className="font-bold text-slate-400 text-xs uppercase px-2 pt-2">Swago Elements</h3>
              <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="p-2 pl-4 hover:bg-slate-50 rounded-md">All Elements</Link>
              <Link href="/products?elements=S" onClick={() => setMobileMenuOpen(false)} className="p-2 pl-4 hover:bg-slate-50 rounded-md">Smart Tech</Link>
              <Link href="/products?elements=W" onClick={() => setMobileMenuOpen(false)} className="p-2 pl-4 hover:bg-slate-50 rounded-md">Willpower</Link>
              <Link href="/products?elements=A" onClick={() => setMobileMenuOpen(false)} className="p-2 pl-4 hover:bg-slate-50 rounded-md">Ambition</Link>
              <Link href="/products?elements=G" onClick={() => setMobileMenuOpen(false)} className="p-2 pl-4 hover:bg-slate-50 rounded-md">Growth</Link>
              <Link href="/products?elements=O" onClick={() => setMobileMenuOpen(false)} className="p-2 pl-4 hover:bg-slate-50 rounded-md">Optimization</Link>
              {user && <hr/>}
              {user && <button onClick={handleLogout} className="w-full text-left p-3 text-red-600 font-bold hover:bg-red-50 rounded-md">Logout</button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// --- SVG Icon Components ---
const DropdownArrow = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>;
const CartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" className="w-5 h-5"><path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 4 0h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 11.5 3H2.52l-.21-1.054A.5.5 0 0 0 2 1.5H.5zM6 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM9 5.5V7h1.5a.5.5 0 0 1 0 1H9v1.5a.5.5 0 0 1-1 0V8H6.5a.5.5 0 0 1 0-1H8V5.5a.5.5 0 0 1 1 0z"/></svg>;
const WishlistIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-slate-500"><path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" /></svg>;
const HamburgerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
