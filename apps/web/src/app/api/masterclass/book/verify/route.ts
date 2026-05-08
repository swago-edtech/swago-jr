import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, MasterclassBooking, Masterclass } from "@swago/database";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    await connectDB();

    // Find the pending booking
    const booking = await MasterclassBooking.findOne({ razorpay_order_id });
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // If already processed, return success
    if (booking.status === "Paid") {
      return NextResponse.json({ success: true, bookingId: booking.bookingId });
    }

    // Update booking status
    booking.status = "Paid";
    booking.razorpay_payment_id = razorpay_payment_id;
    await booking.save();

    // Increment bookedSeats on the Masterclass session
    const masterclass = await Masterclass.findById(booking.masterclassId);
    if (masterclass) {
      const mcSession = masterclass.sessions.id(booking.sessionId);
      if (mcSession) {
        mcSession.bookedSeats = (mcSession.bookedSeats || 0) + 1;
        await masterclass.save();
      }
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.bookingId,
    });

  } catch (error: any) {
    console.error("Payment verification failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
