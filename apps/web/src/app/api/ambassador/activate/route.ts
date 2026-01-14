// apps/web/src/app/api/ambassador/activate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, KidProfile } from "@swago/database";
import { getLoginSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getLoginSession();

    if (!session || session.isDemo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { kidProfileId } = await request.json();

    if (!kidProfileId) {
      return NextResponse.json(
        { error: "Kid profile ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const profile = await KidProfile.findById(kidProfileId);

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Initialize ambassador program
    await profile.initializeAmbassador();

    return NextResponse.json({
      success: true,
      message: "Ambassador program activated!",
      swagoMoney: profile.ambassador.swagoMoney,
      badge: "Swago Saviour",
    });
  } catch (error) {
    console.error("Ambassador activation error:", error);
    return NextResponse.json(
      { error: "Failed to activate ambassador program" },
      { status: 500 }
    );
  }
}
