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
    status: { type: String, default: "Pending" },
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
      unique: true,
      sparse: true
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
  },
  { timestamps: true }
);

// ✅ UPDATED: Critical index for user's orders lookup by userId
OrderSchema.index({ userId: 1, createdAt: -1 });     

// Keep phone index for backward compatibility
OrderSchema.index({ phone: 1, createdAt: -1 });     

// Admin panel indexes
OrderSchema.index({ createdAt: -1 });               
OrderSchema.index({ status: 1, createdAt: -1 });    

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
