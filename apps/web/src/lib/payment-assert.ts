/**
 * Asserts that a captured Razorpay payment matches the order it finalizes:
 * same Razorpay order, same currency, same amount (minor units). Used by the
 * frontend verify routes, the webhook and finalizeOrder before an order is
 * ever marked Paid.
 */
export interface CapturedPayment {
  amount: number | string; // minor units, as Razorpay reports
  currency: string;
  order_id?: string | null;
  status?: string | null;
}

export interface PayableOrder {
  currency?: string | null;
  total?: number | null;
  displayTotal?: number | null;
  razorpay_order_id?: string | null;
}

export function expectedChargeMinor(order: PayableOrder): { currency: string; amountMinor: number } {
  const currency = String(order.currency || "INR").toUpperCase();
  const major =
    currency === "INR"
      ? Number(order.displayTotal ?? order.total ?? 0)
      : Number(order.displayTotal ?? NaN);
  return { currency, amountMinor: Number.isFinite(major) ? Math.round(major * 100) : NaN };
}

export type PaymentCheck = { ok: true } | { ok: false; reason: string; expected: string; received: string };

export function checkPaymentMatchesOrder(order: PayableOrder, payment: CapturedPayment): PaymentCheck {
  const exp = expectedChargeMinor(order);
  const gotCurrency = String(payment.currency || "").toUpperCase();
  const gotAmount = Number(payment.amount);
  const expected = `${exp.amountMinor} ${exp.currency}`;
  const received = `${gotAmount} ${gotCurrency}`;
  if (payment.status && !["captured", "authorized"].includes(String(payment.status))) {
    return { ok: false, reason: `payment status ${payment.status}`, expected, received };
  }
  // Strict: when the order has a Razorpay order, the payment must belong to it.
  if (order.razorpay_order_id && payment.order_id !== order.razorpay_order_id) {
    return { ok: false, reason: "razorpay order mismatch", expected: String(order.razorpay_order_id), received: String(payment.order_id ?? "none") };
  }
  if (!Number.isFinite(exp.amountMinor)) return { ok: false, reason: "order has no charge amount", expected, received };
  if (gotCurrency !== exp.currency) return { ok: false, reason: "currency mismatch", expected, received };
  if (!Number.isInteger(gotAmount) || gotAmount !== exp.amountMinor) return { ok: false, reason: "amount mismatch", expected, received };
  return { ok: true };
}

export class PaymentMismatchError extends Error {
  constructor(public readonly check: Extract<PaymentCheck, { ok: false }>, orderId: string) {
    super(`Payment does not match order ${orderId}: ${check.reason} (expected ${check.expected}, received ${check.received})`);
    this.name = "PaymentMismatchError";
  }
}

/** Constant-time compare for hex HMAC signatures. */
export function safeEqualHex(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
