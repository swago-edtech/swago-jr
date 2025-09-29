import { NextResponse } from "next/server";

// Hardcoded dummy coupons
const DUMMY_COUPONS = [
  {
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    description: "10% off for new customers",
    minAmount: 500,
    maxDiscount: 200,
    active: true,
  },
  {
    code: "FLAT50",
    type: "fixed",
    value: 50,
    description: "₹50 flat discount",
    minAmount: 200,
    maxDiscount: 50,
    active: true,
  },
  {
    code: "SAVE20",
    type: "percentage", 
    value: 20,
    description: "20% off on orders above ₹1000",
    minAmount: 1000,
    maxDiscount: 500,
    active: true,
  },
  {
    code: "FIRST100",
    type: "fixed",
    value: 100,
    description: "₹100 off for first-time buyers",
    minAmount: 300,
    maxDiscount: 100,
    active: true,
  },
  {
    code: "MEGA25",
    type: "percentage",
    value: 25,
    description: "25% mega discount",
    minAmount: 800,
    maxDiscount: 400,
    active: false, // Inactive coupon for testing
  },
];

export async function POST(req: Request) {
  try {
    const { couponCode, orderAmount } = await req.json();

    if (!couponCode || !orderAmount) {
      return NextResponse.json(
        { success: false, error: "Coupon code and order amount are required" },
        { status: 400 }
      );
    }

    // Find coupon
    const coupon = DUMMY_COUPONS.find(
      (c) => c.code.toLowerCase() === couponCode.toLowerCase()
    );

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: "Invalid coupon code" },
        { status: 400 }
      );
    }

    if (!coupon.active) {
      return NextResponse.json(
        { success: false, error: "This coupon is no longer active" },
        { status: 400 }
      );
    }

    // Check minimum amount
    if (orderAmount < coupon.minAmount) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Minimum order amount of ₹${coupon.minAmount} required for this coupon` 
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === "percentage") {
      discountAmount = (orderAmount * coupon.value) / 100;
      // Apply maximum discount limit
      if (discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.type === "fixed") {
      discountAmount = coupon.value;
    }

    const finalAmount = Math.max(0, orderAmount - discountAmount);

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
      },
      discount: {
        amount: discountAmount,
        originalAmount: orderAmount,
        finalAmount: finalAmount,
        savedAmount: discountAmount,
      },
    });

  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}