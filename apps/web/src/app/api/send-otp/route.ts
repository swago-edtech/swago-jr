// apps/web/src/app/api/send-otp/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOTP, formatPhoneForStorage } from "@/lib/msg91";

const phoneSchema = z.object({
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
});

// Demo credentials
const DEMO_PHONE = "+919876543210";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = phoneSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }
    
    const { phone } = validation.data;
    const formattedPhone = formatPhoneForStorage(phone);

    // Demo mode bypass
    if (formattedPhone === DEMO_PHONE) {
      console.log('🎭 Demo mode: Skipping MSG91 for', DEMO_PHONE);
      return NextResponse.json({ 
        success: true, 
        message: "Demo OTP: Use 123456" 
      });
    }

    // Send OTP via MSG91
    const result = await sendOTP(formattedPhone);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: "OTP sent successfully" 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error || "Failed to send OTP" 
      }, { status: 500 });
    }
    
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    console.error('❌ Send OTP route error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
