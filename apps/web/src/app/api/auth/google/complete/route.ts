import { NextResponse } from "next/server";
import { connectDB, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";
import { cartFromUnknown } from "@/lib/google-account";
import { mergeCartItems } from "@/lib/cart-merge";
import { publicUserPayload } from "@/lib/storefront-session";
import { buildUserAcquisitionFields } from "@/lib/order-attribution";

export async function POST(request: Request) {
  try {
    const session = await getLoginSession();
    if (!session?.phone && !session?.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

const body = await request.json().catch(() => ({}));
    const localCart = cartFromUnknown(body.localCart);
    const attribution = body.attribution;

    await connectDB();
    const query = session.phone ? { phone: session.phone } : { email: session.email };
    let user = await User.findOne(query);

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 401 });
    }

    let dirty = false;

    // Stamp acquisition only once (new Google users may be created in callback without UTMs)
    if (!user.acquisition?.source && !user.acquisition?.content && !user.acquisition?.creatorId) {
      const acquisitionFields = buildUserAcquisitionFields(attribution, "google");
      if (acquisitionFields.acquisition) {
        user.acquisition = acquisitionFields.acquisition as any;
        dirty = true;
      }
    }

    if (localCart.length > 0) {
      user.cart = mergeCartItems(user.cart || [], localCart);
      dirty = true;
    }

    if (user.cart?.length) {
      user.cart = user.cart.filter(
        (item: any) => item.productId && item.name && item.price != null && item.image
      );
      dirty = true;
    }

    if (dirty) await user.save();

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
