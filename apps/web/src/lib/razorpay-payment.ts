/**
 * Fetches the captured payment entity from Razorpay so the frontend verify
 * routes can assert amount + currency before finalizing. The HMAC signature
 * only proves the payment belongs to the Razorpay order; this proves what was
 * actually charged.
 */
import Razorpay from "razorpay";
import type { CapturedPayment } from "./payment-assert";

export type FetchPaymentResult = { ok: true; payment: CapturedPayment } | { ok: false; error: string };

export async function fetchCapturedPayment(paymentId: string): Promise<FetchPaymentResult> {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return { ok: false, error: "Payment gateway not configured" };
  try {
    const rp = new Razorpay({ key_id, key_secret });
    const p = (await rp.payments.fetch(paymentId)) as unknown as { amount: number | string; currency: string; order_id?: string | null; status?: string | null };
    return { ok: true, payment: { amount: p.amount, currency: p.currency, order_id: p.order_id, status: p.status } };
  } catch (e: unknown) {
    const err = e as { error?: { description?: string }; message?: string } | null;
    return { ok: false, error: err?.error?.description || err?.message || "Could not fetch payment" };
  }
}
