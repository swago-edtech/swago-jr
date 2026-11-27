import { NextResponse } from "next/server";
import { connectDB, User } from "@swago/database";
import { validateCoupon } from "@/lib/coupon";
import { getLoginSession } from "@/lib/auth";
import { getSubdivision } from "@swago/utils/address";
import { resolvePricingCountry } from "@/lib/address-server";

export async function POST(req: Request) {
  try {
    const { couponCode, orderAmount, cartItems, isExpress, stateCode } = await req.json();

    if (!couponCode || typeof couponCode !== "string" || !orderAmount || typeof orderAmount !== "number") {
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

    // Messages in the currency the address will be charged in (display only;
    // the real discount is recomputed server-side at order creation).
    let display: { currency: string; exchangeRate: number; currencySymbol?: string } | undefined;
    const sub = getSubdivision(stateCode);
    if (sub && sub.country !== "IN") {
      const pc = await resolvePricingCountry(sub.country);
      if (pc.ok) display = pc.country;
    }

    try {
      const { coupon, discountAmount, finalAmount } = await validateCoupon(
        couponCode,
        orderAmount,
        Array.isArray(cartItems) ? cartItems : [],
        userId,
        !!isExpress,
        display
      );

      return NextResponse.json({
        success: true,
        coupon: {
          code: coupon.code,
          description: coupon.description,
          type: coupon.type,
          value: coupon.value,
          maxDiscount: coupon.maxDiscount || null,
          minAmount: coupon.minAmount || 0,
          applicableProducts: coupon.applicableProducts || [],
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