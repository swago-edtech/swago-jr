// apps/web/src/app/api/express/create-order/route.ts
// PUBLIC endpoint — no authentication required.
// Handles: Shadow Account creation + Stock validation + Order creation + Razorpay order.
// This is the core Express Checkout backend logic.

import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import { SignJWT } from "jose";
import { connectDB, Product, Order, User, Coupon as CouponModel, Promotion, InternationalConfig } from "@swago/database";
import { isValidObjectId } from "mongoose";
import { generateOrderId } from "@/lib/generateOrderId";
import { cleanupExpiredOrders } from "@/lib/cleanupExpiredOrders";
import { validateCoupon } from "@/lib/coupon";
import { sendOrderConfirmationEmail } from "@/lib/msg91-email";
import { formatPhoneForStorage, verifyAccessToken } from "@/lib/msg91";
import { z } from "zod";
import { getProductPrice, convertToINR, convertToLocal } from "@/lib/currency";
import {
  allocateInventoryForOrder,
  releaseInventoryAllocation,
  InsufficientInventoryError,
} from "@/lib/inventory-service";
import { findProductWithAvailability } from "@/lib/product-stock";
import {
  COD_MAX_UNITS,
  COD_UNIT_LIMIT_MESSAGE,
  SWAGO_CONTACT,
  cartUnitCount,
} from "@/lib/cod-limits";

// ✅ JWT secret for session creation
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const cookieName = "session";

// ✅ Type definitions
interface ProductDocument {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  reservedStock?: number;
  totalSold?: number;
  isActive: boolean;
  save: () => Promise<void>;
  [key: string]: unknown;
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

// ✅ Input validation schema
const expressOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1),
  })).min(1),
  customer: z.object({
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    email: z.string().email("Valid email is required"),
    name: z.string().min(1, "Name is required"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().min(5, "Valid pincode is required"),
    age: z.string().optional(),
  }),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["razorpay", "cod"]),
  country: z.string().optional(),
  currency: z.string().optional(),
  exchangeRate: z.number().optional(),
  otp: z.string().optional(),
  accessToken: z.string().optional(),
  utm: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
  }).optional(),
});

/**
 * Fetch a product by slug or MongoDB _id
 */
async function getProductById(id: string) {
  return findProductWithAvailability(id);
}

/**
 * Check if phone is Indian (+91)
 */
function isIndianPhone(phone: string): boolean {
  if (!phone) return false;
  return phone.startsWith("+91") || (phone.startsWith("91") && phone.length >= 12);
}


