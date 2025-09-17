"use client";

import Link from "next/link";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { cart } = useCart();

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="w-full bg-blue-500 text-white p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        Swago Junior
      </Link>
      <div className="space-x-4 flex items-center">
        <Link href="/products">Products</Link>
        <Link href="/checkout">
          Checkout {itemCount > 0 && <span>({itemCount})</span>}
        </Link>
        <Link href="/login">Login</Link>
      </div>
    </nav>
  );
}
