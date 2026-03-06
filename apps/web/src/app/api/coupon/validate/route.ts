import { NextResponse } from "next/server";
import { connectDB } from "@swago/database";
import { validateCoupon } from "@/lib/coupon";

export async function POST(req: Request) {
  try {
    const { couponCode, orderAmount, cartItems } = await req.json();

    if (!couponCode || !orderAmount) {
      return NextResponse.json(
        { success: false, error: "Coupon code and order amount are required" },
        { status: 400 }
      );
    }

    await connectDB();

    try {
      const { coupon, discountAmount, finalAmount } = await validateCoupon(couponCode, orderAmount, cartItems);

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
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}