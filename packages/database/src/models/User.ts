import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    
    // Sparse unique indexes allow null values (admin has no phone, customer has no email)
    phone: { 
      type: String, 
      unique: true,  // ← Automatically creates unique index
      sparse: true   // ← Allows null/undefined (admin users)
    },
    
    email: { 
      type: String, 
      unique: true,  // ← Automatically creates unique index
      sparse: true   // ← Allows null/undefined (customer users)
    },
    
    // Admin fields
    password: { type: String }, // Only for admin users
    isAdmin: {
      type: Boolean,
      default: false,
    },
    
    // Customer fields
    wishlist: [{
      type: Number,  // Product IDs from static products.ts
    }],
    age: { type: Number },
    address: { type: String },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  },
  { timestamps: true }
);

// Additional indexes for query optimization
// (unique: true in field definition already creates indexes for phone/email)
UserSchema.index({ isAdmin: 1 }); // Fast admin user lookups

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;