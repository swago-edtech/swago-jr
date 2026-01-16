// apps/admin/app/api/announcement/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Announcement, connectDB } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

// GET announcement (for admin panel)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    // Get the first (and should be only) announcement document
    const announcement = await Announcement.findOne().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      announcement: announcement || { text: "", isActive: false, backgroundColor: "gradient" },
    });
  } catch (error: any) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch announcement",
      },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// POST/PUT update announcement (we'll use POST to create or update)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await req.json();
    const { text, isActive, backgroundColor } = body;

    // Validate required field
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Announcement text is required",
        },
        { status: 400 }
      );
    }

    // Find existing announcement or create new one
    let announcement = await Announcement.findOne();

    if (announcement) {
      // Update existing
      announcement.text = text.trim();
      announcement.isActive = isActive !== undefined ? isActive : true;
      announcement.backgroundColor = backgroundColor || "gradient";
      await announcement.save();
    } else {
      // Create new
      announcement = await Announcement.create({
        text: text.trim(),
        isActive: isActive !== undefined ? isActive : true,
        backgroundColor: backgroundColor || "gradient",
      });
    }

    return NextResponse.json({
      success: true,
      announcement,
      message: "Announcement updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update announcement",
      },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
