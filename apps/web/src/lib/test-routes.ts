import { NextResponse } from "next/server";

/**
 * Dev/load-test-only API routes (test-auth, test-order, test-email,
 * test/add-swago-money) are OFF unless BOTH:
 *   - NODE_ENV is not "production", and
 *   - ENABLE_TEST_ROUTES === "true" (explicit opt-in).
 * Fails closed: anything else returns 404 as if the route did not exist.
 */
export function testRoutesEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV !== "production" && env.ENABLE_TEST_ROUTES === "true";
}

/** Returns a 404 response when test routes are disabled, otherwise null. */
export function testRouteGuard(): NextResponse | null {
  if (testRoutesEnabled()) return null;
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
