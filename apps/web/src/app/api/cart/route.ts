// apps/web/src/app/api/cart/route.ts
import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, User, Product } from "@swago/database";
import { isValidObjectId } from "mongoose";
import { products as hardcodedProducts } from "@swago/utils";

// ✅ UPDATED: Cart item now includes full product details
interface CartItem {
  productId: string | number;
  quantity: number;
  price: number;      // ✅ NEW
  name: string;       // ✅ NEW
  image: string;      // ✅ NEW
  addedAt?: Date;
}

interface ProductDocument {
  _id: string;
  stock: number;
  reservedStock?: number;
  isActive: boolean;
  price: number;
  name: string;
  images: string[];
}

// ✅ NEW: Helper to get full product details (DB or hardcoded)
async function getFullProductDetails(productId: string | number): Promise<{
  price: number;
  name: string;
  image: string;
  stock?: number;
} | null> {
  const idString = productId.toString();
  
  // Check if it's a hardcoded product (numeric ID 1-100)
  const numericId = parseInt(idString);
  if (!isNaN(numericId) && numericId > 0 && numericId <= 100) {
    const hardcoded = hardcodedProducts.find(p => p.id === numericId);
    if (hardcoded) {
      return {
        price: hardcoded.price,
        name: hardcoded.name,
        image: hardcoded.images[0] || '/images/placeholder.png',  // ✅ FIXED: Use images array
        stock: undefined  // ✅ FIXED: Hardcoded products don't track stock
      };
    }
  }
  
  // Try DB product
  try {
    let product = await Product.findOne({ slug: idString, isActive: true });
    
    if (!product && isValidObjectId(idString)) {
      product = await Product.findOne({ _id: idString, isActive: true });
    }
    
    if (product) {
      return {
        price: product.price,
        name: product.name,
        image: product.images?.[0] || '/images/placeholder.png',
        stock: product.stock
      };
    }
  } catch (error) {
    console.error('Error fetching product:', error);
  }
  
  return null;
}

// Helper to get product by ID (for stock check)
async function getProductById(id: string | number): Promise<ProductDocument | null> {
  try {
    const idString = id.toString();
    
    // Try slug first
    let product = await Product.findOne({ slug: idString, isActive: true });
    
    // Try MongoDB _id if valid ObjectId
    if (!product && isValidObjectId(idString)) {
      product = await Product.findOne({ _id: idString, isActive: true });
    }
    
    return product as ProductDocument | null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Helper to check if it's a hardcoded product
function isHardcodedProduct(productId: string | number): boolean {
  const idString = productId.toString();
  const numericId = parseInt(idString);
  return !isNaN(numericId) && numericId > 0 && numericId <= 100;
}

// ========================================
// GET: Fetch user's cart from database
// ========================================
export async function GET() {
  try {
    const session = await getLoginSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();

    // Find user by phone OR email
    let user;
    if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    } else if (session.email) {
      user = await User.findOne({ email: session.email });
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cart: user.cart || []
    });

  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// ========================================
// POST: Update/sync entire cart to database
// ========================================
export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { cart } = await req.json();

    if (!Array.isArray(cart)) {
      return NextResponse.json(
        { error: "Cart must be an array" },
        { status: 400 }
      );
    }

    await connectDB();

    // ✅ NEW: Enrich cart items with full product details + validate stock
    const enrichedCart: CartItem[] = [];
    const stockErrors: string[] = [];

    for (const item of cart) {
      const productId = item.productId;

      // Get full product details
      const productDetails = await getFullProductDetails(productId);
      
      if (!productDetails) {
        console.warn(`⚠️ Product ${productId} not found, skipping`);
        continue;
      }

      // Stock validation for database products
      if (!isHardcodedProduct(productId)) {
        const product = await getProductById(productId);
        
        if (product) {
          const availableStock = Math.max(0, product.stock - (product.reservedStock || 0));
          
          if (availableStock === 0) {
            stockErrors.push(`${productDetails.name} is out of stock`);
          } else if (item.quantity > availableStock) {
            stockErrors.push(`${productDetails.name}: Only ${availableStock} available`);
          }
        }
      }

      // Add enriched cart item
      enrichedCart.push({
        productId: item.productId,
        quantity: item.quantity,
        price: productDetails.price,      // ✅ Captured at add-to-cart
        name: productDetails.name,        // ✅ Captured at add-to-cart
        image: productDetails.image,      // ✅ Captured at add-to-cart
        addedAt: item.addedAt || new Date()
      });
    }

    if (stockErrors.length > 0) {
      console.log('⚠️ Cart has stock issues:', stockErrors);
    }

    // ✅ Save enriched cart to database
    let updatedUser;
    if (session.phone) {
      updatedUser = await User.findOneAndUpdate(
        { phone: session.phone },
        { $set: { cart: enrichedCart } },
        { new: true }
      );
    } else if (session.email) {
      updatedUser = await User.findOneAndUpdate(
        { email: session.email },
        { $set: { cart: enrichedCart } },
        { new: true }
      );
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log('✅ Cart synced to database:', enrichedCart.length, 'items');

    return NextResponse.json({
      success: true,
      cart: updatedUser.cart,
      stockErrors: stockErrors.length > 0 ? stockErrors : undefined
    });

  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE: Remove specific item from cart
// ========================================
export async function DELETE(req: Request) {
  try {
    const session = await getLoginSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const productIdString = productId.toString();

    // ✅ FIXED: Use atomic update to avoid version conflicts
    let updatedUser;
    if (session.phone) {
      updatedUser = await User.findOneAndUpdate(
        { phone: session.phone },
        { $pull: { cart: { productId: productIdString } } },
        { new: true }
      );
    } else if (session.email) {
      updatedUser = await User.findOneAndUpdate(
        { email: session.email },
        { $pull: { cart: { productId: productIdString } } },
        { new: true }
      );
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log('✅ Item removed from cart:', productId);

    return NextResponse.json({
      success: true,
      cart: updatedUser.cart
    });

  } catch (error) {
    console.error("Error removing cart item:", error);
    return NextResponse.json(
      { error: "Failed to remove item" },
      { status: 500 }
    );
  }
}
