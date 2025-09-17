"use client";

import { useCart } from "../../context/CartContext";

export default function CheckoutPage() {
  const { cart, removeFromCart, clearCart } = useCart();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cart.length === 0) {
    return <p className="text-center mt-10 text-lg">Your cart is empty 🛒</p>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <ul className="space-y-4">
        {cart.map((item) => (
          <li key={item.id} className="flex justify-between items-center border-b pb-2">
            <div>
              <h2 className="font-semibold">{item.name}</h2>
              <p className="text-sm text-gray-600">
                Qty: {item.quantity} × ₹{item.price}
              </p>
            </div>
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-red-500 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex justify-between font-bold text-lg">
        <span>Total:</span>
        <span>₹{total}</span>
      </div>
      <button
        onClick={clearCart}
        className="mt-6 w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
      >
        Place Order
      </button>
    </div>
  );
}
