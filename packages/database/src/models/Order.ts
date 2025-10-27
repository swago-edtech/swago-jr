import mongoose from "mongoose";

// Define subdocument schema for coupon details
const CouponDetailsSchema = new mongoose.Schema({
  code: String,
  description: String,
  type: String,
  value: Number,
}, { _id: false }); // _id: false prevents MongoDB from creating _id for subdocument

const OrderSchema = new mongoose.Schema(
  {
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
        productId: { type: Number, required: true },
        name: String,
        price: Number,
        quantity: Number,
        image: String,
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    razorpay_payment_id: { type: String },
    razorpay_order_id: { type: String },
    // Optional coupon fields
    couponCode: { type: String },
    couponDetails: { 
      type: CouponDetailsSchema, 
      required: false 
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);