export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ========================================
    // 1. VALIDATE INPUT
    // ========================================
    const validation = expressOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { items, customer, couponCode, paymentMethod, country, currency, exchangeRate, utm, otp, accessToken } = validation.data;
    const formattedPhone = formatPhoneForStorage(customer.phone);

    const countryCode = country || 'IN';
    const finalCurrency = currency || 'INR';
    const exchangeRateUsed = exchangeRate || 1;

    // ✅ COD India-only check
    if (paymentMethod === "cod" && (countryCode !== 'IN' || !isIndianPhone(formattedPhone))) {
      return NextResponse.json(
        { success: false, error: "COD is only available for India and Indian phone numbers (+91)" },
        { status: 400 }
      );
    }

    // ✅ COD OTP Verification
    if (paymentMethod === "cod") {
      if (!accessToken) {
        return NextResponse.json(
          { success: false, error: "OTP verification required for COD orders" },
          { status: 400 }
        );
      }

      const verifyResult = await verifyAccessToken(accessToken);
      if (!verifyResult.success) {
        return NextResponse.json(
          { success: false, error: verifyResult.error || "Invalid Access Token" },
          { status: 400 }
        );
      }
    }

    // ========================================
    // 2. CONNECT DB & CLEANUP
    // ========================================
    await connectDB();

    // ✅ Fetch active promotion for validation and price calculation
    const activePromotion = await Promotion.findOne().lean() as any;
    
    // ✅ Check COD Blocked States & Pincodes
    const isBlockedState = activePromotion?.blockedCodStates?.some((blockedState: string) => blockedState.toLowerCase() === customer.state.toLowerCase());
    const isBlockedPincode = activePromotion?.blockedCodPincodes?.includes(customer.pincode);
    if (paymentMethod === "cod" && (isBlockedState || isBlockedPincode)) {
      return NextResponse.json({ success: false, error: "COD is not available in your location" }, { status: 400 });
    }

    // ✅ COD unit limit — same guard as /api/payment/cod (before stock/order mutation)
    if (paymentMethod === "cod") {
      const units = cartUnitCount(items);
      if (units > COD_MAX_UNITS) {
        return NextResponse.json(
          {
            success: false,
            error: `${COD_UNIT_LIMIT_MESSAGE} Contact ${SWAGO_CONTACT.phoneDisplay} / WhatsApp / ${SWAGO_CONTACT.email}`,
            code: "COD_UNIT_LIMIT",
            maxUnits: COD_MAX_UNITS,
            cartUnits: units,
          },
          { status: 400 }
        );
      }
    }

    await cleanupExpiredOrders();

    // ========================================
    // 3. SHADOW ACCOUNT LOGIC
    // ========================================
    console.log("🔍 [Express] Shadow Account lookup for:", formattedPhone);

    let user = await User.findOne({ phone: formattedPhone });
    let isNewUser = false;

    if (!user) {
      // Create Shadow Account
      user = await User.create({
        phone: formattedPhone,
        email: customer.email,
        name: customer.name,
        authMethod: "phone",
        address: customer.address,
      });
      isNewUser = true;
      console.log("✅ [Express] Shadow Account created:", formattedPhone);
    } else {
      console.log("✅ [Express] Existing user found:", formattedPhone);
      // Update email/name if not set
      let userUpdated = false;
      if (!user.email && customer.email) {
        user.email = customer.email;
        userUpdated = true;
      }
      if (!user.name && customer.name) {
        user.name = customer.name;
        userUpdated = true;
      }
      if (userUpdated) {
        await user.save();
      }
    }

    // ========================================
    // 4. STOCK VALIDATION & RESERVATION
    // ========================================
    console.log("🔍 [Express] Stock validation for", items.length, "items");

    const stockErrors: string[] = [];
    const reservations: Array<{ product: ProductDocument; quantity: number }> = [];

    for (const item of items) {
      const product = await getProductById(item.productId);

      if (!product) {
        stockErrors.push(`Product ${item.productId} is no longer available`);
        continue;
      }

      const availableStock = product.availableStock ?? 0;

      if (availableStock <= 0) {
        console.log(`⚠️ [Express] ${product.name}: negative/zero stock (${availableStock}), order still accepted`);
      }
      reservations.push({ product, quantity: item.quantity });
    }

    if (stockErrors.length > 0) {
      console.log("❌ [Express] Stock validation failed:", stockErrors);
      return NextResponse.json(
        { success: false, error: "Stock unavailable", stockErrors, details: stockErrors.join("; ") },
        { status: 400 }
      );
    }

    // ========================================
    // 5. SERVER-SIDE PRICE CALCULATION
    // ========================================
    // ✅ activePromotion is already fetched above

    const BONUS_THRESHOLDS: Record<string, number> = {};
    if (activePromotion?.isActive && activePromotion?.bonusItems) {
      activePromotion.bonusItems.forEach((item: any) => {
        BONUS_THRESHOLDS[item.slug] = item.threshold;
      });
    } else {
      BONUS_THRESHOLDS["mini-swago-game-card"] = 999;
      BONUS_THRESHOLDS["special-edition-item"] = 1999;
    }

    // Build order items using DB-verified prices (fixed intl price → INR ledger)
    let totalWeight = 0;
    let localMerchandiseTotal = 0;
    const orderItems: OrderItem[] = reservations.map(({ product, quantity }) => {
      totalWeight += ((product as any).weight || 0) * quantity;
      const resolvedLocal = getProductPrice(
        {
          price: (product as any).price,
          originalPrice: (product as any).originalPrice,
          internationalPricing: (product as any).internationalPricing,
        },
        finalCurrency,
        exchangeRateUsed
      );
      localMerchandiseTotal += resolvedLocal.price * quantity;
      const ledgerPrice =
        finalCurrency === "INR"
          ? (product as any).price
          : convertToINR(resolvedLocal.price, exchangeRateUsed);
      return {
        productId: product._id.toString(),
        name: product.name,
        price: ledgerPrice,
        quantity,
        image: (product as any).images?.[0] || "",
      };
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // ========================================
    // 6. COUPON VALIDATION
    // ========================================
    let discountAmount = 0;
    let validatedCoupon = null;

    if (couponCode) {
      try {
        const cartItemsForCoupon = orderItems.map((item) => ({
          productId: item.productId,
          price: item.price,
          quantity: item.quantity,
          name: item.name,
        }));

        const { coupon, discountAmount: validated } = await validateCoupon(
          couponCode,
          subtotal,
          cartItemsForCoupon,
          user._id.toString(),
          true // isExpressCheckout
        );
        discountAmount = validated;
        validatedCoupon = coupon;
      } catch (couponError: any) {
        console.error("[Express] Coupon validation failed:", couponError.message);
        return NextResponse.json(
          { success: false, error: `Coupon Error: ${couponError.message}` },
          { status: 400 }
        );
      }
    }

    // ========================================
    // 7. CALCULATE TOTAL
    // ========================================
    const calculatedAmountAfterCoupon = Math.max(0, subtotal - discountAmount);

    // Shipping / COD fee calculation
    let shippingFee = 0;
    if (countryCode !== 'IN') {
      const config = await InternationalConfig.findOne({ isSingleton: true }).lean() as any;
      if (config && config.supportedCountries) {
        const countryConfig = config.supportedCountries.find((c: any) => c.code === countryCode);
        if (countryConfig) {
          if (countryConfig.shippingTiers && countryConfig.shippingTiers.length > 0) {
            const matchedTier = countryConfig.shippingTiers.find(
              (t: any) => totalWeight >= t.minWeight && totalWeight <= t.maxWeight
            );
            if (matchedTier) {
              shippingFee = matchedTier.fee;
            } else {
              const highestTier = [...countryConfig.shippingTiers].sort((a: any, b: any) => b.maxWeight - a.maxWeight)[0];
              shippingFee = totalWeight > highestTier.maxWeight ? highestTier.fee : countryConfig.shippingFee;
            }
          } else {
            shippingFee = countryConfig.shippingFee || 0;
          }
        }
      }
    } else {
      if (paymentMethod === "razorpay") {
        shippingFee = 0;
      } else {
        const shippingThreshold = activePromotion?.shippingThreshold || 1450;
        shippingFee = calculatedAmountAfterCoupon >= shippingThreshold ? 0 : 50;
      }
    }

    const calculatedTotal = Math.max(0, calculatedAmountAfterCoupon + shippingFee);

    const localDiscount =
      finalCurrency === "INR" ? discountAmount : convertToLocal(discountAmount, exchangeRateUsed);
    const localShipping =
      finalCurrency === "INR" ? shippingFee : convertToLocal(shippingFee, exchangeRateUsed);
    const displayTotal = Math.max(0, localMerchandiseTotal - localDiscount + localShipping);

    // ========================================
    // 8. CREATE ORDER (inventory allocated after creation)
    // ========================================
    const orderId = await generateOrderId();
    console.log("✅ [Express] Generated Order ID:", orderId);

    const newOrder = await Order.create({
      orderId,
      userId: new mongoose.Types.ObjectId(user._id),
      paymentMethod,
      phone: formattedPhone,
      email: customer.email,
      name: customer.name,
      age: customer.age || "",
      referralSource: utm?.source || "express_checkout",
      address: customer.address,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      status: "Pending",
      items: orderItems,
      subtotal,
      discount: discountAmount,
      shippingFee: countryCode === 'IN' ? shippingFee : 0,
      internationalShippingFee: countryCode !== 'IN' ? shippingFee : 0,
      total: calculatedTotal,
      country: countryCode,
      currency: finalCurrency,
      exchangeRateUsed: exchangeRateUsed,
      displayTotal: displayTotal,
      stockReservedAt: new Date(),
      createdVia: "express",
      // ✅ UTM Tracking
      utm_source: utm?.source || null,
      utm_medium: utm?.medium || null,
      utm_campaign: utm?.campaign || null,
      ...(validatedCoupon && {
        couponCode: validatedCoupon.code,
        couponDetails: validatedCoupon,
      }),
    });

    console.log("✅ [Express] Order created:", orderId);

    try {
      await allocateInventoryForOrder(newOrder, {
        consumeImmediately: paymentMethod === "cod",
      });
    } catch (allocError) {
      await Order.findByIdAndDelete(newOrder._id);
      if (allocError instanceof InsufficientInventoryError) {
        return NextResponse.json(
          {
            success: false,
            error: "Stock unavailable",
            stockErrors: [allocError.message],
            details: allocError.message,
          },
          { status: 400 }
        );
      }
      throw allocError;
    }

    if (paymentMethod === "cod") {
      for (const { product, quantity } of reservations) {
        await Product.findByIdAndUpdate(product._id, { $inc: { totalSold: quantity } });
      }
    }

    // Link order to user
    try {
      user.orders.push(newOrder._id);
      await user.save();
      console.log("✅ [Express] Order linked to user:", user._id);
    } catch (linkError) {
      console.error("⚠️ [Express] Could not link order to user:", linkError);
    }

    // ========================================
    // 10. PAYMENT METHOD ROUTING
    // ========================================

    if (paymentMethod === "razorpay") {
      // ── RAZORPAY FLOW ──
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        // Rollback: mark order failed, release stock
        newOrder.status = "Failed";
        await newOrder.save();
        await releaseInventoryAllocation(newOrder);
        return NextResponse.json(
          { success: false, error: "Payment gateway not configured" },
          { status: 500 }
        );
      }

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const razorpayOptions = {
        amount: Math.round((finalCurrency === "INR" ? calculatedTotal : displayTotal) * 100),
        currency: finalCurrency,
        receipt: orderId,
        notes: {
          orderId,
          mongoOrderId: newOrder._id.toString(),
          phone: formattedPhone,
          email: customer.email,
          name: customer.name,
          source: "express_checkout",
          utm_source: utm?.source || "",
          utm_campaign: utm?.campaign || "",
        },
      };

      try {
        const razorpayOrder = await razorpay.orders.create(razorpayOptions);
        console.log("✅ [Express] Razorpay order created:", razorpayOrder.id);

        // Update our order with Razorpay reference
        newOrder.razorpay_order_id = razorpayOrder.id;
        await newOrder.save();

        return NextResponse.json({
          success: true,
          paymentMethod: "razorpay",
          razorpay: {
            key: process.env.RAZORPAY_KEY_ID,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: finalCurrency,
          },
          order: {
            orderId,
            mongoOrderId: newOrder._id.toString(),
            total: calculatedTotal,
          },
          userId: user._id.toString(),
        });
      } catch (razorpayError) {
        console.error("❌ [Express] Razorpay order creation failed");
        newOrder.status = "Failed";
        await newOrder.save();
        await releaseInventoryAllocation(newOrder);
        throw razorpayError;
      }
    } else {
      // ── COD FLOW ──

      // Increment coupon usage
      if (newOrder.couponCode) {
        await (CouponModel as any).updateOne(
          { code: newOrder.couponCode },
          { $inc: { usageCount: 1 } }
        );
      }

      // Send confirmation email
      try {
        const orderObject = newOrder.toObject();
        await sendOrderConfirmationEmail({
          name: orderObject.name,
          orderNumber: orderId,
          orderDate: new Date().toLocaleString("en-IN"),
          email: orderObject.email,
          items: orderObject.items,
          subtotal: orderObject.subtotal.toFixed(2),
          discount: orderObject.discount.toFixed(2),
          swagoMoneyRedeemed: "0.00",
          shipping: (orderObject.shippingFee || 0).toFixed(2),
          totalAmount: orderObject.total.toFixed(2),
          paymentMethod: "Cash on Delivery",
          paymentStatus: "Pending",
          address: orderObject.address,
          city: orderObject.city,
          state: orderObject.state,
          pincode: orderObject.pincode,
        });
      } catch (emailError) {
        console.error("[Express] Email failed:", emailError);
      }

      // ✅ Create JWT session cookie for COD (user is now "logged in")
      const token = await new SignJWT({ phone: formattedPhone })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);

      const isProduction = process.env.NODE_ENV === "production";

      const response = NextResponse.json({
        success: true,
        paymentMethod: "cod",
        order: {
          orderId,
          mongoOrderId: newOrder._id.toString(),
          total: calculatedTotal,
        },
        userId: user._id.toString(),
      });

      response.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }
  } catch (error: unknown) {
    console.error("❌ [Express] Create order error:", error);

    let errorMessage = "Failed to create express order";
    if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
