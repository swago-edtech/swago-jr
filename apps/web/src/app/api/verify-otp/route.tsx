// apps/web/src/app/api/verify-otp/route.tsx
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { connectDB, User, KidProfile } from "@swago/database";
import { z } from "zod";
import { formatPhoneForStorage } from "@/lib/msg91";

// ========================================
// ✅ UPDATED: Cart item with full product details
// ========================================
interface CartItem {
  productId: string | number;
  quantity: number;
  price: number;
  name: string;
  image: string;
  images?: string[]; // ✅ NEW
  addedAt?: Date;
}

// ✅ NORMALIZE HELPER: Handle qty/quantity and id/productId mismatches
type CartInput = {
  productId?: string | number;
  id?: string | number;
  _id?: { toString?: () => string };
  quantity?: number;
  qty?: number;
  price?: number;
  unitPrice?: number;
  name?: string;
  image?: string;
  images?: string[];
  addedAt?: string | Date;
};


function normalizeCartItem(item: CartInput): CartItem | null {
  const id = item?.productId || item?.id || item?._id?.toString?.() || null;
  const qty = item?.quantity ?? item?.qty ?? 0;
  const price = item?.price ?? item?.unitPrice ?? 0;
  const name = item?.name || '';
  const image = item?.image || item?.images?.[0] || '';

  if (!id || qty <= 0) return null;

  return {
    productId: String(id),
    quantity: Number(qty),
    price: Number(price),
    name,
    image,
    images: item?.images || (image ? [image] : []), // ✅ NEW
    addedAt: item?.addedAt ? new Date(item.addedAt) : new Date()
  };
}

// ✅ UPDATED: Merge carts with normalization (handles qty/quantity mismatch)
function mergeCartItems(dbCart: CartInput[], localCart: CartInput[]): CartItem[] {
  console.log('📦 Starting cart merge...');

  // Normalize both carts first
  const dbItems = dbCart.map(normalizeCartItem).filter(Boolean) as CartItem[];
  const localItems = localCart.map(normalizeCartItem).filter(Boolean) as CartItem[];

  console.log('  DB Cart:', JSON.stringify(dbItems.map(i => ({ id: i.productId, qty: i.quantity, price: i.price }))));
  console.log('  Local Cart:', JSON.stringify(localItems.map(i => ({ id: i.productId, qty: i.quantity, price: i.price }))));

  const merged = new Map<string, CartItem>();

  // Add DB cart items first
  for (const item of dbItems) {
    const key = item.productId.toString();
    merged.set(key, { ...item });
  }

  // Merge with local cart (keep higher quantity)
  for (const item of localItems) {
    const key = item.productId.toString();
    const existing = merged.get(key);

    if (existing) {
      // Product exists in both carts - keep higher quantity
      if (item.quantity > existing.quantity) {
        console.log(`  🔄 Product ${key}: DB qty ${existing.quantity} → Local qty ${item.quantity} (higher)`);
        merged.set(key, {
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          image: item.image,
          images: item.images, // ✅ NEW
          addedAt: item.addedAt || new Date()
        });
      } else {
        console.log(`  ✓ Product ${key}: Keeping DB qty ${existing.quantity} (higher than local ${item.quantity})`);
      }
    } else {
      // New item from local cart
      console.log(`  ➕ Product ${key}: Adding from local cart (qty ${item.quantity})`);
      merged.set(key, {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        image: item.image,
        images: item.images, // ✅ NEW
        addedAt: item.addedAt || new Date()
      });
    }
  }

  const result = Array.from(merged.values()).filter(i => i && i.productId && i.quantity > 0);
  console.log('  Final Merged Cart:', JSON.stringify(result.map(i => ({ id: i.productId, qty: i.quantity, price: i.price }))));

  return result;
}

// Two validation schemas for different flows
const directOtpSchema = z.object({
  phone: z.string().min(10, { message: "Phone number is required" }),
  otp: z.string().length(6, { message: "OTP must be 6 digits" }),
  isDemo: z.boolean().optional(),
});

// ✅ UPDATED: Support full cart details in localCart
const widgetSchema = z.object({
  accessToken: z.string().min(1, { message: "Access token is required" }),
  identifier: z.string().min(1, { message: "Phone or email is required" }),
  authMethod: z.enum(['phone', 'email']),
  name: z.string().optional(),
  email: z.string().email().optional(),
  localCart: z.array(z.object({
    productId: z.union([z.string(), z.number()]),
    quantity: z.number(),
    price: z.number(),
    name: z.string(),
    image: z.string(),
    addedAt: z.string().optional(),
  })).optional(),
});

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const cookieName = "session";

// Demo credentials
const DEMO_PHONE = "+919876543210";
const DEMO_OTP = "123456";

