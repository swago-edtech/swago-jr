import mongoose from "mongoose";

const CountrySchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  currency: { type: String, required: true, uppercase: true, trim: true },
  currencySymbol: { type: String, required: true, trim: true },
  phonePrefix: { type: String, required: true, trim: true },
  shippingFee: { type: Number, default: 0, min: 0 },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  exchangeRate: { type: Number, required: true, min: 0 },
}, { _id: false });

const InternationalConfigSchema = new mongoose.Schema(
  {
    supportedCountries: {
      type: [CountrySchema],
      default: [
        {
          code: "IN",
          name: "India",
          currency: "INR",
          currencySymbol: "₹",
          phonePrefix: "+91",
          shippingFee: 0,
          isDefault: true,
          isActive: true,
          exchangeRate: 1,
        },
        {
          code: "US",
          name: "United States",
          currency: "USD",
          currencySymbol: "$",
          phonePrefix: "+1",
          shippingFee: 400,
          isDefault: false,
          isActive: true,
          exchangeRate: 0.012,
        },
        {
          code: "CA",
          name: "Canada",
          currency: "CAD",
          currencySymbol: "CA$",
          phonePrefix: "+1",
          shippingFee: 500,
          isDefault: false,
          isActive: true,
          exchangeRate: 0.016,
        },
        {
          code: "AE",
          name: "United Arab Emirates",
          currency: "AED",
          currencySymbol: "د.إ",
          phonePrefix: "+971",
          shippingFee: 200,
          isDefault: false,
          isActive: true,
          exchangeRate: 0.044,
        },
      ],
    },
    isSingleton: { type: Boolean, default: true, unique: true },
  },
  { timestamps: true }
);

const InternationalConfig =
  mongoose.models.InternationalConfig ||
  mongoose.model("InternationalConfig", InternationalConfigSchema);

export default InternationalConfig;
