import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Order, User, Product } from "@swago/database";
import crypto from "crypto";
import { z } from "zod";
import { sendOrderConfirmationEmail } from "@/lib/msg91-email";
import mongoose from "mongoose";
import { isValidObjectId } from "mongoose";
import { invalidateProductCache } from "@/lib/productCache";



type CartItem = {
  id?: number;
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};



type OrderItem = {
  productId: number | string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};



// ✅ Type for order object items from database
interface OrderItemFromDb {
  productId: number | string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  _id?: string;
}



// ✅ Type for product document
interface ProductDocument {
  _id: string;
  name: string;
  slug?: string;
  stock: number;
  reservedStock?: number;
  totalSold?: number;
  save: () => Promise<void>;
  [key: string]: unknown;
}



const orderDetailsSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("A valid email is required"),
  phone: z.string().min(10, "Phone is required"),
  age: z.string().trim().min(1, "Age is required"),
  address: z.string().trim().min(3, "Address must be at least 3 characters"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  pincode: z.string().min(1, "Pincode/Postal code is required"),
  cart: z.array(z.object({
    id: z.number().optional(),
    _id: z.string().optional(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    image: z.string().optional(),
  })).min(1),
  coupon: z.object({
    code: z.string(),
    description: z.string(),
    type: z.string(),
    value: z.number(),
  }).nullable().optional(),
  discount: z.object({
    amount: z.number(),
    originalAmount: z.number(),
    finalAmount: z.number(),
    savedAmount: z.number(),
  }).nullable().optional(),
  originalAmount: z.number(),
  finalAmount: z.number(),
});



// ========================================
// ✅ UPDATED: Helper to detect hardcoded products
// ========================================
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



