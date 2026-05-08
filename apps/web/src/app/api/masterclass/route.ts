import { NextResponse } from "next/server";
import { connectDB, Masterclass } from "@swago/database";

// Set a very low revalidate to avoid stale static data while testing, or just use dynamic
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    
    // Fetch the single global masterclass
    const masterclass = await Masterclass.findOne({ isActive: true });
    
    if (!masterclass) {
      return NextResponse.json({ error: "Masterclass not found" }, { status: 404 });
    }

    // Only return active sessions
    const activeSessions = masterclass.sessions.filter((s: any) => s.isActive);
    const result = { ...masterclass.toObject(), sessions: activeSessions };

    return NextResponse.json({ success: true, masterclass: result });
  } catch (error) {
    console.error("Error fetching global masterclass:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
