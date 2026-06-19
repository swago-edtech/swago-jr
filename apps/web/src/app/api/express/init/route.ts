// apps/web/src/app/api/express/init/route.ts
// PUBLIC endpoint — no authentication required.
// Called when a user lands on the Express Checkout page from an ad.
// Returns product data, coupon validation, cross-sell recommendations, and promotion config.

import { NextRequest, NextResponse } from "next/server";
import { connectDB, Product, Promotion, ExpressConfig } from "@swago/database";
import { isValidObjectId } from "mongoose";
import { validateCoupon } from "@/lib/coupon";
import { Coupon } from "@swago/database";

// ✅ Type for product documents
interface ProductDocument {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  videos?: string[];
  ageCategory: string;
  coreElements: string[];
  benefits?: string;
  boxContents?: string;
  stock: number;
  reservedStock?: number;
  isFeatured: boolean;
  isActive: boolean;
  label?: string;
  rating?: number;
  numReviews?: number;
  skills?: { title: string; image: string }[];
  [key: string]: unknown;
}

/**
 * Fetch a product by slug or MongoDB _id
 */
async function getProductByIdOrSlug(id: string): Promise<ProductDocument | null> {
  try {
    // Try slug first
    let product = await Product.findOne({ slug: id, isActive: true }).lean();

    // Try MongoDB _id if valid ObjectId
    if (!product && isValidObjectId(id)) {
      product = await Product.findOne({ _id: id, isActive: true }).lean();
    }

    return product as ProductDocument | null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const couponCode = searchParams.get("couponCode");

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // ========================================
    // 1. Fetch the main product
    // ========================================
    const product = await getProductByIdOrSlug(productId);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found or unavailable" },
        { status: 404 }
      );
    }

    const availableStock = Math.max(0, product.stock - (product.reservedStock || 0));

    if (availableStock === 0) {
      return NextResponse.json(
        { success: false, error: "This product is currently out of stock" },
        { status: 400 }
      );
    }

    // ========================================
    // 2. Validate coupon (if provided)
    // ========================================
    let couponData = null;

    if (couponCode) {
      try {
        const { coupon, discountAmount } = await validateCoupon(
          couponCode,
          product.price, // Single item price as base
          [{ productId: product._id.toString(), price: product.price, quantity: 1, name: product.name }],
          undefined, // No userId for guest validation
          true // isExpressCheckout
        );

        couponData = {
          valid: true,
          code: coupon.code,
          description: coupon.description,
          type: coupon.type,
          value: coupon.value,
          maxDiscount: coupon.maxDiscount || null,
          minAmount: coupon.minAmount || 0,
          applicableProducts: coupon.applicableProducts || [],
          discount: discountAmount,
        };
      } catch (couponError: any) {
        // Coupon invalid — return info but don't block the page
        couponData = {
          valid: false,
          code: couponCode,
          error: couponError.message,
        };
      }
    }

    // ========================================
    // 3. Fetch cross-sell products (featured, exclude main product)
    // ========================================
    const crossSellProducts = await Product.find({
      isActive: true,
      isFeatured: true,
      _id: { $ne: product._id },
    })
      .select("_id name price originalPrice images slug stock reservedStock label rating numReviews ageCategory")
      .limit(4)
      .lean() as unknown as ProductDocument[];

    // Add available stock to each cross-sell product
    const crossSells = crossSellProducts
      .map((p) => ({
        ...p,
        availableStock: Math.max(0, p.stock - (p.reservedStock || 0)),
      }))
      .filter((p) => p.availableStock > 0);

    // ========================================
    // 4. Fetch active promotion config
    // ========================================
    const promotion = await Promotion.findOne().lean();

    // ========================================
    // 5. Fetch Express Config
    // ========================================
    let expressConfig: any = await ExpressConfig.findOne({ isSingleton: true }).lean();
    if (!expressConfig) {
      expressConfig = { isTimerEnabled: false, timerText: "⚡ EXPRESS CHECKOUT — FREE SHIPPING ON ONLINE ORDERS", timerMinutes: 10, allowPublicCoupons: false };
    }

    // ========================================
    // 6. Fetch Active Coupons
    // ========================================
    const currentDate = new Date();
    const couponQuery: any = {
      active: true,
      $or: [
          { expiryDate: null },
          { expiryDate: { $gt: currentDate } }
      ]
    };
    
    // Apply express-only filter if public coupons are not allowed
    if (!expressConfig.allowPublicCoupons) {
      couponQuery.isExpressOnly = true;
    }

    const availableCoupons = await Coupon.find(couponQuery).select("code description").lean();

    // ========================================
    // 7. Return assembled data
    // ========================================

    return NextResponse.json({
      success: true,
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        images: product.images,
        videos: product.videos,
        ageCategory: product.ageCategory,
        coreElements: product.coreElements,
        benefits: product.benefits,
        boxContents: product.boxContents,
        label: product.label,
        rating: product.rating,
        numReviews: product.numReviews,
        skills: product.skills,
        availableStock,
      },
      coupon: couponData,
      crossSells,
      promotion: promotion
        ? {
            shippingThreshold: (promotion as any).shippingThreshold || 1450,
            bonusItems: (promotion as any).isActive ? (promotion as any).bonusItems || [] : [],
            redemptionTiers: (promotion as any).isActive ? (promotion as any).redemptionTiers || [] : [],
            blockedCodStates: (promotion as any).blockedCodStates || [],
            blockedCodPincodes: (promotion as any).blockedCodPincodes || [],
          }
        : null,
      expressConfig,
      availableCoupons,
    });
  } catch (error) {
    console.error("Express init error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize express checkout" },
      { status: 500 }
    );
  }
}