// ========================================
// ✅ Helper to get product by ID or slug
// ========================================
async function getProductById(id: string | number): Promise<ProductDocument | null> {
  try {
    const idString = id.toString();
    
    // Try slug first
    let product = await Product.findOne({ slug: idString });
    
    // Try MongoDB _id if valid ObjectId
    if (!product && isValidObjectId(idString)) {
      product = await Product.findOne({ _id: idString });
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



    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderDetails } = body;



    const validation = orderDetailsSchema.safeParse(orderDetails);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }



    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");



    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }



    await connectDB();
    
    // Find user by login credentials (phone OR email)
    let user = null;
    if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    } else if (session.email) {
      user = await User.findOne({ email: session.email });
    }
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }



    const existingOrder = await Order.findOne({ razorpay_payment_id });



    if (existingOrder) {
      console.log('✅ Order already created by webhook:', existingOrder._id);
      
      // Ensure userId is set (for old orders from webhook)
      if (!existingOrder.userId) {
        existingOrder.userId = new mongoose.Types.ObjectId(user._id);
        await existingOrder.save();
        console.log('✅ Added userId to existing order');
      }
      
      if (!user.orders.includes(existingOrder._id)) {
        try {
          user.orders.push(existingOrder._id);
          await user.save();
          console.log('✅ Added order to user orders list');
        } catch (linkError) {
          console.error('⚠️ Could not link existing order to user:', linkError);
        }
      }
      
      // Update phone for email-only users
      if (!user.phone && orderDetails.phone) {
        try {
          user.phone = orderDetails.phone;
          await user.save();
          console.log('✅ First order: Added phone to email-only user profile:', orderDetails.phone);
        } catch (phoneError: unknown) {
          const err = phoneError as { code?: number };
          if (err.code === 11000) {
            console.log('⚠️ Phone already in use by another user, skipping update');
          } else {
            console.error('⚠️ Error updating phone:', phoneError);
          }
        }
      }
      
      // Update email for phone-only users
      if (!user.email && orderDetails.email) {
        try {
          user.email = orderDetails.email;
          await user.save();
          console.log('✅ Updated user email');
        } catch (emailError: unknown) {
          const err = emailError as { code?: number };
          if (err.code === 11000) {
            console.log('⚠️ Email already in use by another user, skipping update');
          } else {
            console.error('⚠️ Error updating email:', emailError);
          }
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        orderId: existingOrder._id,
        orderNumber: existingOrder._id.toString().slice(-6),
        source: 'webhook'
      });
    }



    console.log('⚠️ Webhook order not found, creating via verify route (backup)');



    // ========================================
    // ✅ STOCK MANAGEMENT: Process stock reduction
    // ========================================
    console.log('🔄 Processing stock for', orderDetails.cart.length, 'items via verify route');
    
    for (const item of orderDetails.cart) {
      const productId = item._id || item.id;
      if (!productId) {
        console.log('⚠️ Skipping item with no ID:', item.name);
        continue;
      }

      // ✅ Skip hardcoded products
      if (isHardcodedProduct(productId)) {
        console.log(`⏭️ Skipping stock update for hardcoded product: ${item.name} (ID: ${productId})`);
        continue;
      }

      const product = await getProductById(productId);
      
      if (!product) {
        console.log(`⚠️ Product not found: ${item.name} (ID: ${productId})`);
        continue;
      }



      const quantity = item.quantity || 1;
      
      // Store old values for logging
      const oldStock = product.stock;
      const oldReserved = product.reservedStock || 0;
      const oldSold = product.totalSold || 0;
      
      // Reduce actual stock
      product.stock = Math.max(0, product.stock - quantity);
      
      // Release reserved stock (if any)
      product.reservedStock = Math.max(0, (product.reservedStock || 0) - quantity);
      
      // Increase total sold
      product.totalSold = (product.totalSold || 0) + quantity;
      
      await product.save();
      
      console.log(`✅ ${product.name} (verify route):`);
      console.log(`   📦 Stock: ${oldStock} → ${product.stock} (reduced by ${quantity})`);
      console.log(`   🔒 Reserved: ${oldReserved} → ${product.reservedStock}`);
      console.log(`   📊 Total Sold: ${oldSold} → ${product.totalSold}`);
      
      // ✅ Invalidate product cache
      try {
        invalidateProductCache(product.slug || '');
        invalidateProductCache(product._id.toString());
      } catch (cacheError) {
        console.error('⚠️ Cache invalidation failed (non-critical):', cacheError);
      }
    }
    
    console.log('✅ Stock updated successfully via verify route');
    // ========================================



    // Update phone for email-only users
    if (!user.phone && orderDetails.phone) {
      try {
        user.phone = orderDetails.phone;
        await user.save();
        console.log('✅ First order: Added phone to email-only user profile:', orderDetails.phone);
      } catch (phoneError: unknown) {
        const err = phoneError as { code?: number };
        if (err.code === 11000) {
          console.log('⚠️ Phone already in use by another user');
        } else {
          console.error('⚠️ Error updating phone:', phoneError);
        }
      }
    }



    // Update email for phone-only users
    if (!user.email && orderDetails.email) {
      try {
        user.email = orderDetails.email;
        await user.save();
        console.log('✅ Updated user email before order creation');
      } catch (emailError: unknown) {
        const err = emailError as { code?: number };
        if (err.code === 11000) {
          console.log('⚠️ Email already in use by another user');
        } else {
          console.error('⚠️ Error updating user email:', emailError);
        }
      }
    }



    const orderItems: OrderItem[] = orderDetails.cart.map((item: CartItem) => ({
      productId: item._id || item.id || 0,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image || '',
    }));



    const calculatedSubtotal = orderItems.reduce(
      (sum: number, item: OrderItem) => sum + (item.price * item.quantity), 
      0
    );
    
    const subtotal = orderDetails.originalAmount || calculatedSubtotal;
    const discountAmount = orderDetails.discount?.savedAmount || 0;
    const total = orderDetails.finalAmount || (subtotal - discountAmount);



    // Create order with proper ObjectId userId
    const newOrder = await Order.create({
      userId: new mongoose.Types.ObjectId(user._id),
      phone: orderDetails.phone,
      email: orderDetails.email,
      name: orderDetails.name,
      age: orderDetails.age,
      address: orderDetails.address,
      city: orderDetails.city,
      state: orderDetails.state,
      pincode: orderDetails.pincode,
      status: "Paid",
      razorpay_payment_id: razorpay_payment_id,
      razorpay_order_id: razorpay_order_id,
      items: orderItems,
      subtotal: subtotal,
      discount: discountAmount,
      total: total,
      createdVia: 'frontend',
      ...(orderDetails.coupon && {
        couponCode: orderDetails.coupon.code,
        couponDetails: orderDetails.coupon,
      }),
    });



    console.log('✅ Order created via verify route with userId:', newOrder._id);
    console.log('✅ userId type:', typeof newOrder.userId, newOrder.userId);



    try {
      user.orders.push(newOrder._id);
      await user.save();
      console.log('✅ Order linked to user');
    } catch (linkError) {
      console.error('⚠️ Could not link order to user (order still exists):', linkError);
    }



    const orderObject = newOrder.toObject();
    const orderTotal = orderObject.total || total;



    try {
      // ✅ FIXED: Proper typing instead of any
      const itemsHtml = orderObject.items.map((item: OrderItemFromDb) => `
        <tr class="item-row">
          <td class="item-name">${item.name}</td>
          <td class="item-qty">x${item.quantity}</td>
          <td class="item-price">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `).join('');



      await sendOrderConfirmationEmail({
        name: orderObject.name,
        orderNumber: orderObject._id.toString().slice(-6),
        orderDate: new Date(orderObject.createdAt).toLocaleString('en-IN'),
        email: orderObject.email,
        items: itemsHtml,
        totalAmount: orderTotal.toFixed(2),
        address: orderObject.address,
        city: orderObject.city,
        state: orderObject.state,
        pincode: orderObject.pincode,
      });
      
      console.log('✅ Email sent via verify route');
    } catch (emailError) {
      console.error('⚠️ Email failed in verify route:', emailError);
    }



    return NextResponse.json({ 
      success: true, 
      orderId: newOrder._id,
      orderNumber: orderObject._id.toString().slice(-6),
      source: 'frontend'
    });



  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
