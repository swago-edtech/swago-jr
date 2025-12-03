import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Order, User } from "@swago/database";
import { z } from "zod";

const orderSchema = z.object({
  name: z.string().trim().regex(/^[a-zA-Z\s]+$/, { message: "Name can only contain letters and spaces." }),
  age: z.string().trim().min(1, { message: "Age is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  phone: z.string().min(10, { message: "Phone is required" }),
  address: z.string().trim().min(3, { message: "Address must be at least 3 characters long." }),
  city: z.string().trim().min(2, { message: "City is required" }),
  state: z.string().trim().min(2, { message: "State is required" }),
  pincode: z.string().min(1, { message: "Pincode/Postal code is required" }),
  cart: z.array(z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    image: z.string().optional(),
  })).min(1, { message: "Cart cannot be empty" }),
  discount: z.number().optional().default(0),
  couponCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();

    const validation = orderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }
    
    const { name, age, email, phone, address, city, state, pincode, cart, discount } = validation.data;

    await connectDB();
    
    // ✅ Find user by phone OR email
    let user = null;
    if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    } else if (session.email) {
      user = await User.findOne({ email: session.email });
    }
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - (discount || 0);

    const orderItems = cart.map((item) => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image || '',
    }));

    // ✅ Create order with userId
    const order = await Order.create({
      userId: user._id,  // ✅ Link to user
      phone: phone,
      email,
      name,
      age,
      address,
      city,
      state,
      pincode,
      status: "Pending",
      items: orderItems,
      subtotal,
      discount: discount || 0,
      total,
    });

    user.orders.push(order._id);
    await user.save();

    return NextResponse.json({ success: true, order, orderId: order._id });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 🔥 OPTIMIZED: Fetch by userId with fallback for old orders
export async function GET() {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    
    // ✅ Find user by login credentials (phone OR email)
    let user = null;
    if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    } else if (session.email) {
      user = await User.findOne({ email: session.email });
    }
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // ✅ Try fetching by userId first (new orders)
    let orders = await Order.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();
    
    console.log(`✅ Found ${orders.length} orders by userId`);
    
    // ✅ Fallback: Fetch old orders by phone/email (orders created before userId field)
    if (orders.length < 15) {
      const queryConditions = [];
      
      if (user.phone) {
        queryConditions.push({ phone: user.phone });
      }
      
      if (user.email) {
        queryConditions.push({ email: user.email });
      }
      
      if (queryConditions.length > 0) {
        const oldOrders = await Order.find({
          userId: { $exists: false },  // Only old orders without userId
          $or: queryConditions
        })
        .sort({ createdAt: -1 })
        .limit(15 - orders.length)
        .lean();
        
        console.log(`✅ Found ${oldOrders.length} old orders by phone/email fallback`);
        
        orders = [...orders, ...oldOrders];
      }
    }

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
