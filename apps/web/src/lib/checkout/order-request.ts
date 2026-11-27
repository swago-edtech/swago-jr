/**
 * Shared request parsing for the logged-in checkout routes
 * (/api/payment/create, /api/payment/cod, /api/checkout/quote).
 */
import { z } from "zod";
import { NextResponse } from "next/server";
import { connectDB, Promotion } from "@swago/database";
import { findProductWithAvailability } from "../product-stock";
import { validateCoupon } from "../coupon";
import { resolveOrderAddress, resolvePricingCountry, type ResolvedOrderAddress } from "../address-server";
import {
  parseCartLines,
  priceOrder,
  type OrderPricing,
  type PriceOrderDeps,
  type PricingProduct,
  type PromotionLike,
} from "../order-pricing";

const str = (max: number) => z.string().trim().max(max);

export const checkoutOrderSchema = z.object({
  /** Charged total the customer saw (in expectedCurrency). Mismatch → 409 PRICE_CHANGED. */
  expectedTotal: z.number().finite().nonnegative().optional(),
  expectedCurrency: z.string().trim().length(3).optional(),
  /** Legacy INR total (old clients). Logged only. */
  totalAmount: z.number().optional(),
  orderDetails: z
    .object({
      name: str(100).min(1, "Name is required"),
      email: str(200).email("Valid email is required"),
      phone: str(20).min(8, "Phone is required"),
      address: z.unknown().optional(),
      city: z.unknown().optional(),
      stateCode: z.unknown().optional(),
      pincode: z.unknown().optional(),
      cart: z.array(z.unknown()).min(1, "Cart is required"),
      age: str(20).optional().default(""),
      referralSource: str(100).optional().default(""),
      coupon: z.object({ code: z.string().max(64).optional() }).passthrough().nullable().optional(),
      swagoMoneyRedeemed: z.number().finite().optional().default(0),
    })
    // Old clients send country/currency/exchangeRate/displayTotal: accepted and ignored.
    .passthrough(),
});

export type CheckoutOrderBody = z.infer<typeof checkoutOrderSchema>;

export const defaultPricingDeps: PriceOrderDeps = {
  loadProduct: async (ref) => (await findProductWithAvailability(ref)) as unknown as PricingProduct | null,
  validateCoupon: (code, amount, items, userId, isExpress, display) =>
    validateCoupon(code, amount, items, userId, isExpress, display),
};

export function jsonError(status: number, body: Record<string, unknown>) {
  return NextResponse.json({ success: false, ...body }, { status });
}

export type PreparedCheckout =
  | { ok: true; body: CheckoutOrderBody; address: ResolvedOrderAddress; pricing: OrderPricing; promotion: PromotionLike | null }
  | { ok: false; response: NextResponse };

/**
 * Validates the body + address and prices the cart. No DB writes.
 * Order of checks: body → address (no DB) → cart shape → country config → prices.
 */
export async function prepareCheckout(
  raw: unknown,
  opts: {
    context: string;
    paymentMethod: "razorpay" | "cod";
    user?: { _id: { toString(): string }; ambassador?: { swagoMoney?: number }; swagoMoney?: number } | null;
    deps?: PriceOrderDeps;
    loadPromotion?: () => Promise<PromotionLike | null>;
  }
): Promise<PreparedCheckout> {
  const parsed = checkoutOrderSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, response: jsonError(400, { error: first?.message || "Invalid request", code: "INVALID_REQUEST" }) };
  }
  const body = parsed.data;
  const d = body.orderDetails;

  const addr = resolveOrderAddress(
    { address: d.address, city: d.city, stateCode: d.stateCode, pincode: d.pincode, phone: d.phone },
    opts.context
  );
  if (!addr.ok) return { ok: false, response: NextResponse.json(addr.body, { status: addr.status }) };

  const cart = parseCartLines(d.cart);
  if (!cart.ok) return { ok: false, response: jsonError(400, { error: cart.error, code: cart.code }) };

  await connectDB();
  const pc = await resolvePricingCountry(addr.address.country);
  if (!pc.ok) return { ok: false, response: jsonError(400, { error: pc.error, code: pc.code }) };

  const promotion =
    (await (opts.loadPromotion ? opts.loadPromotion() : (Promotion.findOne().lean() as unknown as Promise<PromotionLike | null>))) || null;

  const result = await priceOrder(
    {
      lines: cart.lines,
      country: pc.country,
      paymentMethod: opts.paymentMethod,
      couponCode: d.coupon?.code || null,
      swagoMoneyRedeemed: d.swagoMoneyRedeemed,
      walletBalance: opts.user ? opts.user.ambassador?.swagoMoney || opts.user.swagoMoney || 0 : 0,
      userId: opts.user?._id.toString(),
      isExpress: false,
      promotion,
    },
    opts.deps || defaultPricingDeps
  );
  if (!result.ok) {
    return { ok: false, response: jsonError(result.status, { error: result.error, code: result.code, ...(result.details ? { details: result.details } : {}) }) };
  }
  return { ok: true, body, address: addr.address, pricing: result.pricing, promotion };
}

/** Public, client-facing view of a pricing result. */
export function quoteView(p: OrderPricing, address: Pick<ResolvedOrderAddress, "country" | "stateCode" | "flags">) {
  return {
    country: p.country,
    stateCode: address.stateCode,
    currency: p.currency,
    currencySymbol: p.currencySymbol,
    exchangeRate: p.exchangeRateUsed,
    items: p.items.map((i) => ({ productId: i.productId, name: i.name, quantity: i.quantity, unitPrice: i.localPrice ?? i.price })),
    subtotal: p.local.merchandise,
    discount: p.local.discount,
    swagoMoney: p.local.swago,
    shipping: p.local.shipping,
    total: p.displayTotal,
    totalINR: p.total,
  };
}

/** Address fields persisted on every order. */
export function orderAddressFields(a: ResolvedOrderAddress) {
  return {
    address: a.address,
    city: a.city,
    state: a.stateName,
    stateCode: a.stateCode,
    pincode: a.postalCode,
    country: a.country,
    ...(a.flags.length ? { addressFlags: a.flags } : {}),
    addressDataVersion: a.dataVersion,
  };
}