// Verify access token with MSG91
async function verifyAccessToken(accessToken: string): Promise<{ success: boolean; error?: string }> {
  const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;

  if (!MSG91_AUTH_KEY) {
    return { success: false, error: "MSG91_AUTH_KEY not configured" };
  }

  try {
    const response = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authkey: MSG91_AUTH_KEY,
        "access-token": accessToken,
      }),
    });

    const data = await response.json();

    console.log("📱 MSG91 Token Verification Response:", JSON.stringify(data, null, 2));

    if (response.ok && data.type === "success") {
      console.log("✅ Access token verified by MSG91");
      return { success: true };
    } else {
      console.error("❌ MSG91 token verification failed:", data);
      return { success: false, error: data.message || "Invalid access token" };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ MSG91 token verification error:", errorMessage);
    return { success: false, error: "We couldn't verify your OTP. Please try again." };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if this is widget flow (has accessToken) or direct flow (has otp)
    const isWidgetFlow = "accessToken" in body;

    if (isWidgetFlow) {
      // Widget flow: Verify access token
      const validation = widgetSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.format() },
          { status: 400 }
        );
      }

      const { accessToken, identifier, authMethod, name, email: secondaryEmail, localCart } = validation.data;

      console.log(`🔐 Widget flow: Verifying ${authMethod} for`, identifier);

      // Verify access token with MSG91
      const result = await verifyAccessToken(accessToken);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || "Invalid access token" },
          { status: 401 }
        );
      }

      // Token verified - proceed with user creation/login
      await connectDB();

      // ✅ Normalize local cart items
      const localCartItems: CartItem[] = (localCart || [])
        .map(normalizeCartItem)
        .filter(Boolean) as CartItem[];

      console.log(`🛒 Local cart items: ${localCartItems.length}`);

      // ✅ Find user by phone OR email based on authMethod
      let user;
      let isNewUser = false;

      if (authMethod === 'phone') {
        const formattedPhone = formatPhoneForStorage(identifier);
        user = await User.findOne({ phone: formattedPhone });

        if (!user) {
          // ✅ NEW USER: Create with phone + optional email + local cart (with full details)
          user = await User.create({
            phone: formattedPhone,
            authMethod: 'phone',
            cart: localCartItems,
            ...(name && { name }),
            ...(secondaryEmail && { email: secondaryEmail })
          });
          isNewUser = true;
          console.log("✅ New phone user created:", formattedPhone, "Cart:", localCartItems.length, "items");
        } else {
          console.log("✅ Existing phone user logged in:", formattedPhone);
          console.log("   DB Cart before merge:", user.cart?.length || 0, "items");
        }
      } else {
        // authMethod === 'email'
        user = await User.findOne({ email: identifier });

        if (!user) {
          // ✅ NEW USER: Create with email + local cart (with full details)
          user = await User.create({
            email: identifier,
            authMethod: 'email',
            cart: localCartItems,
            ...(name && { name })
          });
          isNewUser = true;
          console.log("✅ New email user created:", identifier, "Cart:", localCartItems.length, "items");
        } else {
          console.log("✅ Existing email user logged in:", identifier);
          console.log("   DB Cart before merge:", user.cart?.length || 0, "items");
        }
      }

      // ✅ CART MERGE: For existing users, merge local + DB carts (with normalization)
      if (!isNewUser && localCartItems.length > 0) {
        const dbCart = user.cart || [];
        const mergedCart = mergeCartItems(dbCart, localCartItems);

        console.log(`🔀 Cart merge complete: DB(${dbCart.length}) + Local(${localCartItems.length}) = Merged(${mergedCart.length})`);

        // Update user cart atomically
        if (authMethod === 'phone') {
          user = await User.findOneAndUpdate(
            { phone: user.phone },
            { $set: { cart: mergedCart } },
            { new: true }
          );
        } else {
          user = await User.findOneAndUpdate(
            { email: user.email },
            { $set: { cart: mergedCart } },
            { new: true }
          );
        }

        console.log("✅ Merged cart saved to database");
      } else if (!isNewUser && localCartItems.length === 0) {
        console.log("ℹ️ No local cart to merge, keeping DB cart");
      }

      // ✅ Create JWT with appropriate identifier
      const jwtPayload = authMethod === 'phone'
        ? { phone: user.phone }
        : { email: user.email };

      const token = await new SignJWT(jwtPayload)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);

      // ✅ NEW: Count kid profiles to determine if user should go to onboarding
      const kidProfileCount = await KidProfile.countDocuments({ parentId: user._id });

      // ✅ Create response - cart already has full details, no populate needed
      const response = NextResponse.json({
        success: true,
        user: {
          _id: user._id,
          phone: user.phone,
          email: user.email,
          name: user.name,
          authMethod: user.authMethod,
          wishlist: user.wishlist || [],
          orders: user.orders || [],
          cart: user.cart || [],
        },
        hasKidProfiles: kidProfileCount > 0
      });

      // Set session cookie
      const isProduction = process.env.NODE_ENV === "production";

      response.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    } else {
      // Direct flow: Demo mode only
      const validation = directOtpSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.format() },
          { status: 400 }
        );
      }

      const { phone, otp, isDemo } = validation.data;
      const formattedPhone = formatPhoneForStorage(phone);

      if (!isDemo || formattedPhone !== DEMO_PHONE) {
        return NextResponse.json(
          { success: false, error: "Direct OTP verification disabled. Use widget flow." },
          { status: 403 }
        );
      }

      if (otp !== DEMO_OTP) {
        return NextResponse.json(
          { success: false, error: "Invalid demo OTP. Use 123456" },
          { status: 401 }
        );
      }

      console.log("🎭 Demo mode: OTP verified for", DEMO_PHONE);

      await connectDB();
      let user = await User.findOne({ phone: formattedPhone });

      if (!user) {
        user = await User.create({
          phone: formattedPhone,
          authMethod: 'phone'
        });
        console.log("✅ New demo user created:", formattedPhone);
      } else {
        console.log("✅ Demo user logged in:", formattedPhone);
      }

      const token = await new SignJWT({ phone: formattedPhone })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);

      // ✅ Return cart directly (already has full details)
      const response = NextResponse.json({
        success: true,
        user: {
          _id: user._id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          authMethod: user.authMethod,
          wishlist: user.wishlist || [],
          orders: user.orders || [],
          cart: user.cart || [],
        },
      });

      const isProduction = process.env.NODE_ENV === "production";

      response.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }
  } catch (err: unknown) {
    console.error("❌ OTP verification error:", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong while verifying your account. Please try again later." },
      { status: 500 }
    );
  }
}
