import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getLoginSession } from "@/lib/auth";
import User from "@/models/User";
import { products } from "@/lib/products"; // Import static products
import { z } from "zod";

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

    await connectDB();

    // Use $addToSet to add the ID to the array if it doesn't already exist
    const updatedUser = await User.findOneAndUpdate(
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
  
      await connectDB();
  
      // Use $pull to remove the ID from the array
      const updatedUser = await User.findOneAndUpdate(
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

    await connectDB();
    const user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the array of product IDs from the user's wishlist
    const wishlistIds = user.wishlist || [];

    // Filter the static products array to find the full product details
    const wishlistProducts = products.filter(product => wishlistIds.includes(product.id));
    
    return NextResponse.json(wishlistProducts);

  } catch (error) {
    console.error("Failed to fetch wishlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

//push