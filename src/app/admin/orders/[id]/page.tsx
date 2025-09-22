"use client";

import { use, useEffect, useState } from "react"; // 1. Import 'use' from React
import Link from "next/link";

// Types remain the same
type OrderItem = {
  name: string;
  price: number;
  quantity: number;
};
type Order = {
  _id: string;
  name: string;
  phone: string;
  address: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

// 2. The 'params' prop is now typed as a Promise
export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // 3. We 'unwrap' the promise using the use() hook to get the id
  const { id } = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Use the unwrapped 'id' here
        const res = await fetch(`/api/admin/orders/${id}`);
        if (!res.ok) throw new Error("Failed to fetch order details.");
        const data = await res.json();
        setOrder(data);
        setNewStatus(data.status);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [id]); // The dependency is now the unwrapped 'id'

  const handleStatusUpdate = async () => {
    setUpdateMessage("");
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status.");
      const updatedOrder = await res.json();
      setOrder(updatedOrder);
      setUpdateMessage("Status updated successfully!");
    } catch (err: any) {
      setUpdateMessage(`Error: ${err.message}`);
    }
  };

  if (loading) return <p>Loading order details...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!order) return <p>Order not found.</p>;

  const orderTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div>
      <Link href="/admin/orders" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to All Orders</Link>
      <h1 className="text-2xl font-bold mb-6">Order Details</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-4 rounded-lg shadow">
          <h2 className="font-bold text-lg mb-2">Customer Info</h2>
          <p><strong>Name:</strong> {order.name}</p>
          <p><strong>Phone:</strong> {order.phone}</p>
          <p><strong>Address:</strong> {order.address}</p>
          <hr className="my-4" />
          <h2 className="font-bold text-lg mb-2">Order Summary</h2>
          <p><strong>Order ID:</strong> {order._id}</p>
          <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Current Status:</strong> <span className="font-semibold">{order.status}</span></p>
          <p><strong>Order Total:</strong> <span className="font-bold">₹{orderTotal.toFixed(2)}</span></p>
        </div>

        <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
          <h2 className="font-bold text-lg mb-2">Items Purchased</h2>
          <ul className="list-disc list-inside">
            {order.items.map((item, index) => (
              <li key={index}>
                {item.name} (x{item.quantity}) - ₹{(item.price * item.quantity).toFixed(2)}
              </li>
            ))}
          </ul>
          <hr className="my-4" />
          <h2 className="font-bold text-lg mb-2">Update Status</h2>
          <div className="flex items-center gap-4">
            <label htmlFor="status-select" className="font-semibold">
              New Status:
            </label>
            <select
              id="status-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="border rounded p-2"
            >
              <option value="Pending">Pending</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button
              onClick={handleStatusUpdate}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Update Status
            </button>
          </div>
          {updateMessage && <p className="mt-4 text-sm">{updateMessage}</p>}
        </div>
      </div>
    </div>
  );
}