import mongoose from "mongoose";

const PopupConfigSchema = new mongoose.Schema(
  {
    isActive: { type: Boolean, default: false },
    title: { type: String, default: "Special Offer!" },
    description: { type: String, default: "Get 20% off your first purchase." },
    buttonText: { type: String, default: "Claim Now" },
    redirectUrl: { type: String, default: "/products" },
    couponCode: { type: String, default: "" },
    isSingleton: { type: Boolean, default: true, unique: true }, // Ensure only one document exists
  },
  { timestamps: true }
);

const PopupConfig = mongoose.models.PopupConfig || mongoose.model("PopupConfig", PopupConfigSchema);
export default PopupConfig;
