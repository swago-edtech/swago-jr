import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    phone: { type: String, required: true, unique: true },
    email: { type: String }, // New: Field for the user's email
    isAdmin: {
      type: Boolean,
      default: false,
    },
    wishlist: [{
      type: Number,
    }],
    age: { type: Number },
    address: { type: String },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;