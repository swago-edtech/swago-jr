// apps/web/src/app/api/announcement/route.ts

import { NextResponse } from "next/server";
import { Announcement, connectDB } from "@swago/database";

// GET active announcement (public route - no auth required)
export async function GET() {
  try {
    await connectDB();

    // Fetch only active announcement
    const announcement = await Announcement.findOne({ isActive: true }).sort({ createdAt: -1 });

    if (!announcement) {
      return NextResponse.json({
        success: true,
        announcement: null,
      });
    }

    return NextResponse.json({
      success: true,
      announcement: {
        text: announcement.text,
        backgroundColor: announcement.backgroundColor,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch announcement",
      },
      { status: 500 }
    );
  }
}
