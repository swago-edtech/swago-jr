import mongoose from "mongoose";

const MasterclassBookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    masterclassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Masterclass",
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },

    childName: { type: String, required: true },
    childAge: { type: Number, required: true },
    parentName: { type: String, required: true },
    parentPhone: { type: String, required: true },
    parentEmail: { type: String, required: true },

    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Cancelled", "Refunded"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay"],
      default: "razorpay",
    },
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.MasterclassBooking ||
  mongoose.model("MasterclassBooking", MasterclassBookingSchema);
