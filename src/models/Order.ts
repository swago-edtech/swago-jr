import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: String, required: true },
    address: { type: String, required: true },
    status: { type: String, default: "Pending" },
    // New: Add a field to store the cart items
    items: [
      {
        name: String,
        price: Number,
        quantity: Number,
        image: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);