import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: Request) {
  const { phone } = await req.json();
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verifications.create({ to: `+91${phone}`, channel: "sms" });

    return NextResponse.json({ success: true, sid: verification.sid });
  } catch (err: any) {
    console.error("Twilio send error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
