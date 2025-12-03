import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Product name is required"],
      trim: true
    },
    
    description: { 
      type: String, 
      required: [true, "Description is required"]
    },
    
    price: { 
      type: Number, 
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"]
    },
    
    originalPrice: { 
      type: Number,
      min: [0, "Original price cannot be negative"]
    },
    
    images: [{ 
      type: String,
      required: true
    }],
    
    ageCategory: {
      type: String,
      enum: {
        values: ["5-7", "8-10", "11-13"],
        message: "Age category must be 5-7, 8-10, or 11-13"
      },
      required: [true, "Age category is required"]
    },
    
    coreElements: [{
      type: String,
      enum: {
        values: ["S", "W", "A", "G", "O"],
        message: "Core element must be S, W, A, G, or O"
      }
    }],
    
    boxContents: {
      type: String,
      required: [true, "Box contents are required"]
    },
    
    benefits: {
      type: String,
      required: [true, "Benefits are required"]
    },
    
    // Inventory Management
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
      required: true
    },
    
    // ✅ NEW: Reserved stock (held during checkout)
    reservedStock: {
      type: Number,
      default: 0,
      min: [0, "Reserved stock cannot be negative"]
    },
    
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, "Low stock threshold cannot be negative"]
    },
    
    totalSold: {
      type: Number,
      default: 0,
      min: [0, "Total sold cannot be negative"]
    },
    
    // Status Management
    isActive: {
      type: Boolean,
      default: true
    },
    
    isFeatured: {
      type: Boolean,
      default: false
    },
    
    // SEO & Routing
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true
    }
    
  },
  { 
    timestamps: true 
  }
);

// Indexes for fast queries
ProductSchema.index({ isActive: 1, createdAt: -1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });
ProductSchema.index({ ageCategory: 1, isActive: 1 });
ProductSchema.index({ coreElements: 1, isActive: 1 });

// ✅ NEW: Virtual field for available stock
ProductSchema.virtual('availableStock').get(function() {
  return Math.max(0, this.stock - this.reservedStock);
});

// Auto-generate slug from name before saving
ProductSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }
  next();
});

// Validate at least one image exists
ProductSchema.path('images').validate(function(images) {
  return images && images.length > 0;
}, 'At least one image is required');

// Validate at least one core element
ProductSchema.path('coreElements').validate(function(elements) {
  return elements && elements.length > 0;
}, 'At least one core element is required');

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
