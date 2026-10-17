import mongoose from "mongoose";

const ChannelEmailConfigSchema = new mongoose.Schema(
  {
    isSingleton: { type: Boolean, default: true, unique: true },
    isEnabled: { type: Boolean, default: true },
    connectedEmail: { type: String, default: "" },
    refreshToken: { type: String, default: "" },
    // Set when Google rejects the refresh token (invalid_grant). Cleared on successful reconnect.
    authError: { type: String, default: "" },
    authErrorAt: { type: Date },
    senderAllowlist: {
      type: [String],
      default: [
        "auto-confirm@amazon.in",
        "order-update@amazon.in",
        "no-reply@amazon.in",
        "shipment-tracking@amazon.in",
      ],
    },
    productAliases: [
      {
        alias: { type: String, required: true, trim: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        productName: { type: String, default: "" },
      },
    ],
    lastHistoryId: { type: String, default: "" },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.ChannelEmailConfig ||
  mongoose.model("ChannelEmailConfig", ChannelEmailConfigSchema);
