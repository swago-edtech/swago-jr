"use client";

import { useEffect, useState } from "react";
import { useSharedContext } from "@/context/SharedContext";
import Link from "next/link";

// Define a clear type for the Order object
type OrderItem = {
    name: string;
    quantity: number;
    price: number;
};
type Order = {
    _id: string;
    status: string;
    createdAt: string;
    items: OrderItem[];
};

export default function OrdersPage() {
  const { user } = useSharedContext();
  const [orders, setOrders] = useState<Order[]>([]); // Use the defined Order type
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.orders) {
        setOrders(user.orders as Order[]); // Cast user.orders to the Order[] type
    }
    setLoading(false);
  }, [user]);

  if (loading) {
    return <p className="text-center p-12">Loading orders...</p>;
  }

  if (!user || orders.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold">You haven&apos;t placed any orders yet.</h2>
        <Link href="/products" className="text-blue-600 hover:underline mt-2">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order._id} className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Order ID: {order._id}</p>
                <p className="text-sm text-slate-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{order.status}</span>
            </div>
            <hr className="my-4"/>
            <ul className="space-y-2">
              {order.items?.map((item, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>{item.name} (x{item.quantity})</span>
                  <span>₹{item.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}