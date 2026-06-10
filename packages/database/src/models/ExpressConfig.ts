import mongoose from "mongoose";

const ExpressConfigSchema = new mongoose.Schema(
  {
    isTimerEnabled: { type: Boolean, default: false },
    timerText: { type: String, default: "⚡ EXPRESS CHECKOUT — FREE SHIPPING ON ONLINE ORDERS" },
    timerMinutes: { type: Number, default: 10 },
    isSingleton: { type: Boolean, default: true, unique: true }, // Ensure only one document exists
  },
  { timestamps: true }
);

const ExpressConfig = mongoose.models.ExpressConfig || mongoose.model("ExpressConfig", ExpressConfigSchema);
export default ExpressConfig;
