// packages/database/src/models/Product.ts

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

    videos: [{
      type: String,
      default: []
    }],

    ageCategory: {
      type: String,
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

    // 🆕 NEW: Product Weight for Shipping
    weight: {
      type: Number,
      default: 0,
      min: [0, "Weight cannot be negative"]
    },

    // Inventory Management
    stock: {
      type: Number,
      default: 0,
      required: true
    },

    reservedStock: {
      type: Number,
      default: 0,
      min: [0, "Reserved stock cannot be negative"]
    },

    lowStockThreshold: {
      type: Number,
      default: 50,
      min: [0, "Low stock threshold cannot be negative"]
    },

    totalSold: {
      type: Number,
      default: 0,
      min: [0, "Total sold cannot be negative"]
    },

    // Amazon / marketplace listing SKU (e.g. SWG-OBG-SSR-01-6Y) for channel email matching
    amazonSku: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
      index: true,
    },

    // 🆕 NEW: Lottery Code Short Forms
    shortForms: {
      type: [String],
      default: [],
      uppercase: true,
      trim: true,
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

    // Combo pack: one SKU that ships multiple physical units (analytics multiplier only)
    isCombo: {
      type: Boolean,
      default: false
    },

    comboUnitCount: {
      type: Number,
      default: 1,
      min: [1, "Combo unit count must be at least 1"]
    },

    comboProductIds: {
      type: [String],
      default: []
    },

    label: {
      type: String,
      trim: true,
      default: ""
    },

    // 🆕 NEW: Rating and Review count for premium display
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    numReviews: {
      type: Number,
      default: 0
    },

    // Skills highlighted for this product
    skills: [{
      title: { type: String, required: true },
      image: { type: String, required: true }
    }],

    // SEO & Routing
    slug: {
      type: String,
      // ❌ REMOVED: unique: true,
      trim: true,
      lowercase: true
    },

    internationalPricing: {
      type: Map,
      of: new mongoose.Schema({
        price: { type: Number, min: 0, required: true },
        originalPrice: { type: Number, min: 0 },
      }, { _id: false }),
      default: new Map(),
    },

    // Per-currency fixed international shipping (local currency, charged once per cart line).
    // Missing entry = use InternationalConfig rules; fee 0 = free shipping for this product.
    internationalShipping: {
      type: Map,
      of: new mongoose.Schema({
        fee: { type: Number, min: 0, required: true },
      }, { _id: false }),
      default: new Map(),
    },

    // 🆕 NEW: Promotional Message
    showPromotionalMessage: {
      type: Boolean,
      default: false
    },

    promotionalMessage: {
      type: String,
      trim: true,
      default: ""
    }

  },
  {
    timestamps: true
  }
);

// ❌ REMOVED: All .index() calls
// Indexes are now created manually via migration scripts

// ✅ KEEP: Virtual field for available stock
ProductSchema.virtual('availableStock').get(function () {
  return Math.max(0, this.stock - this.reservedStock);
});

// ✅ KEEP: Auto-generate slug from name before saving
ProductSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }
  next();
});

// ✅ KEEP: Validate at least one image exists
ProductSchema.path('images').validate(function (images) {
  return images && images.length > 0;
}, 'At least one image is required');

// ✅ KEEP: Validate at least one core element
ProductSchema.path('coreElements').validate(function (elements) {
  return elements && elements.length > 0;
}, 'At least one core element is required');

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
