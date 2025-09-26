import { NextResponse } from "next/server";
import twilio from "twilio";
import { z } from "zod";

const phoneSchema = z.object({
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = phoneSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }
    const { phone } = validation.data;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verifications.create({ to: `+91${phone}`, channel: "sms" });
    return NextResponse.json({ success: true, sid: verification.sid });
  } catch (err: unknown) { // Changed any to unknown
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}