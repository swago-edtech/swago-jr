import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getLoginSession } from "@/lib/auth";
import User from "@/models/User";
import Order from "@/models/Order";
import { z } from "zod";

// Corrected: Simplified the enum definition
const statusUpdateSchema = z.object({
  status: z.enum(["Pending", "Shipped", "Delivered", "Cancelled"]),
});

// GET handler remains the same
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const user = await User.findOne({ phone: session.phone });
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT handler uses the corrected schema
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const user = await User.findOne({ phone: session.phone });
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const validation = statusUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }
    
    const { status } = validation.data;

    const updatedOrder = await Order.findByIdAndUpdate(
      params.id,
      { status: status },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}