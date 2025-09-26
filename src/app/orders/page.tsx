"use client";

import { useEffect, useState } from "react";
import Link from "next/link"; // The missing import is added here
import { useSharedContext } from "@/context/SharedContext";

type Order = {
  _id: string;
  status: string;
  createdAt: string;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
};

export default function OrdersPage() {
  const { user } = useSharedContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // The user object from context already has the orders populated
      setOrders(user.orders.reverse()); // reverse() to show newest first
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <p className="text-center p-10">Loading your orders...</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <h2 className="text-xl font-bold">You haven't placed any orders yet.</h2>
          <Link href="/products" className="text-blue-600 hover:underline mt-2 inline-block">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const orderTotal = order.items.reduce((sum: number, item) => sum + item.price * item.quantity, 0);
            return (
              <div key={order._id} className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-slate-500">ORDER #{order._id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm text-slate-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{order.status}</span>
                </div>
                <hr className="my-4"/>
                <ul className="space-y-2">
                  {order.items?.map((item: any, idx: number) => (
                    <li key={idx} className="flex justify-between text-slate-700">
                      <span>{item.name} (x{item.quantity})</span>
                      <span>₹{item.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <hr className="my-4"/>
                <div className="text-right font-bold">
                  <span className="text-slate-600">Total: </span>
                  <span>₹{orderTotal.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}