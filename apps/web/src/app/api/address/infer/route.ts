import { NextResponse } from "next/server";
import { inferFromPostal, getSubdivision } from "@swago/utils/address-server";
import { allowRequest, clientKey } from "@/lib/simple-rate-limit";

/**
 * GET /api/address/infer?postal=600001
 * Suggests candidate states for a postal code (UI autofill only). The customer
 * still confirms the state; the server derives the country from that state at
 * order time. Postal format alone never decides the country.
 */
export async function GET(req: Request) {
  if (!allowRequest(clientKey(req, "infer"), 120)) {
    return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 });
  }
  const postal = (new URL(req.url).searchParams.get("postal") || "").slice(0, 12);
  const matches = inferFromPostal(postal).map((m) => ({
    country: m.country,
    exact: m.exact,
    states: m.stateCodes.map((code) => ({ code, name: getSubdivision(code)?.name || code })),
  }));
  return NextResponse.json(
    { success: true, postal, matches },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
