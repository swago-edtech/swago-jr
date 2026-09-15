"use client";

import { useEffect, useState } from "react";
import { useSharedContext } from "@/context/SharedContext";
import { useCountry } from "@/context/CountryContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ReviewForm from "@/components/ReviewForm";
import { useFormattedDate } from "@/hooks/useFormattedDate";
import { RazorpayOptions, RazorpaySuccessResponse as RazorpayResponse, RazorpayInstance } from "@swago/types";
import Image from "next/image";



type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  productId: number | string;
  image?: string;
};

type Order = {
  _id: string;
  orderId?: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  total?: number;
  razorpay_order_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  paymentMethod?: 'razorpay' | 'cod';  // ✅ Payment method
  invoiceUrl?: string; // ✅ Invoice link
};

// ✅ Payment window expiry time in minutes
const PAYMENT_EXPIRY_MINUTES = 10;

// ✅ Check if order can still be paid (only for Razorpay orders)
function canRetryPayment(order: Order): { canPay: boolean; reason: string; minutesLeft: number } {
  const status = order.status?.toLowerCase();

  // ✅ COD orders don't need online payment retry
  if (order.paymentMethod === 'cod') {
    return { canPay: false, reason: 'Cash on Delivery', minutesLeft: 0 };
  }

  // Only Pending or Failed orders can be retried
  if (status !== 'pending' && status !== 'failed') {
    return { canPay: false, reason: 'Order already processed', minutesLeft: 0 };
  }

  // Check expiry
  const createdAt = new Date(order.createdAt).getTime();
  const now = Date.now();
  const expiryTime = createdAt + (PAYMENT_EXPIRY_MINUTES * 60 * 1000);
  const minutesLeft = Math.max(0, Math.ceil((expiryTime - now) / 60000));

  if (now > expiryTime) {
    return { canPay: false, reason: 'Payment window expired', minutesLeft: 0 };
  }

  return { canPay: true, reason: '', minutesLeft };
}

