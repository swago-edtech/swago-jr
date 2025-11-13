import { NextRequest, NextResponse } from "next/server";
import { connectDB, KidProfile, ProductCode, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";
import { products } from "@swago/utils";

// POST - Unlock content with a product code
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getLoginSession();
    const { id } = await params; // Await params in Next.js 15

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.isDemo) {
      return NextResponse.json(
        { error: "Demo users cannot unlock content" },
        { status: 403 }
      );
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Product code is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get user ID from phone
    const user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the kid profile and verify ownership
    const kidProfile = await KidProfile.findOne({
      _id: id,
      userId: user._id,
    });

    if (!kidProfile) {
      return NextResponse.json(
        { error: "Kid profile not found or unauthorized" },
        { status: 404 }
      );
    }

    // Find the product code
    const productCode = await ProductCode.findOne({
      code: code.toUpperCase().trim(),
    });

    if (!productCode) {
      return NextResponse.json(
        { error: "Invalid product code" },
        { status: 400 }
      );
    }

    // Check if code is already redeemed
    if (productCode.isRedeemed) {
      return NextResponse.json(
        { error: "This code has already been redeemed" },
        { status: 400 }
      );
    }

    // Check if this product is already unlocked for this kid
    const alreadyUnlocked = kidProfile.unlockedProducts.some(
        (p: { productId: number }) => p.productId === productCode.productId
    );

    if (alreadyUnlocked) {
      return NextResponse.json(
        { error: "This product is already unlocked for this profile" },
        { status: 400 }
      );
    }

    // Get product name from utils
    const product = products.find(p => p.id === productCode.productId);
    const productName = product?.name || `Product ${productCode.productId}`;

    // Update the product code as redeemed
    productCode.isRedeemed = true;
    productCode.redeemedAt = new Date();
    productCode.redeemedBy = kidProfile._id;
    await productCode.save();

    // Add product to kid's unlocked products
    kidProfile.unlockedProducts.push({
      productId: productCode.productId,
      code: productCode.code,
      unlockedAt: new Date(),
      orderId: productCode.orderId,
    });
    await kidProfile.save();

    return NextResponse.json({
      success: true,
      message: `Successfully unlocked ${productName}!`,
      productId: productCode.productId,
      productName: productName,
    });
  } catch (error) {
    console.error("Unlock error:", error);
    return NextResponse.json(
      { error: "Failed to unlock content" },
      { status: 500 }
    );
  }
}