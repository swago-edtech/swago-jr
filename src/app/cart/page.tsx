"use client";

import React from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { cart, increaseQty, decreaseQty, removeFromCart, clearCart, total } = useCart();
  const router = useRouter();

  if (cart.length === 0) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <a href="/products" className="text-blue-500 underline">
          Shop Now
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>

      <ul className="space-y-4">
        {cart.map((item) => (
          <li
            key={item.id}
            className="flex justify-between items-center border-b pb-2"
          >
            <div>
              <h2 className="font-semibold">{item.name}</h2>
              <p className="text-sm text-gray-600">
                Qty: {item.quantity} × ₹{item.price}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => decreaseQty(item.id)}
                className="px-2 py-1 border rounded"
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => increaseQty(item.id)}
                className="px-2 py-1 border rounded"
              >
                +
              </button>

              <button
                onClick={() => removeFromCart(item.id)}
                className="ml-4 text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex justify-between font-bold text-lg">
        <span>Total:</span>
        <span>₹{total}</span>
      </div>

      <div className="mt-6 space-y-2">
        <button
          onClick={() => router.push("/checkout")}
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
        >
          Proceed to Checkout
        </button>

        <button
          onClick={() => clearCart()}
          className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
        >
          Clear Cart
        </button>
      </div>
    </div>
  );
}
