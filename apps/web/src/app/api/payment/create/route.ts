import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Product } from "@swago/database";
import { isValidObjectId } from "mongoose";


// ✅ Type definitions
interface ProductDocument {
  _id: string;
  name: string;
  slug: string;
  stock: number;
  reservedStock?: number;
  isActive: boolean;
  save: () => Promise<void>;
  [key: string]: unknown;
}


interface CartItem {
  _id?: string;
  id?: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  images?: string[];
}


// ✅ UPDATED: Helper to detect hardcoded products
function isHardcodedProduct(productId: string | number | undefined): boolean {
  if (!productId) return false;
  
  // Handle numeric IDs (1, 2, 3...)
  if (typeof productId === 'number') {
    return productId >= 1 && productId <= 100;
  }
  
  // Handle string IDs
  const idString = productId.toString();
  
  // Check for "hardcoded-X" format
  if (idString.startsWith('hardcoded-')) {
    const numericPart = parseInt(idString.replace('hardcoded-', ''), 10);
    return !isNaN(numericPart) && numericPart >= 1 && numericPart <= 100;
  }
  
  // Check for pure numeric strings ("1", "2", "3"...)
  const numericId = Number(idString);
  return !isNaN(numericId) && numericId >= 1 && numericId <= 100;
}


// Helper to get product by ID or slug
async function getProductById(id: string): Promise<ProductDocument | null> {
  try {
    // Try slug first
    let product = await Product.findOne({ slug: id, isActive: true });
    
    // Try MongoDB _id if valid ObjectId
    if (!product && isValidObjectId(id)) {
      product = await Product.findOne({ _id: id, isActive: true });
    }
    
    return product as ProductDocument | null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}


export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }


    const { totalAmount, orderDetails } = await req.json();
    
    if (!totalAmount || typeof totalAmount !== "number") {
      return NextResponse.json({ error: "A valid total amount is required" }, { status: 400 });
    }


    if (!orderDetails?.cart || !Array.isArray(orderDetails.cart) || orderDetails.cart.length === 0) {
      return NextResponse.json({ error: "Cart is required" }, { status: 400 });
    }


    // ========================================
    // ✅ STOCK VALIDATION & RESERVATION
    // ========================================
    console.log('🔍 Starting stock validation for', orderDetails.cart.length, 'items');
    
    await connectDB();
    
    const stockErrors: string[] = [];
    const reservations: Array<{ product: ProductDocument; quantity: number }> = [];


    // Step 1: Validate all items have sufficient stock
    for (const item of orderDetails.cart) {
      const productId = item._id || item.id?.toString();
      
      // ✅ DEBUG LOGGING
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 Item:', item.name);
      console.log('   item.id:', item.id, '(type:', typeof item.id, ')');
      console.log('   item._id:', item._id, '(type:', typeof item._id, ')');
      console.log('   productId (selected):', productId, '(type:', typeof productId, ')');
      console.log('   isHardcodedProduct?', isHardcodedProduct(productId));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (!productId) {
        stockErrors.push(`Invalid product ID for ${item.name}`);
        continue;
      }


      // ✅ NEW: Skip hardcoded products (always available)
      if (isHardcodedProduct(productId)) {
        console.log(`⏭️ Skipping stock check for hardcoded product: ${item.name} (ID: ${productId})`);
        continue; // No stock management needed
      }


      // Database products - check stock
      const product = await getProductById(productId);
      
      if (!product) {
        stockErrors.push(`${item.name} is no longer available`);
        continue;
      }


      const availableStock = Math.max(0, product.stock - (product.reservedStock || 0));
      
      console.log(`📦 ${product.name}: Stock=${product.stock}, Reserved=${product.reservedStock}, Available=${availableStock}, Requested=${item.quantity}`);
      
      if (availableStock === 0) {
        stockErrors.push(`${item.name} is out of stock`);
      } else if (item.quantity > availableStock) {
        stockErrors.push(`${item.name}: Only ${availableStock} available (you requested ${item.quantity})`);
      } else {
        // Stock is sufficient - prepare for reservation
        reservations.push({ product, quantity: item.quantity });
      }
    }


    // If any stock errors, don't proceed
    if (stockErrors.length > 0) {
      console.log('❌ Stock validation failed:', stockErrors);
      return NextResponse.json({ 
        error: "Stock unavailable",
        stockErrors: stockErrors,
        details: stockErrors.join('; ')
      }, { status: 400 });
    }


    // Step 2: Reserve stock for all items (only DB products)
    console.log('✅ Stock validation passed. Reserving stock...');
    
    for (const { product, quantity } of reservations) {
      product.reservedStock = (product.reservedStock || 0) + quantity;
      await product.save();
      console.log(`🔒 Reserved ${quantity} units of ${product.name} (total reserved: ${product.reservedStock})`);
    }


    console.log('✅ Stock reserved successfully for all items');
    // ========================================


    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay credentials missing");
      
      // Rollback reservations
      console.log('⚠️ Razorpay config missing, rolling back reservations...');
      for (const { product, quantity } of reservations) {
        product.reservedStock = Math.max(0, (product.reservedStock || 0) - quantity);
        await product.save();
      }
      
      return NextResponse.json({ 
        error: "Payment gateway not configured" 
      }, { status: 500 });
    }


    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });


    // Prepare cart items for notes
    const cartItemsJson = JSON.stringify(
      orderDetails?.cart?.map((item: CartItem) => ({
        id: item.id,
        _id: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || item.images?.[0] || '',
      })) || []
    );


    // Prepare coupon details if exists
    const couponDetailsJson = orderDetails?.coupon 
      ? JSON.stringify(orderDetails.coupon) 
      : '';


    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        // Login credentials (for user lookup)
        loginPhone: session.phone || "",
        loginEmail: session.email || "",
        
        // Delivery details (from checkout form)
        phone: orderDetails?.phone || "",
        email: orderDetails?.email || "",
        name: orderDetails?.name || "",
        age: orderDetails?.age || "",
        address: orderDetails?.address || "",
        city: orderDetails?.city || "",
        state: orderDetails?.state || "",
        pincode: orderDetails?.pincode || "",
        
        // Order details
        items: cartItemsJson,
        subtotal: orderDetails?.originalAmount?.toString() || "0",
        discount: orderDetails?.discount?.savedAmount?.toString() || "0",
        couponDetails: couponDetailsJson,
        
        // Quick reference
        items_count: orderDetails?.cart?.length?.toString() || "0",
        has_discount: orderDetails?.discount ? "yes" : "no",
        coupon_code: orderDetails?.coupon?.code || "",
        
        // Stock reservation flag
        stock_reserved: reservations.length > 0 ? "true" : "false", // ✅ Only true if DB products reserved
        reservation_timestamp: Date.now().toString(),
      }
    };


    console.log("Creating Razorpay order with stock reserved");


    try {
      const order = await razorpay.orders.create(options);
      console.log("✅ Razorpay order created:", order.id);
      return NextResponse.json(order);
    } catch (razorpayError) {
      // Razorpay order creation failed - rollback reservations
      console.error("❌ Razorpay order creation failed, rolling back stock...");
      
      for (const { product, quantity } of reservations) {
        product.reservedStock = Math.max(0, (product.reservedStock || 0) - quantity);
        await product.save();
        console.log(`🔓 Released ${quantity} units of ${product.name}`);
      }
      
      throw razorpayError;
    }


  } catch (error: unknown) {
    console.error("Payment creation error - Full error:", error);
    
    let errorMessage = "Failed to create payment order";
    let errorDetails = "";
    
    if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
      errorDetails = error.stack || "";
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    
    console.error("Error message:", errorMessage);
    console.error("Error details:", errorDetails);
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }, { status: 500 });
  }
}
