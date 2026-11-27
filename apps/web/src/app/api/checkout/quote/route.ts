import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB, Promotion, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";
import { resolveOrderAddress, resolvePricingCountry } from "@/lib/address-server";
import { parseCartLines, priceOrder, type PromotionLike } from "@/lib/order-pricing";
import { defaultPricingDeps, quoteView } from "@/lib/checkout/order-request";
import { allowRequest, clientKey } from "@/lib/simple-rate-limit";

/**
 * Read-only price preview for an address + cart. Same code path as order
 * creation (order-pricing), so the total shown is the total charged.
 * Never writes to the database.
 */
const quoteSchema = z.object({
  mode: z.enum(["checkout", "express"]).default("checkout"),
  paymentMethod: z.enum(["razorpay", "cod"]).default("razorpay"),
  address: z.object({
    address: z.unknown().optional(),
    city: z.unknown().optional(),
    stateCode: z.unknown().optional(),
    pincode: z.unknown().optional(),
    phone: z.unknown().optional(),
  }),
  cart: z.array(z.unknown()).min(1),
  couponCode: z.string().max(64).optional().nullable(),
  swagoMoneyRedeemed: z.number().finite().optional(),
});

export async function POST(req: Request) {
  if (!allowRequest(clientKey(req, "quote"), 60)) {
    return NextResponse.json({ success: false, error: "Too many requests", code: "RATE_LIMITED" }, { status: 429 });
  }
  try {
    const parsed = quoteSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request", code: "INVALID_REQUEST" }, { status: 400 });
    }
    const q = parsed.data;

    const addr = resolveOrderAddress(q.address, "quote");
    if (!addr.ok) return NextResponse.json(addr.body, { status: addr.status });

    const cart = parseCartLines(q.cart);
    if (!cart.ok) return NextResponse.json({ success: false, error: cart.error, code: cart.code }, { status: 400 });

    await connectDB();
    const pc = await resolvePricingCountry(addr.address.country);
    if (!pc.ok) return NextResponse.json({ success: false, error: pc.error, code: pc.code }, { status: 400 });

    type QuoteUser = { _id?: { toString(): string }; swagoMoney?: number; ambassador?: { swagoMoney?: number } };
    let user: QuoteUser | null = null;
    if (q.mode === "checkout") {
      const session = await getLoginSession();
      const filter = session?.phone ? { phone: session.phone } : session?.email ? { email: session.email } : null;
      if (filter) user = (await User.findOne(filter).lean()) as unknown as QuoteUser | null;
    }
    const promotion = (await (q.mode === "checkout" && q.paymentMethod === "razorpay"
      ? Promotion.findOne({ isActive: true }).lean()
      : Promotion.findOne().lean())) as unknown as PromotionLike | null;

    const result = await priceOrder(
      {
        lines: cart.lines,
        country: pc.country,
        paymentMethod: q.paymentMethod,
        couponCode: q.couponCode || null,
        swagoMoneyRedeemed: q.mode === "checkout" ? q.swagoMoneyRedeemed : 0,
        walletBalance: user ? user.ambassador?.swagoMoney || user.swagoMoney || 0 : 0,
        userId: user?._id?.toString(),
        isExpress: q.mode === "express",
        promotion,
      },
      defaultPricingDeps
    );
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, code: result.code }, { status: result.status });
    }
    return NextResponse.json({
      success: true,
      quote: quoteView(result.pricing, addr.address),
      addressFlags: addr.address.flags,
      codAvailable: addr.address.country === "IN",
    });
  } catch (error) {
    console.error("[quote] error:", error);
    return NextResponse.json({ success: false, error: "Failed to price order" }, { status: 500 });
  }
}
