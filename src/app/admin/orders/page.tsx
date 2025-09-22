"use client";

import { useEffect, useState } from "react";
import Link from "next/link"; // Import the Link component

// We define a type for our Order object for better code quality
type Order = {
  _id: string;
  name: string;
  phone: string;
  address: string;
  status: string;
  createdAt: string;
  items: {
    price: number;
    quantity: number;
  }[];
};

export default function AdminOrdersPage() {
  // State for storing the list of orders, loading status, and any errors
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // This effect runs once when the component mounts to fetch the orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/admin/orders");
        if (!res.ok) {
          throw new Error("You do not have permission to view this page or the server failed.");
        }
        const data = await res.json();
        setOrders(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []); // The empty array ensures this runs only once

  if (loading) return <p>Loading all orders...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>

      {orders.length === 0 ? (
        <p>No orders have been placed yet.</p>
      ) : (
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
              <tr>
                <th scope="col" className="py-3 px-6">Order ID</th>
                <th scope="col" className="py-3 px-6">Customer Name</th>
                <th scope="col" className="py-3 px-6">Date</th>
                <th scope="col" className="py-3 px-6">Status</th>
                <th scope="col" className="py-3 px-6">Order Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const orderTotal = order.items.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                );

                return (
                  <tr key={order._id} className="bg-white border-b hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap">
                      {/* Updated: Make the ID a link to the details page */}
                      <Link href={`/admin/orders/${order._id}`} className="text-blue-600 hover:underline">
                        {order._id}
                      </Link>
                    </td>
                    <td className="py-4 px-6">{order.name}</td>
                    <td className="py-4 px-6">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6">{order.status}</td>
                    <td className="py-4 px-6">₹{orderTotal.toFixed(2)}</td>
                  </tr>
                );

              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}