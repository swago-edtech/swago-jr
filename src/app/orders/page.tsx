"use client";

import { useEffect, useState } from "react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await fetch("/api/me");
      const data = await res.json();

      if (data.user && data.user.orders) {
        setOrders(data.user.orders);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  if (loading) {
    return <p className="text-center mt-10">Loading orders...</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-xl font-bold">No orders found</h2>
        <a href="/products" className="text-blue-500 underline">
          Shop Now
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>
      <ul className="space-y-4">
        {orders.map((order) => (
          <li
            key={order._id}
            className="p-4 border rounded-lg shadow-sm bg-white"
          >
            <p>
              <strong>Order ID:</strong> {order._id}
            </p>
            <p>
              <strong>Status:</strong> {order.status}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(order.createdAt).toLocaleString()}
            </p>
            <ul className="mt-2 ml-4 list-disc">
              {/* This line is now safer and won't crash */}
              {order.items?.map((item: any, idx: number) => (
                <li key={idx}>
                  {item.name} — {item.quantity} × ₹{item.price}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}