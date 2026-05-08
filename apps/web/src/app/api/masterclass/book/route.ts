import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Masterclass, MasterclassBooking, User } from "@swago/database";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { 
      masterclassId, 
      sessionId, 
      childName, 
      childAge, 
      childGrade,
      schoolName,
      goals,
      city,
      state,
      parentName, 
      parentPhone, 
      parentEmail, 
      currency = "INR" 
    } = body;

    if (!masterclassId || !sessionId || !childName || !childAge || !parentName || !parentPhone || !parentEmail || !city || !state) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find user by phone or email
    const user = await User.findOne({ 
      $or: [{ phone: session.phone }, { email: session.email }] 
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch the masterclass and validate the session
    const masterclass = await Masterclass.findById(masterclassId);
    if (!masterclass || !masterclass.isActive) {
      return NextResponse.json({ error: "Masterclass not available" }, { status: 404 });
    }

    const mcSession = masterclass.sessions.id(sessionId);
    if (!mcSession || !mcSession.isActive) {
      return NextResponse.json({ error: "Session not available" }, { status: 404 });
    }

    // Check availability
    if (mcSession.bookedSeats >= mcSession.maxSeats) {
      return NextResponse.json({ error: "This session is fully booked" }, { status: 400 });
    }

    // Find requested currency or fallback
    let selectedPricing = mcSession.pricing?.find((p: any) => p.currency === currency);
    if (!selectedPricing && mcSession.pricing?.length > 0) {
      // Fallback to INR if exists, else first available
      selectedPricing = mcSession.pricing.find((p: any) => p.currency === "INR") || mcSession.pricing[0];
    }

    if (!selectedPricing) {
      return NextResponse.json({ error: "Pricing not configured for this session" }, { status: 400 });
    }

    const amount = selectedPricing.price;
    const finalCurrency = selectedPricing.currency || "INR";
    const amountInPaise = Math.round(amount * 100);

    // Create Razorpay Order
    const options = {
      amount: amountInPaise,
      currency: finalCurrency,
      receipt: `mc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Create unique booking ID
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
    const randomChars = crypto.randomBytes(2).toString("hex").toUpperCase();
    const bookingId = `MC-${dateStr}-${randomChars}`;

    // Create Booking Record in Pending state
    const booking = await MasterclassBooking.create({
      bookingId,
      userId: user._id,
      masterclassId,
      sessionId,
      childName,
      childAge,
      childGrade,
      schoolName,
      goals,
      city,
      state,
      parentName,
      parentPhone,
      parentEmail,
      amount,
      currency: finalCurrency,
      status: "Pending",
      razorpay_order_id: razorpayOrder.id,
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.bookingId,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Send public key to client
      amount
    });

  } catch (error: any) {
    console.error("Masterclass booking creation failed:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
