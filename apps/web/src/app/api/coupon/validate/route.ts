import { NextResponse } from "next/server";
import { connectDB, User } from "@swago/database";
import { validateCoupon } from "@/lib/coupon";
import { getLoginSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { couponCode, orderAmount, cartItems, isExpress } = await req.json();

    if (!couponCode || !orderAmount) {
      return NextResponse.json(
        { success: false, error: "Coupon code and order amount are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const session = await getLoginSession();
    let userId = undefined;
    if (session) {
      const user = session.phone
        ? await User.findOne({ phone: session.phone })
        : await User.findOne({ email: session.email });
      if (user) {
        userId = user._id.toString();
      }
    }

    try {
      const { coupon, discountAmount, finalAmount } = await validateCoupon(couponCode, orderAmount, cartItems, userId, isExpress);

      return NextResponse.json({
        success: true,
        coupon: {
          code: coupon.code,
          description: coupon.description,
          type: coupon.type,
          value: coupon.value,
          maxDiscount: coupon.maxDiscount || null,
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