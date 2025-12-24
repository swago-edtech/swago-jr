import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    
    // Sparse unique indexes allow null values (admin has no phone, customer has no email)
    phone: { 
      type: String, 
      unique: true,
      sparse: true
    },
    
    email: { 
      type: String, 
      unique: true,
      sparse: true
    },
    
    // ✅ NEW: Track authentication method
    authMethod: {
      type: String,
      enum: ['phone', 'email'],
      required: false  // Existing users don't have this
    },
    
    // Admin fields
    password: { type: String },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    
    // Customer fields
    wishlist: [{ 
      type: mongoose.Schema.Types.Mixed,  // Supports both Number and String
    }],
    
    // ✅ UPDATED: Cart field with full product details
    cart: [{
      productId: { 
        type: mongoose.Schema.Types.Mixed, // Supports both number (1-100) and string (MongoDB ObjectId)
        required: true 
      },
      quantity: { 
        type: Number, 
        required: true,
        min: 1,
        default: 1
      },
      // ✅ NEW: Snapshot product details at add-to-cart time
      price: {
        type: Number,
        required: true,
        min: 0
      },
      name: {
        type: String,
        required: true
      },
      image: {
        type: String,
        required: true
      },
      addedAt: { 
        type: Date, 
        default: Date.now 
      }
    }],
    
    age: { type: Number },
    address: { type: String },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  },
  { timestamps: true }
);

// Additional indexes
UserSchema.index({ isAdmin: 1 });

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
