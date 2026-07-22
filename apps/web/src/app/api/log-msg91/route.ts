import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("\n==============================");
    console.log("📱 MSG91 WIDGET CLIENT LOG");
    console.log("Status:", body.status);
    console.dir(body.data, { depth: null, colors: true });
    console.log("==============================\n");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false });
  }
}
