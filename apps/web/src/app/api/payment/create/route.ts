import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Product, Order, User, Promotion } from "@swago/database";
import { generateOrderId } from "@/lib/generateOrderId";
import { cleanupExpiredOrders } from "@/lib/cleanupExpiredOrders";
import {
  allocateInventoryForOrder,
  releaseInventoryAllocation,
  InsufficientInventoryError,
} from "@/lib/inventory-service";
import { finalizeOrder } from "@/lib/payment-service";
import { clientTotalDrifted, orderPricingFields, type PromotionLike } from "@/lib/order-pricing";
import { jsonError, orderAddressFields, prepareCheckout, quoteView } from "@/lib/checkout/order-request";

/**
 * Creates a Pending Razorpay order for a logged-in customer.
 *
 * Security order of operations (nothing is written until every check passes):
 *   auth → body → address (country derived from ISO state + postal) → cart →
 *   InternationalConfig → DB prices / coupon / wallet → drift check →
 *   stock reservation → order → Razorpay order (charged in the address currency).
 */
export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return jsonError(400, { error: "Invalid JSON body", code: "INVALID_REQUEST" });
    }

    await connectDB();
    const user = session.phone
      ? await User.findOne({ phone: session.phone })
      : session.email
        ? await User.findOne({ email: session.email })
        : null;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const prepared = await prepareCheckout(raw, {
      context: "payment/create",
      paymentMethod: "razorpay",
      user,
      loadPromotion: () => Promotion.findOne({ isActive: true }).lean() as unknown as Promise<PromotionLike | null>,
    });
    if (!prepared.ok) return prepared.response;
    const { body, address, pricing } = prepared;
    const d = body.orderDetails;

    if (clientTotalDrifted(pricing, { total: body.expectedTotal, currency: body.expectedCurrency })) {
      return jsonError(409, {
        error: "Your order total changed. Please review the updated total and try again.",
        code: "PRICE_CHANGED",
        quote: quoteView(pricing, address),
      });
    }

    await cleanupExpiredOrders();

    // Stock is decoupled (orders are accepted at zero stock); reserve for reporting.
    const reserved: Array<{ id: unknown; qty: number }> = [];
    for (const { product, quantity } of pricing.lines) {
      await Product.updateOne({ _id: product._id }, { $inc: { reservedStock: quantity } });
      reserved.push({ id: product._id, qty: quantity });
    }
    const unreserve = async () => {
      for (const r of reserved) {
        await Product.updateOne({ _id: r.id }, { $inc: { reservedStock: -r.qty } }).catch(() => {});
      }
    };

    const orderId = await generateOrderId();
    let newOrder;
    try {
      newOrder = await Order.create({
        orderId,
        userId: new mongoose.Types.ObjectId(user._id),
        paymentMethod: "razorpay",
        phone: d.phone,
        email: d.email,
        name: d.name,
        age: d.age,
        referralSource: d.referralSource,
        ...orderAddressFields(address),
        status: "Pending",
        ...orderPricingFields(pricing),
        swagoMoneyKidId: user._id,
        stockReservedAt: new Date(),
        paymentAttempts: 0,
      });
    } catch (createError) {
      await unreserve();
      throw createError;
    }

    try {
      await allocateInventoryForOrder(newOrder, { consumeImmediately: false });
    } catch (allocError) {
      await Order.findByIdAndDelete(newOrder._id);
      await unreserve();
      if (allocError instanceof InsufficientInventoryError) {
        return NextResponse.json(
          { error: "Stock unavailable", stockErrors: [allocError.message], details: allocError.message },
          { status: 400 }
        );
      }
      throw allocError;
    }

    try {
      user.orders.push(newOrder._id);
      await user.save();
    } catch (linkError) {
      console.error("⚠️ Could not link order to user:", linkError);
    }

    // Fully discounted order: nothing to charge, no Razorpay order.
    if (pricing.amountMinor === 0) {
      await finalizeOrder({
        orderIdOrMongoId: orderId,
        razorpayPaymentId: `zero_total_${orderId}`,
        source: "zero_total",
        payment: { zeroTotal: true },
      });
      return NextResponse.json({
        success: true,
        zeroTotal: true,
        orderId,
        mongoOrderId: newOrder._id.toString(),
        currency: pricing.currency,
        quote: quoteView(pricing, address),
      });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay credentials missing");
      newOrder.status = "Failed";
      await newOrder.save();
      await releaseInventoryAllocation(newOrder);
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Razorpay notes: max 15 keys, 256 chars each — keep to short references.
    const options = {
      amount: pricing.amountMinor,
      currency: pricing.currency,
      receipt: orderId,
      notes: {
        orderId,
        mongoOrderId: newOrder._id.toString(),
        loginPhone: String(session.phone || "").slice(0, 32),
        loginEmail: String(session.email || "").slice(0, 120),
        phone: d.phone.slice(0, 32),
        email: d.email.slice(0, 120),
        name: d.name.slice(0, 100),
        country: address.country,
        stateCode: address.stateCode,
        pincode: address.postalCode,
        items_count: String(pricing.items.length),
        coupon_code: pricing.coupon?.code || "",
        total_inr: String(pricing.total),
      },
    };

    try {
      const razorpayOrder = await razorpay.orders.create(options);
      newOrder.razorpay_order_id = razorpayOrder.id;
      await newOrder.save();

      return NextResponse.json({
        ...razorpayOrder,
        key: process.env.RAZORPAY_KEY_ID,
        orderId,
        mongoOrderId: newOrder._id.toString(),
        currency: pricing.currency,
        quote: quoteView(pricing, address),
      });
    } catch (razorpayError) {
      console.error("❌ Razorpay order creation failed, marking order as failed...");
      newOrder.status = "Failed";
      await newOrder.save();
      await releaseInventoryAllocation(newOrder);
      throw razorpayError;
    }
  } catch (error: unknown) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create payment order",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
