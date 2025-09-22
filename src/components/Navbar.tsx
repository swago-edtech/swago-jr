"use client";

import Link from "next/link";
import { useSharedContext } from "@/context/SharedContext";

export default function Navbar() {
  const { user, cart } = useSharedContext();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
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
            {/* New: My Orders button */}
            <Link href="/orders" className="hover:text-gray-200">
              My Orders
            </Link>
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