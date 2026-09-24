import mongoose from "mongoose";

const ReturnGiftOrderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    product: {
      type: String,
      required: [true, "Product selection is required"],
      trim: true,
    },
    quantity: {
      type: String,
      required: [true, "Quantity is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },
    isViewed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const ReturnGiftOrder =
  mongoose.models.ReturnGiftOrder ||
  mongoose.model("ReturnGiftOrder", ReturnGiftOrderSchema);

export default ReturnGiftOrder;
