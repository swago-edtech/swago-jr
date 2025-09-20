"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext"; // Assuming this path is correct

export default function Navbar() {
  // State for user authentication (from the new logic)
  const [user, setUser] = useState<any>(null);

  // Cart context integration (from the old logic)
  const { cart } = useCart();

  // Calculate total items in the cart (from the old logic)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Effect to check user session on component mount (from the new logic)
  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (data.loggedIn) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error("Failed to check user status:", error);
      }
    }
    checkUser();
  }, []);

  // Logout handler (from the new logic)
  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/"; // Refresh to clear all state
  };

  return (
    <nav className="w-full bg-blue-500 text-white p-4 flex justify-between items-center">
      {/* --- Left Side: Brand Name --- */}
      <Link href="/" className="text-xl font-bold">
        Swago Junior
      </Link>

      {/* --- Right Side: Navigation & User Status --- */}
      <div className="space-x-6 flex items-center">
        <Link href="/products" className="hover:text-gray-200">
          Products
        </Link>
        <Link href="/cart" className="hover:text-gray-200">
          Cart {itemCount > 0 && <span className="font-semibold">({itemCount})</span>}
        </Link>

        {/* --- Merged Conditional UI for Login/Logout --- */}
        {user ? (
          <>
            <span className="text-sm">Hi, {user.phone}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md transition-colors"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}