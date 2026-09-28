// packages/database/src/models/Order.ts

import mongoose from "mongoose";

const CouponDetailsSchema = new mongoose.Schema({
  code: String,
  description: String,
  type: String,
  value: Number,
}, { _id: false });

const OrderSchema = new mongoose.Schema(
  {
    // ✅ NEW: Custom readable order ID (SW-YYMMDD-XXXX format)
    orderId: {
      type: String,
      unique: true,
      sparse: true,  // Allows existing orders without orderId
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    // ✅ UPDATED: Full lifecycle status enum
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Failed', 'Abandoned', 'RTO', 'Returned', 'Refunded'],
      default: "Pending"
    },
    // ✅ NEW: Payment method for COD support
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod'],
      default: 'razorpay'
    },
    // ✅ NEW: Payment tracking
    paymentAttempts: { type: Number, default: 0 },
    lastPaymentAttempt: { type: Date },
    stockReservedAt: { type: Date },
    inventoryAllocationStatus: {
      type: String,
      enum: ["none", "allocated", "consumed", "released", "restored"],
      default: "none",
    },
    inventorySnapshot: [
      {
        inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem" },
        inventoryItemName: String,
        quantity: { type: Number, min: 0 },
      },
    ],
    items: [
      {
        productId: { type: mongoose.Schema.Types.Mixed, required: true }, // ✅ CHANGED: Now accepts both Number and String
        name: String,
        price: Number,
        quantity: Number,
        image: String,
        // International orders only: unit price in the order's local currency (as charged)
        localPrice: { type: Number, required: false },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    razorpay_payment_id: {
      type: String,
      // ❌ REMOVED: unique: true,
      // ❌ REMOVED: sparse: true
    },
    razorpay_order_id: { type: String },
    couponCode: { type: String },
    couponDetails: {
      type: CouponDetailsSchema,
      required: false
    },
    createdVia: {
      type: String,
      enum: ['webhook', 'frontend', 'express'],
      default: 'webhook'
    },
    webhookProcessed: { type: Boolean, default: false },
    webhookReceivedAt: { type: Date },
    // ✅ NEW: Swago Money Tracking
    swagoMoneyRedeemed: {
      type: Number,
      default: 0
    },
    swagoMoneyKidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },
    // ✅ Where did you hear about us?
    referralSource: {
      type: String,
      required: false
    },
    // ✅ NEW: UTM Tracking for Performance Marketing
    utm_source: { type: String },
    utm_medium: { type: String },
    utm_campaign: { type: String },
    // ✅ NEW: Refund & COD Collection Tracking (Analytics Phase 1)
    refundAmount: { type: Number, default: 0 },
    codCollected: { type: Boolean, default: false },
    codCollectedAt: { type: Date },
    // ✅ NEW: GST Tracking
    taxCollected: { type: Number, default: 0 },
    // ✅ NEW: Invoice Tracking
    invoiceUrl: { type: String, required: false },
    // International order tracking
    country: { type: String, default: "IN", uppercase: true },
    currency: { type: String, default: "INR", uppercase: true },
    // International orders only: display symbol of `currency` at checkout time
    currencySymbol: { type: String, required: false },
    displayTotal: { type: Number },
    exchangeRateUsed: { type: Number, default: 1 },
    internationalShippingFee: { type: Number, default: 0 },
    // Local-currency shipping + per-line source (product fixed fee vs config rules)
    internationalShippingBreakdown: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

// ❌ REMOVED: All .index() calls
// Indexes are now created manually via migration scripts

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
