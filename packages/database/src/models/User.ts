import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    phone: { type: String, unique: true, sparse: true }, // Made sparse for admin users without phone
    email: { type: String, unique: true, sparse: true }, // Made unique for admin login
    
    // Admin fields
    password: { type: String }, // For admin users only
    isAdmin: {
      type: Boolean,
      default: false,
    },
    
    // Customer fields
    wishlist: [{
      type: Number,
    }],
    age: { type: Number },
    address: { type: String },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  },
  { timestamps: true }
);

// Indexes
UserSchema.index({ phone: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ isAdmin: 1 });

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;