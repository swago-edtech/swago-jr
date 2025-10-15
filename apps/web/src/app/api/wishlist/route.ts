import { NextResponse } from "next/server";
import { connectDB, User } from "@swago/database"; // ✅ Updated to shared package
import { getLoginSession } from "@/lib/auth";
import { products } from "@swago/utils"; // ✅ Updated to shared package
import { z } from "zod";
// Removed: import connectDB from "@/lib/db";
// Removed: import User from "@/models/User";
// Removed: import { products } from "@/lib/products";

// Schema for validating the product ID
const productIdSchema = z.object({
  productId: z.number(),
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

    await connectDB(); // ✅ Now using shared package

    // Use $addToSet to add the ID to the array if it doesn't already exist
    const updatedUser = await User.findOneAndUpdate( // ✅ Now using shared package
      { phone: session.phone },
      { $addToSet: { wishlist: productId } },
      { new: true } // Return the updated document
    );

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
  
      await connectDB(); // ✅ Now using shared package
  
      // Use $pull to remove the ID from the array
      const updatedUser = await User.findOneAndUpdate( // ✅ Now using shared package
        { phone: session.phone },
        { $pull: { wishlist: productId } },
        { new: true }
      );
  
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

    await connectDB(); // ✅ Now using shared package
    const user = await User.findOne({ phone: session.phone }); // ✅ Now using shared package
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the array of product IDs from the user's wishlist
    const wishlistIds = user.wishlist || [];

    // Filter the static products array to find the full product details
    const wishlistProducts = products.filter(product => wishlistIds.includes(product.id)); // ✅ Now using shared package
    
    return NextResponse.json(wishlistProducts);

  } catch (error) {
    console.error("Failed to fetch wishlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}