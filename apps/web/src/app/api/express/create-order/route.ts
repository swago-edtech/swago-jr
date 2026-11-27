// apps/web/src/app/api/express/create-order/route.ts
// PUBLIC endpoint — no authentication required.
// Handles: address validation + Shadow Account + server pricing + Order + Razorpay order.
//
// Security order of operations: body → address (country from ISO state + postal)
// → cart → COD rules / OTP → InternationalConfig → DB prices → drift check →
// shadow account → order → Razorpay (charged in the address currency).
// Client-sent country / currency / exchangeRate are ignored.

import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import { SignJWT } from "jose";
import { connectDB, Product, Order, User, Coupon as CouponModel, Promotion } from "@swago/database";
import { generateOrderId } from "@/lib/generateOrderId";
import { cleanupExpiredOrders } from "@/lib/cleanupExpiredOrders";
import { sendOrderConfirmationEmail } from "@/lib/msg91-email";
import { formatPhoneForStorage, verifyAccessToken } from "@/lib/msg91";
import { z } from "zod";
import {
  allocateInventoryForOrder,
  releaseInventoryAllocation,
  InsufficientInventoryError,
} from "@/lib/inventory-service";
import {
  COD_MAX_UNITS,
  COD_UNIT_LIMIT_MESSAGE,
  SWAGO_CONTACT,
  cartUnitCount,
} from "@/lib/cod-limits";
import { isCodBlocked, isIndianPhone, resolveOrderAddress, resolvePricingCountry } from "@/lib/address-server";
import { clientTotalDrifted, orderPricingFields, parseCartLines, priceOrder, type PromotionLike } from "@/lib/order-pricing";
import { defaultPricingDeps, orderAddressFields, quoteView } from "@/lib/checkout/order-request";
import { finalizeOrder } from "@/lib/payment-service";
import { intlConfirmationEmailOverrides } from "@/lib/international-order-notify";

// ✅ JWT secret for session creation
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const cookieName = "session";

