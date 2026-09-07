import { SignJWT } from "jose";
import { NextResponse } from "next/server";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const cookieName = "session";

export type SessionUser = {
  _id: unknown;
  phone?: string;
  email?: string;
  name?: string;
  authMethod?: string;
  wishlist?: unknown[];
  orders?: unknown[];
  cart?: unknown[];
  ambassador?: { swagoMoney?: number };
  swagoMoney?: number;
};

export function sessionPayloadForUser(user: { phone?: string; email?: string }) {
  if (user.phone) return { phone: user.phone };
  if (user.email) return { email: user.email.toLowerCase() };
  throw new Error("User has no phone or email for session");
}

export async function signStorefrontSession(user: { phone?: string; email?: string }) {
  return new SignJWT(sessionPayloadForUser(user))
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export function publicUserPayload(user: SessionUser) {
  return {
    _id: user._id,
    phone: user.phone,
    email: user.email,
    name: user.name,
    authMethod: user.authMethod,
    wishlist: user.wishlist || [],
    orders: user.orders || [],
    cart: user.cart || [],
    swagoMoney: user.ambassador?.swagoMoney || user.swagoMoney || 0,
  };
}

export function attachSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export function sanitizeAuthRedirect(raw?: string | null) {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  if (raw.startsWith("/kids")) return "/profile";
  if (raw.startsWith("/login") || raw.startsWith("/api/")) return "/";
  return raw;
}
