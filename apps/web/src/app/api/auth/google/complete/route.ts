import { NextResponse } from "next/server";
import { connectDB, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";
import { cartFromUnknown } from "@/lib/google-account";
import { mergeCartItems } from "@/lib/cart-merge";
import { publicUserPayload } from "@/lib/storefront-session";

export async function POST(request: Request) {
  try {
    const session = await getLoginSession();
    if (!session?.phone && !session?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const localCart = cartFromUnknown(body.localCart);

    await connectDB();
    const query = session.phone ? { phone: session.phone } : { email: session.email };
    let user = await User.findOne(query);

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 401 });
    }

    if (localCart.length > 0) {
      user.cart = mergeCartItems(user.cart || [], localCart);
      await user.save();
    }

    return NextResponse.json({
      success: true,
      user: publicUserPayload(user),
    });
  } catch (error) {
    console.error("Google cart complete failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not finish Google sign-in" },
      { status: 500 }
    );
  }
}