function getOrderTotal(order: Order): number {
  return order.total ?? order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getOrderStats(orders: Order[]) {
  let paid = 0;
  let cod = 0;
  let pending = 0;
  for (const o of orders) {
    const s = o.status?.toLowerCase() || "";
    if (o.paymentMethod === "cod") cod++;
    if (s === "paid" || s === "delivered" || s === "shipped") paid++;
    if (s === "pending" || s === "failed") pending++;
  }
  return { paid, cod, pending };
}

export default function OrdersPage() {
  const { user } = useSharedContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState("");
  const [reviewingProduct, setReviewingProduct] = useState<{ id: string; name: string }>({ id: "", name: "" }); // Changed id to string
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string>("");

  const handleWriteReview = (orderId: string, productName: string, productId: string) => {
    setReviewingOrder(orderId);
    setReviewingProduct({ id: productId, name: productName });
    setShowReviewModal(true);
  };

  useEffect(() => {
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

  // ✅ Refresh orders periodically to update expiry countdown
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update countdown
      setOrders(prev => [...prev]);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleReviewSuccess = () => {
    setShowReviewModal(false);
    setReviewingOrder("");
    setReviewingProduct({ id: "", name: "" });
  };

  const handleCancelReview = () => {
    setShowReviewModal(false);
    setReviewingOrder("");
    setReviewingProduct({ id: "", name: "" });
  };

  // ✅ Handle retry payment
  const handleRetryPayment = async (order: Order) => {
    if (!order.razorpay_order_id) {
      setPaymentMessage("Cannot retry: Missing payment order ID");
      return;
    }

    setPayingOrderId(order._id);
    setPaymentMessage("Opening payment...");

    try {
      // Get Razorpay config
      const configRes = await fetch("/api/razorpay/config");
      if (!configRes.ok) {
        setPaymentMessage("Failed to load payment configuration");
        setPayingOrderId(null);
        return;
      }
      const config = await configRes.json();

      const orderTotal = order.total || order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const options: RazorpayOptions = {
        key: config.keyId,
        amount: Math.round(orderTotal * 100),
        currency: "INR",
        name: "Swago",
        description: `Payment for Order ${order.orderId || order._id.slice(-6)}`,
        order_id: order.razorpay_order_id,
        handler: async function (response) {
          setPaymentMessage("Verifying payment...");

          const verificationRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order.orderId,
            }),
          });

          if (verificationRes.ok) {
            setPaymentMessage("✅ Payment successful!");
            // Refresh orders
            const refreshRes = await fetch('/api/orders');
            if (refreshRes.ok) {
              const data = await refreshRes.json();
              setOrders(data.orders || []);
            }
          } else {
            setPaymentMessage("❌ Payment verification failed");
          }

          setTimeout(() => {
            setPayingOrderId(null);
            setPaymentMessage("");
          }, 3000);
        },
        prefill: {
          name: order.name || "",
          email: order.email || "",
          contact: order.phone || "",
        },
        notes: {
          orderId: order.orderId || order._id,
        },
        theme: {
          color: "#3b82f6",
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const RazorpayConstructor = (window as any).Razorpay as new (options: RazorpayOptions) => RazorpayInstance;
      const paymentObject = new RazorpayConstructor(options);

      paymentObject.on("payment.failed", function (response) {
        setPaymentMessage(`❌ Payment failed: ${response.error.description}`);
        setTimeout(() => {
          setPayingOrderId(null);
          setPaymentMessage("");
        }, 3000);
      });

      paymentObject.open();
    } catch (error) {
      console.error("Retry payment error:", error);
      setPaymentMessage("❌ An error occurred");
      setPayingOrderId(null);
    }
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
    <div className="px-4 py-8 lg:bg-slate-50 lg:px-6 lg:py-10 xl:px-10">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="lg:grid lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)] lg:gap-8 xl:gap-10 lg:items-start">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:sticky lg:top-28 space-y-5">
            <div>
              <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-slate-900">
                My Orders
              </h1>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Track deliveries, download invoices, and manage your purchases.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Total orders</span>
                <span className="text-3xl font-bold text-slate-900 tabular-nums">{orders.length}</span>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="grid grid-cols-3 gap-2 text-center">
                {(() => {
                  const stats = getOrderStats(orders);
                  return (
                    <>
                      <div className="rounded-xl bg-green-50 px-2 py-3">
                        <p className="text-lg font-bold text-green-700 tabular-nums">{stats.paid}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600/80 mt-0.5">Paid</p>
                      </div>
                      <div className="rounded-xl bg-purple-50 px-2 py-3">
                        <p className="text-lg font-bold text-purple-700 tabular-nums">{stats.cod}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-600/80 mt-0.5">COD</p>
                      </div>
                      <div className="rounded-xl bg-amber-50 px-2 py-3">
                        <p className="text-lg font-bold text-amber-700 tabular-nums">{stats.pending}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600/80 mt-0.5">Pending</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <Link
              href="/products"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-[hsl(var(--swago-purple))] text-white text-sm font-semibold px-5 py-3 hover:opacity-90 transition-opacity shadow-md shadow-purple-200/50"
            >
              Continue Shopping
            </Link>
          </aside>

          {/* Main content */}
          <div className="min-w-0">
            <h1 className="text-3xl font-bold mb-6 lg:hidden">My Orders</h1>

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
      <div className="space-y-6 lg:space-y-5">
        {orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            onRetryPayment={handleRetryPayment}
            isProcessing={payingOrderId === order._id}
            paymentMessage={payingOrderId === order._id ? paymentMessage : ""}
            onWriteReview={handleWriteReview}
          />
        ))}
      </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ Status badge with colors - shows COD for pending COD orders
function StatusBadge({ status, paymentMethod }: { status: string; paymentMethod?: string }) {
  const statusLower = status?.toLowerCase() || 'pending';
  const isCOD = paymentMethod === 'cod';

  // ✅ Show COD badge for pending COD orders
  if (isCOD && statusLower === 'pending') {
    return (
      <span className="text-sm font-semibold bg-purple-100 text-purple-800 px-3 py-1 rounded-full lg:px-4 lg:py-1.5 lg:text-xs lg:uppercase lg:tracking-wide">
        COD
      </span>
    );
  }

  const configs: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
    shipped: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Shipped' },
    delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
    failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
    abandoned: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Expired' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
  };

  const config = configs[statusLower] || configs.pending;

  return (
    <span className={`text-sm font-semibold ${config.bg} ${config.text} px-3 py-1 rounded-full lg:px-4 lg:py-1.5 lg:text-xs lg:uppercase lg:tracking-wide`}>
      {config.label}
    </span>
  );
}

// OrderCard component
function OrderCard({
  order,
  onWriteReview,
  onRetryPayment,
  isProcessing,
  paymentMessage,
}: {
  order: Order;
  onWriteReview?: (orderId: string, productName: string, productId: string) => void;
  onRetryPayment: (order: Order) => void;
  isProcessing: boolean;
  paymentMessage: string;
}) {
  const isDelivered = order.status.toLowerCase().includes("deliver");
  const orderDate = useFormattedDate(order.createdAt, 'clean');
  const { canPay, reason, minutesLeft } = canRetryPayment(order);
  const isPendingOrFailed = ['pending', 'failed'].includes(order.status?.toLowerCase() || '');
  const { formatPrice } = useCountry();
  const isCOD = order.paymentMethod === 'cod';
  const orderTotal = getOrderTotal(order);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border lg:p-0 lg:rounded-xl lg:shadow-sm lg:border-slate-200/80 lg:overflow-hidden lg:hover:shadow-md lg:transition-shadow lg:duration-200">
      {/* ── Mobile header (unchanged) ── */}
      <div className="lg:hidden">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-slate-500">
              Order ID: {order.orderId || `#${order._id.slice(-6)}`}
            </p>
            <p className="text-sm text-slate-500">
              Date: {orderDate}
            </p>
          </div>
          <StatusBadge status={order.status} paymentMethod={order.paymentMethod} />
        </div>
      </div>

      {/* ── Desktop header — single compact row ── */}
      <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4 lg:px-6 xl:px-8 lg:py-4 lg:bg-white lg:border-b lg:border-slate-100">
        <div className="flex items-center gap-5 xl:gap-8 min-w-0 flex-1">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Order ID</p>
            <p className="font-mono text-sm xl:text-base font-semibold text-slate-900 truncate">
              {order.orderId || `#${order._id.slice(-6)}`}
            </p>
          </div>
          <div className="hidden md:block h-9 w-px bg-slate-200 shrink-0" />
          <p className="text-sm text-slate-500 shrink-0 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {orderDate}
          </p>
        </div>
        <div className="flex items-center gap-4 xl:gap-6 shrink-0">
          <StatusBadge status={order.status} paymentMethod={order.paymentMethod} />
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total</p>
            <p className="text-lg xl:text-xl font-bold text-slate-900 tabular-nums">₹{orderTotal.toFixed(2)}</p>
          </div>
          {order.invoiceUrl && (
            <a
              href={order.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs xl:text-sm bg-purple-50 text-purple-700 border border-purple-200 px-3 xl:px-4 py-2 rounded-lg hover:bg-purple-100 font-semibold transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Invoice
            </a>
          )}
        </div>
      </div>

      <div className="lg:px-6 xl:px-8 lg:py-4">

      {/* ✅ COD Order Status Section */}
      {isCOD && isPendingOrFailed && (
        <div className="mb-4 p-4 rounded-lg bg-purple-50 border border-purple-200 lg:mb-6 lg:flex lg:items-center lg:gap-4 lg:rounded-xl lg:px-5 lg:py-4">
          <div className="flex items-center gap-3 lg:flex-1">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center lg:w-11 lg:h-11 lg:shrink-0">
              <span className="text-lg font-bold text-purple-700">₹</span>
            </div>
            <div>
              <p className="font-medium text-purple-800 lg:text-base">Cash on Delivery</p>
              <p className="text-sm text-purple-600">Pay ₹{orderTotal.toFixed(0)} when your order arrives</p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Payment Retry Section for Pending/Failed Razorpay orders */}
      {!isCOD && isPendingOrFailed && (
        <div className={`mb-4 p-4 rounded-lg lg:mb-6 lg:rounded-xl lg:px-5 lg:py-4 ${canPay ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
          {canPay ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-yellow-800">
                  ⏳ Payment pending
                </p>
                <p className="text-sm text-yellow-600">
                  {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''} left to complete payment
                </p>
              </div>
              <button
                onClick={() => onRetryPayment(order)}
                disabled={isProcessing}
                className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Pay Now
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-medium text-gray-600">
                ⌛ {reason}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                This order has expired. Please place a new order.
              </p>
            </div>
          )}

          {/* Payment status message */}
          {paymentMessage && (
            <p className="mt-3 text-sm font-medium text-center text-blue-600">
              {paymentMessage}
            </p>
          )}
        </div>
      )}

      <hr className="my-4 lg:hidden" />

      {/* Desktop column headers */}
      <div className="hidden lg:grid lg:grid-cols-[64px_minmax(0,1fr)_72px_110px_120px] lg:gap-x-6 lg:px-1 lg:pb-2 lg:mb-1 lg:text-[10px] lg:font-semibold lg:uppercase lg:tracking-wider lg:text-slate-400 lg:border-b lg:border-slate-100">
        <span className="col-span-2">Product</span>
        <span className="text-center">Qty</span>
        <span className="text-right">Unit</span>
        <span className="text-right">Subtotal</span>
      </div>

      {/* Items List */}
      <ul className="space-y-4 lg:space-y-0">
        {order.items?.map((item, idx) => (
          <li key={idx} className="lg:border-b lg:border-slate-50 lg:last:border-0">
            {/* Mobile item layout — unchanged */}
            <div className="lg:hidden border-l-4 border-purple-200 pl-4">
              <div className="flex items-start mb-3 gap-3 sm:gap-4">
                {item.image ? (
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                    <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 leading-snug line-clamp-2 pr-2 text-sm sm:text-base">{item.name}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">Qty: {item.quantity}</p>
                    <p className="font-bold text-slate-900 text-sm sm:text-base">₹{item.price.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {isDelivered && onWriteReview && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => onWriteReview(order._id, item.name, String(item.productId))}
                    className="inline-flex items-center gap-2 text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Write Review
                  </button>

                  <button
                    onClick={() => alert('Return product feature coming soon!')}
                    className="inline-flex items-center gap-2 text-sm bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Return Product
                  </button>

                  <button
                    onClick={() => alert('Replace product feature coming soon!')}
                    className="inline-flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Replace Product
                  </button>
                </div>
              )}
            </div>

            {/* Desktop item layout */}
            <div className="hidden lg:grid lg:grid-cols-[64px_minmax(0,1fr)_72px_110px_120px] lg:gap-x-6 lg:items-center lg:py-3.5 lg:px-1 lg:group lg:hover:bg-slate-50/70 lg:rounded-lg lg:transition-colors">
              {item.image ? (
                <div className="relative w-16 h-16 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                  <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-slate-900 leading-snug">{item.name}</p>
                {isDelivered && onWriteReview && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onWriteReview(order._id, item.name, String(item.productId))}
                      className="inline-flex items-center gap-1 text-xs bg-purple-600 text-white px-2.5 py-1 rounded-md hover:bg-purple-700 font-medium transition-colors"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => alert('Return product feature coming soon!')}
                      className="inline-flex items-center text-xs bg-white text-orange-600 border border-orange-200 px-2.5 py-1 rounded-md hover:bg-orange-50 font-medium transition-colors"
                    >
                      Return
                    </button>
                    <button
                      onClick={() => alert('Replace product feature coming soon!')}
                      className="inline-flex items-center text-xs bg-white text-blue-600 border border-blue-200 px-2.5 py-1 rounded-md hover:bg-blue-50 font-medium transition-colors"
                    >
                      Replace
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-slate-600 text-center tabular-nums">{item.quantity}</p>
              <p className="text-sm text-slate-500 text-right tabular-nums">₹{item.price.toFixed(2)}</p>
              <p className="font-semibold text-slate-900 text-right tabular-nums">₹{(item.price * item.quantity).toFixed(2)}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* Order Total & Global Actions — mobile unchanged */}
      <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 lg:hidden">
        {order.invoiceUrl ? (
          <a
            href={order.invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm bg-purple-50 text-purple-700 border border-purple-200 px-4 py-2 rounded-lg hover:bg-purple-100 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Invoice
          </a>
        ) : (
          <div className="w-4 h-4 hidden sm:block" />
        )}
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="font-semibold text-slate-600">Order Total:</span>
          <span className="text-xl font-bold text-slate-900">
{formatPrice(orderTotal)}
          </span>
        </div>
      </div>
      </div>
    </div>
  );
}
