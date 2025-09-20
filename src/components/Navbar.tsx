"use client";

import Link from "next/link";
import { useSharedContext } from "@/context/SharedContext"; // Updated import

export default function Navbar() {
  // Get user and cart state directly from the central context
  const { user, cart } = useSharedContext();

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    // A full refresh on logout is okay to ensure all state is cleared.
    window.location.href = "/";
  };

  return (
    <nav className="w-full bg-blue-500 text-white p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        Swago Junior
      </Link>
      <div className="space-x-6 flex items-center">
        <Link href="/products" className="hover:text-gray-200">Products</Link>
        <Link href="/cart" className="hover:text-gray-200">
          Cart {itemCount > 0 && <span className="font-semibold">({itemCount})</span>}
        </Link>
        {user ? (
          <>
            <span className="text-sm">Hi, {user.phone}</span>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md transition-colors">
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md transition-colors">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}