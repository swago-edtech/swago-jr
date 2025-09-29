import { NextResponse } from "next/server";
import twilio from "twilio";
import { z } from "zod";

const phoneSchema = z.object({
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
});

// Demo credentials
const DEMO_PHONE = "9876543210";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = phoneSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }
    const { phone } = validation.data;

    // ✅ NEW: Check if it's the demo number
    if (phone === DEMO_PHONE) {
      // Skip Twilio for demo number, return fake success
      return NextResponse.json({ 
        success: true, 
        sid: "demo-sid-fake",
        message: "Demo OTP sent" 
      });
    }

    // ✅ Original Twilio flow for real numbers
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verifications.create({ to: `+91${phone}`, channel: "sms" });
    return NextResponse.json({ success: true, sid: verification.sid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}