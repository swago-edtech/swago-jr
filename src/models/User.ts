import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String },
    phone: { type: String, required: true, unique: true },
    // New: Add the isAdmin flag
    isAdmin: {
      type: Boolean,
      default: false,
    },
    age: { type: Number },
    address: { type: String },
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);
export default User;