// ✅ Input validation schema
const expressOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1).max(100),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(50),
  customer: z.object({
    phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(20),
    email: z.string().trim().email("Valid email is required").max(200),
    name: z.string().trim().min(1, "Name is required").max(100),
    address: z.string().max(400),
    city: z.string().max(150),
    /** ISO 3166-2 code from the grouped state select, e.g. "IN-TN". */
    stateCode: z.string().max(10).optional(),
    pincode: z.string().max(12).optional(),
    age: z.string().max(20).optional(),
  }).passthrough(),
  couponCode: z.string().max(64).optional(),
  paymentMethod: z.enum(["razorpay", "cod"]),
  /** Charged total the customer saw (in expectedCurrency). Mismatch → 409 PRICE_CHANGED. */
  expectedTotal: z.number().finite().nonnegative().optional(),
  expectedCurrency: z.string().length(3).optional(),
  otp: z.string().optional(),
  accessToken: z.string().optional(),
  utm: z.object({
    source: z.string().max(100).optional(),
    medium: z.string().max(100).optional(),
    campaign: z.string().max(100).optional(),
  }).optional(),
}).passthrough(); // legacy country/currency/exchangeRate fields are accepted and ignored

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

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

    const { items, customer, couponCode, paymentMethod, utm, accessToken } = validation.data;
    const formattedPhone = formatPhoneForStorage(customer.phone);

    // ========================================
    // 2. ADDRESS → COUNTRY (no DB yet)
    // ========================================
    const addr = resolveOrderAddress(
      { address: customer.address, city: customer.city, stateCode: customer.stateCode, pincode: customer.pincode, phone: formattedPhone },
      "express/create-order"
    );
    if (!addr.ok) return NextResponse.json(addr.body, { status: addr.status });
    const address = addr.address;

    const cart = parseCartLines(items);
    if (!cart.ok) return NextResponse.json({ success: false, error: cart.error, code: cart.code }, { status: 400 });

    // ✅ COD India-only check (country from the validated address)
    if (paymentMethod === "cod" && (address.country !== "IN" || !isIndianPhone(formattedPhone))) {
      return NextResponse.json(
        { success: false, error: "COD is only available for India and Indian phone numbers (+91)", code: "INDIA_ONLY" },
        { status: 400 }
      );
    }

    // ✅ COD unit limit
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
    // 3. CONNECT DB, COUNTRY CONFIG, PROMOTION RULES
    // ========================================
    await connectDB();

    const pc = await resolvePricingCountry(address.country);
    if (!pc.ok) {
      return NextResponse.json({ success: false, error: pc.error, code: pc.code }, { status: 400 });
    }

    const activePromotion = (await Promotion.findOne().lean()) as unknown as PromotionLike | null;
    if (paymentMethod === "cod" && isCodBlocked(activePromotion, address)) {
      return NextResponse.json({ success: false, error: "COD is not available in your location", code: "COD_BLOCKED" }, { status: 400 });
    }

    await cleanupExpiredOrders();

    // ========================================
    // 4. SHADOW ACCOUNT (only after address + cart + COD checks pass)
    // ========================================
    let user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      user = await User.create({
        phone: formattedPhone,
        email: customer.email,
        name: customer.name,
        authMethod: "phone",
        address: address.address,
      });
      console.log("✅ [Express] Shadow Account created");
    } else {
      let userUpdated = false;
      if (!user.email && customer.email) {
        user.email = customer.email;
        userUpdated = true;
      }
      if (!user.name && customer.name) {
        user.name = customer.name;
        userUpdated = true;
      }
      if (userUpdated) await user.save();
    }

    // ========================================
    // 5. SERVER-SIDE PRICE CALCULATION (shared with checkout)
    // ========================================
    const priced = await priceOrder(
      {
        lines: cart.lines,
        country: pc.country,
        paymentMethod,
        couponCode: couponCode || null,
        swagoMoneyRedeemed: 0,
        userId: user._id.toString(),
        isExpress: true,
        promotion: activePromotion,
      },
      defaultPricingDeps
    );
    if (!priced.ok) {
      return NextResponse.json(
        { success: false, error: priced.error, code: priced.code, ...(priced.details ? { details: priced.details } : {}) },
        { status: priced.status }
      );
    }
    const pricing = priced.pricing;

    if (clientTotalDrifted(pricing, { total: validation.data.expectedTotal, currency: validation.data.expectedCurrency })) {
      return NextResponse.json(
        {
          success: false,
          error: "Your order total changed. Please review the updated total and try again.",
          code: "PRICE_CHANGED",
          quote: quoteView(pricing, address),
        },
        { status: 409 }
      );
    }
    const reservations = pricing.lines;

    // ========================================
    // 6. CREATE ORDER (inventory allocated after creation)
    // ========================================
    const orderId = await generateOrderId();

    const newOrder = await Order.create({
      orderId,
      userId: new mongoose.Types.ObjectId(user._id),
      paymentMethod,
      phone: formattedPhone,
      email: customer.email,
      name: customer.name,
      age: customer.age || "",
      referralSource: utm?.source || "express_checkout",
      ...orderAddressFields(address),
      status: "Pending",
      ...orderPricingFields(pricing),
      stockReservedAt: new Date(),
      createdVia: "express",
      utm_source: utm?.source || null,
      utm_medium: utm?.medium || null,
      utm_campaign: utm?.campaign || null,
    });

    try {
      await allocateInventoryForOrder(newOrder, {
        consumeImmediately: paymentMethod === "cod",
      });
    } catch (allocError) {
      await Order.findByIdAndDelete(newOrder._id);
      if (allocError instanceof InsufficientInventoryError) {
        return NextResponse.json(
          { success: false, error: "Stock unavailable", stockErrors: [allocError.message], details: allocError.message },
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

    try {
      user.orders.push(newOrder._id);
      await user.save();
    } catch (linkError) {
      console.error("⚠️ [Express] Could not link order to user:", linkError);
    }

    // ========================================
    // 7. PAYMENT METHOD ROUTING
    // ========================================
    if (paymentMethod === "razorpay" && pricing.amountMinor === 0) {
      // Fully discounted: nothing to charge. Finalize without Razorpay.
      await finalizeOrder({
        orderIdOrMongoId: orderId,
        razorpayPaymentId: `zero_total_${orderId}`,
        source: "zero_total",
        payment: { zeroTotal: true },
      });
      const token = await new SignJWT({ phone: formattedPhone })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);
      const response = NextResponse.json({
        success: true,
        paymentMethod: "razorpay",
        zeroTotal: true,
        order: { orderId, mongoOrderId: newOrder._id.toString(), total: pricing.total },
        quote: quoteView(pricing, address),
        userId: user._id.toString(),
      });
      response.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    if (paymentMethod === "razorpay") {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
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
        amount: pricing.amountMinor,
        currency: pricing.currency,
        receipt: orderId,
        notes: {
          orderId,
          mongoOrderId: newOrder._id.toString(),
          phone: formattedPhone,
          email: customer.email.slice(0, 120),
          name: customer.name.slice(0, 100),
          source: "express_checkout",
          country: address.country,
          stateCode: address.stateCode,
          utm_source: utm?.source || "",
          utm_campaign: utm?.campaign || "",
        },
      };

      try {
        const razorpayOrder = await razorpay.orders.create(razorpayOptions);
        newOrder.razorpay_order_id = razorpayOrder.id;
        await newOrder.save();

        return NextResponse.json({
          success: true,
          paymentMethod: "razorpay",
          razorpay: {
            key: process.env.RAZORPAY_KEY_ID,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: pricing.currency,
          },
          order: {
            orderId,
            mongoOrderId: newOrder._id.toString(),
            total: pricing.total,
          },
          quote: quoteView(pricing, address),
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
          // No-op for India (COD is India-only); kept so the email can never show INR for a foreign order.
          ...intlConfirmationEmailOverrides(orderObject),
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
          total: pricing.total,
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
