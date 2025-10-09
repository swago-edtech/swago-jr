import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const cookieName = "session";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Logged out" });

  // ✅ Clear cookie
  const cookieStore = await cookies();
  cookieStore.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0, // expires immediately
  });

  return res;
}

//push