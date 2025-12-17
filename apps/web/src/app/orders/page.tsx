"use client";

import { useEffect, useState } from "react";
import { useSharedContext } from "@/context/SharedContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ReviewForm from "@/components/ReviewForm";
import { products } from "@swago/utils";
import { useFormattedDate } from "@/hooks/useFormattedDate"; // ✨ NEW

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingOrder, setReviewingOrder] = useState<string | null>(null);
  const [reviewingProduct, setReviewingProduct] = useState<{ name: string; id: number } | null>(null);

  useEffect(() => {
    // Fetch orders from dedicated endpoint
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/orders');
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
        } else {
          console.error('Failed to fetch orders');
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const getProductIdByName = (productName: string): number | null => {
    const product = products.find((p) => p.name === productName);
    return product ? product.id : null;
  };

  const handleWriteReview = (orderId: string, productName: string) => {
    const productId = getProductIdByName(productName);
    if (productId) {
      setReviewingOrder(orderId);
      setReviewingProduct({ name: productName, id: productId });
    }
  };

  const handleReviewSuccess = () => {
    setReviewingOrder(null);
    setReviewingProduct(null);
  };

  const handleCancelReview = () => {
    setReviewingOrder(null);
    setReviewingProduct(null);
  };

  if (loading) {
    return <p className="text-center p-12">Loading orders...</p>;
  }

  if (!user || orders.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold">You haven&apos;t placed any orders yet.</h2>
        <Link href="/products" className="text-blue-600 hover:underline mt-2">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      {/* Review Form Modal */}
      <AnimatePresence>
        {reviewingOrder && reviewingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleCancelReview}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Review: {reviewingProduct.name}</h2>
                <button
                  onClick={handleCancelReview}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <ReviewForm
                  productId={reviewingProduct.id}
                  orderId={reviewingOrder}
                  onSuccess={handleReviewSuccess}
                  onCancel={handleCancelReview}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders List */}
      <div className="space-y-6">
        {orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            onWriteReview={handleWriteReview}
          />
        ))}
      </div>
    </div>
  );
}

// ✨ NEW: Separate OrderCard component for cleaner code
function OrderCard({ 
  order, 
  onWriteReview 
}: { 
  order: Order; 
  onWriteReview: (orderId: string, productName: string) => void;
}) {
  const isDelivered = order.status.toLowerCase().includes("deliver");
  // ✨ NEW: Use hook for date formatting
  const orderDate = useFormattedDate(order.createdAt, 'clean');

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-slate-500">Order ID: {order._id}</p>
          {/* ✨ UPDATED: Now shows IST time */}
          <p className="text-sm text-slate-500">
            Date: {orderDate}
          </p>
        </div>
        <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
          {order.status}
        </span>
      </div>
      <hr className="my-4" />

      {/* Items List */}
      <ul className="space-y-4">
        {order.items?.map((item, idx) => (
          <li key={idx} className="border-l-4 border-purple-200 pl-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">Quantity: {item.quantity}</p>
              </div>
              <p className="font-semibold text-slate-900">₹{item.price.toFixed(2)}</p>
            </div>

            {/* Write Review Button - Only shown for delivered orders */}
            {isDelivered && (
              <div className="mt-2">
                <button
                  onClick={() => onWriteReview(order._id, item.name)}
                  className="inline-flex items-center gap-2 text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Write Review
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Order Total */}
      <div className="mt-4 pt-4 border-t flex justify-between items-center">
        <span className="font-semibold">Order Total:</span>
        <span className="text-xl font-bold">
          ₹{order.items.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}
        </span>
      </div>
    </div>
  );
}
