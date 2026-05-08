import { NextResponse } from "next/server";
import { connectDB, Masterclass } from "@swago/database";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    
    const masterclass = await Masterclass.findOne({ slug: resolvedParams.slug, isActive: true });
    
    if (!masterclass) {
      return NextResponse.json({ error: "Masterclass not found" }, { status: 404 });
    }

    // Only return active sessions
    const activeSessions = masterclass.sessions.filter((s: any) => s.isActive);
    const result = { ...masterclass.toObject(), sessions: activeSessions };

    return NextResponse.json({ success: true, masterclass: result });
  } catch (error) {
    console.error("Error fetching masterclass by slug:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
