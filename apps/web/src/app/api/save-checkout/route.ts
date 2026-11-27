import { NextResponse } from "next/server";

/**
 * Retired: orders are only created through /api/payment/create, /api/payment/cod
 * and /api/express/create-order, which validate the address and price the cart
 * server-side. This legacy endpoint accepted client prices and unvalidated
 * addresses, so it now returns 410 Gone.
 */
export async function POST() {
  return NextResponse.json(
    { success: false, error: "This endpoint has been retired. Please refresh the page and check out again.", code: "ENDPOINT_GONE" },
    { status: 410 }
  );
}
