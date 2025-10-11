import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";

export async function GET() {
  try {
    // ✅ Ensure user is authenticated
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ✅ Return only the public key (safe to expose)
    return NextResponse.json({
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error fetching Razorpay config:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}