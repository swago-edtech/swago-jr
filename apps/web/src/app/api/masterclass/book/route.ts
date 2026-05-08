import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Masterclass, MasterclassBooking, User } from "@swago/database";
import Razorpay from "razorpay";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const loginSession = await getLoginSession();
    if (!loginSession) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { 
      masterclassId, 
      sessionId, 
      sessionTitle,
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

    if (!masterclassId || (!sessionId && !sessionTitle) || !childName || !childAge || !parentName || !parentPhone || !parentEmail || !city || !state) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find user by phone or email
    const user = await User.findOne({ 
      $or: [
        ...(loginSession.phone ? [{ phone: loginSession.phone }] : []),
        ...(loginSession.email ? [{ email: loginSession.email }] : []),
      ]
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch the masterclass and validate the session
    const masterclass = await Masterclass.findById(masterclassId);
    if (!masterclass || !masterclass.isActive) {
      return NextResponse.json({ error: "Masterclass not available" }, { status: 404 });
    }

    // Find session - try .id() first, then manual find for string comparison
    let mcSession = null;
    if (sessionId) {
      mcSession = masterclass.sessions.id(sessionId);
      if (!mcSession) {
        // Fallback: find by string comparison of _id
        mcSession = masterclass.sessions.find((s: any) => s._id.toString() === sessionId);
      }
    }
    
    // Final fallback: find by title
    if (!mcSession && sessionTitle) {
      mcSession = masterclass.sessions.find((s: any) => s.title === sessionTitle);
      if (mcSession) {
        console.log(`Matched session by title (${sessionTitle}) because ID (${sessionId}) was stale`);
      }
    }
    
    if (!mcSession) {
      console.error("Session not found. SessionId:", sessionId, "Available sessions:", masterclass.sessions.map((s: any) => ({ id: s._id.toString(), title: s.title, isActive: s.isActive })));
      return NextResponse.json({ error: "Session not available" }, { status: 404 });
    }

    if (!mcSession.isActive) {
      return NextResponse.json({ error: "This session is no longer active" }, { status: 400 });
    }

    // Check availability
    if (mcSession.bookedSeats >= mcSession.maxSeats) {
      return NextResponse.json({ error: "This session is fully booked" }, { status: 400 });
    }

    // Find requested currency or fallback
    let selectedPricing = mcSession.pricing?.find((p: any) => p.currency === currency);
    if (!selectedPricing && mcSession.pricing?.length > 0) {
      selectedPricing = mcSession.pricing.find((p: any) => p.currency === "INR") || mcSession.pricing[0];
    }

    if (!selectedPricing) {
      return NextResponse.json({ error: "Pricing not configured for this session" }, { status: 400 });
    }

    const amount = selectedPricing.price;
    const finalCurrency = selectedPricing.currency || "INR";
    const amountInPaise = Math.round(amount * 100);

    // Validate Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay credentials missing");
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    // Initialize Razorpay inside handler (not at module level)
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay Order
    const options = {
      amount: amountInPaise,
      currency: finalCurrency,
      receipt: `mc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      notes: {
        type: "masterclass",
        masterclassId: masterclassId,
        sessionId: sessionId,
        childName: childName,
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Create unique booking ID
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
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

    console.log("✅ Masterclass booking created:", bookingId, "Razorpay order:", razorpayOrder.id);

    return NextResponse.json({
      success: true,
      bookingId: booking.bookingId,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      key: process.env.RAZORPAY_KEY_ID,
      amount
    });

  } catch (error: any) {
    console.error("❌ Masterclass booking creation failed:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
