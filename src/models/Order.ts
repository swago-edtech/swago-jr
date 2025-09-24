import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    email: { type: String, required: true }, // New: Required field for the buyer's email
    name: { type: String, required: true },
    age: { type: String, required: true },
    address: { type: String, required: true },
    status: { type: String, default: "Pending" },
    items: [
      {
        name: String,
        price: Number,
        quantity: Number,
        image: String,
      },
    ],
    razorpay_payment_id: { type: String }, // Added for reference
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);