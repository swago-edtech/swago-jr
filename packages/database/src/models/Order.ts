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
    // Human-readable state / province / emirate name (display, labels, emails)
    state: { type: String, required: true },
    // UAE addresses have no postal code; every other country requires one
    pincode: {
      type: String,
      required: function (this: { country?: string }) {
        return String(this.country || "IN").toUpperCase() !== "AE";
      },
      default: "",
    },
    // ISO 3166-2 code from the validated address, e.g. "IN-TN" (source of `country`)
    stateCode: { type: String, uppercase: true, trim: true },
    // Accepted-with-warning signals from address validation (POSTAL_UNKNOWN, PO_BOX, ...)
    addressFlags: { type: [String], default: undefined },
    // Version of the postal/state tables the address was validated against
    addressDataVersion: { type: String },
    // Set when a captured payment's amount/currency didn't match the order (order stays Pending)
    paymentMismatch: { type: mongoose.Schema.Types.Mixed },
    // Set when the wallet (Swago Money) debit could not be applied at commit time
    // (balance spent concurrently). Admin must review before shipping.
    walletDebitFailed: { type: Boolean, default: undefined },
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
    // Order country — derived server-side from the validated address (stateCode), never the client/IP.
    // Default kept only for legacy documents created before stateCode existed.
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
