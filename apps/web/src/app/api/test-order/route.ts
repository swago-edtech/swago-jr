// apps/web/src/app/api/test-order/route.ts
import { NextResponse } from "next/server";
import { connectDB, Order, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";
import { z } from "zod";


// Only for testing - bypasses payment
const testOrderSchema = z.object({
  name: z.string(),
  age: z.string(),
  email: z.string().email(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string().regex(/^\d{6}$/),
  cart: z.array(z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
  })).min(1),
  couponCode: z.string().optional(),
  discount: z.number().optional().default(0),
});


export async function POST(req: Request) {
  // Only allow in development/test
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test orders not available in production" },
      { status: 403 }
    );
  } 


  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }


    await connectDB();
    
    const body = await req.json();
    const validation = testOrderSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }


    const orderData = validation.data;


    // Find user
    const user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }


    const { cart, discount = 0 } = orderData;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - discount;


    // Create order with "Paid" status (simulating successful payment)
    const order = await Order.create({
      phone: session.phone,
      email: orderData.email,
      name: orderData.name,
      age: orderData.age,
      address: orderData.address,
      city: orderData.city,
      state: orderData.state,
      pincode: orderData.pincode,
      status: "Paid",
      items: cart.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal,
      discount,
      total,
      
      // ✅ FIXED: Use correct snake_case field names from schema
      razorpay_payment_id: `TEST_PAY_${Date.now()}`,
      razorpay_order_id: `TEST_ORDER_${Date.now()}`,
      
      // ✅ NEW: Mark as test/frontend order
      createdVia: 'frontend',
      
      // ✅ NEW: Include coupon code if provided
      couponCode: orderData.couponCode,
    });


    // Add to user's orders
    user.orders.push(order._id);
    await user.save();


    return NextResponse.json({ 
      success: true, 
      order,
      orderId: order._id,
      message: "Test order created successfully with Paid status"
    });


  } catch (error) {
    console.error("Test order error:", error);
    return NextResponse.json(
      { error: "Failed to process test order" },
      { status: 500 }
    );
  }
}
