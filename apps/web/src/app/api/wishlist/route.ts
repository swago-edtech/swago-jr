import { NextResponse } from "next/server";
import { connectDB, User, Product } from "@swago/database";
import { getLoginSession } from "@/lib/auth";
import { z } from "zod";
import mongoose from "mongoose";

// ✅ Type for MongoDB product document
interface DbProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  ageCategory: string;
  coreElements: string[];
  boxContents: string;
  benefits: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  slug: string;
  [key: string]: unknown;
}

// ✅ UPDATED: Schema accepts both number and string
const productIdSchema = z.object({
  productId: z.union([z.number(), z.string()]),
});

/**
 * POST handler to add an item to the wishlist
 */
export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const validation = productIdSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }
    const { productId } = validation.data;

    await connectDB();

    // Find user by phone or email
    let user = null;
    if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    } else if (session.email) {
      user = await User.findOne({ email: session.email });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Check if already in wishlist (handle both types)
    const wishlist = user.wishlist || [];
    const alreadyExists = wishlist.some((id: number | string) => {
      if (typeof id === typeof productId) {
        return id === productId;
      }
      // Cross-type comparison
      return id.toString() === productId.toString();
    });

    if (alreadyExists) {
      console.log('⚠️ Product already in wishlist:', productId);
      return NextResponse.json({
        success: true,
        wishlist: user.wishlist,
        message: 'Already in wishlist'
      });
    }

    // ✅ Use $addToSet to add the ID (works with Mixed type)
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $addToSet: { wishlist: productId } },
      { new: true }
    );

    console.log('✅ Added to wishlist:', productId, 'Type:', typeof productId);

    return NextResponse.json({ success: true, wishlist: updatedUser?.wishlist });

  } catch (error) {
    console.error("Failed to add to wishlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE handler to remove an item from the wishlist
 */
export async function DELETE(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const validation = productIdSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }
    const { productId } = validation.data;

    await connectDB();

    // Find user by phone or email
    let user = null;
    if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    } else if (session.email) {
      user = await User.findOne({ email: session.email });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Use $pull to remove the ID (works with Mixed type)
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $pull: { wishlist: productId } },
      { new: true }
    );

    console.log('✅ Removed from wishlist:', productId, 'Type:', typeof productId);

    return NextResponse.json({ success: true, wishlist: updatedUser?.wishlist });

  } catch (error) {
    console.error("Failed to remove from wishlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * GET handler to fetch the user's wishlist items
 */
export async function GET() {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    // Find user by phone or email
    let user = null;
    if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    } else if (session.email) {
      user = await User.findOne({ email: session.email });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the array of product IDs (can be numbers or strings)
    const wishlistIds = user.wishlist || [];

    if (wishlistIds.length === 0) {
      return NextResponse.json([]);
    }

    // Extract MongoDB _id strings from wishlist (filter out any numeric IDs if they exist)
    const mongoIds: string[] = [];

    wishlistIds.forEach((id: number | string) => {
      if (typeof id === 'string') {
        mongoIds.push(id);
      }
    });

    console.log('📋 Wishlist IDs:', { mongoIds });

    // Fetch products from database only
    const dbProducts = mongoIds.length > 0
      ? await Product.find({
        _id: { $in: mongoIds },
        isActive: true
      }).lean<DbProduct[]>()
      : [];

    // Return DB products
    const allWishlistProducts = dbProducts.map(p => ({
      ...p,
      _id: p._id.toString(),
      ageCategory: p.ageCategory,
      coreElements: p.coreElements
    }));

    console.log('✅ Returning wishlist:', allWishlistProducts.length, 'products');

    return NextResponse.json(allWishlistProducts);

  } catch (error) {
    console.error("Failed to fetch wishlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
