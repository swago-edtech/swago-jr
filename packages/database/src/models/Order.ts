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
    age: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    // ✅ UPDATED: Expanded status enum
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled', 'Failed', 'Abandoned'],
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
    items: [
      {
        productId: { type: mongoose.Schema.Types.Mixed, required: true }, // ✅ CHANGED: Now accepts both Number and String
        name: String,
        price: Number,
        quantity: Number,
        image: String,
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
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
      enum: ['webhook', 'frontend'],
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
      ref: "KidProfile",
      required: false
    }
  },
  { timestamps: true }
);

// ❌ REMOVED: All .index() calls
// Indexes are now created manually via migration scripts

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
