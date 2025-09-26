"use client";

import React from "react";
import { useSharedContext } from "@/context/SharedContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CartPage() {
  const { cart, increaseQty, decreaseQty, removeFromCart, total } = useSharedContext();
  const router = useRouter();

  if (cart.length === 0) {
    return (
      <div className="text-center py-20">
        <CartIconLarge />
        <h2 className="text-2xl font-bold mt-4">Your cart is empty</h2>
        <p className="text-slate-500 mt-2">Looks like you haven't added anything to your cart yet.</p>
        <Link 
          href="/products" 
          className="mt-6 inline-block bg-[hsl(var(--swago-purple))] text-white font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4 bg-white p-4 rounded-xl border shadow-sm">
                
                {/* This is the corrected line. It safely checks for the new 'images' array,
                    falls back to the old 'image' property, and then to a placeholder. */}
                <img 
                  src={item.images?.[0] || (item as any).image || '/images/placeholder.png'} 
                  alt={item.name} 
                  className="w-24 h-24 object-cover rounded-md" 
                />

                <div className="flex-grow flex flex-col">
                  <h2 className="font-semibold text-lg">{item.name}</h2>
                  <p className="text-slate-500">Price: ₹{item.price.toFixed(2)}</p>
                  <div className="flex-grow"></div>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => decreaseQty(item.id)} className="px-2 py-1 border rounded-md hover:bg-slate-100">-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => increaseQty(item.id)} className="px-2 py-1 border rounded-md hover:bg-slate-100">+</button>
                  </div>
                </div>
                <div className="flex flex-col justify-between items-end">
                  <p className="font-bold text-lg">₹{(item.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-sm text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-slate-50 p-6 rounded-xl border sticky top-24">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold">Free</span>
              </div>
            </div>
            <hr className="my-4"/>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <button
              onClick={() => router.push("/checkout")}
              className="mt-6 w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// SVG Icon for the empty cart page
const CartIconLarge = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24 mx-auto text-slate-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c.51 0 .962-.344 1.087-.835l1.858-6.491A1.125 1.125 0 0 0 18 5.25H4.236a1.125 1.125 0 0 0-1.087.835L2.25 3Z" />
    </svg>
);