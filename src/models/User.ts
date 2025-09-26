import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
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
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);
export default User;