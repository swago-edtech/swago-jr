import mongoose from "mongoose";

const GiftingPageConfigSchema = new mongoose.Schema(
  {
    bannerDesktopUrl: {
      type: String,
      default: "",
    },
    bannerMobileUrl: {
      type: String,
      default: "",
    },
    isSingleton: {
      type: Boolean,
      default: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const GiftingPageConfig =
  mongoose.models.GiftingPageConfig ||
  mongoose.model("GiftingPageConfig", GiftingPageConfigSchema);

export default GiftingPageConfig;
