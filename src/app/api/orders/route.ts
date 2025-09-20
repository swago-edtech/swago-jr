import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";   // ✅ FIXED
import Order from "@/models/Order";

export async function POST(req: Request) {
  const session = await getLoginSession();
  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { name, age, address } = await req.json();

  await connectDB();

  const order = await Order.create({
    phone: session.phone,
    name,
    age,
    address,
    status: "Pending",
  });

  return NextResponse.json({ success: true, order });
}
