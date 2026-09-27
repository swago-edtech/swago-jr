import { NextResponse } from "next/server";
import { connectDB, InternationalConfig } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();
    let config = await InternationalConfig.findOne({ isSingleton: true });
    
    if (!config) {
      config = await InternationalConfig.create({ isSingleton: true });
    }
    
    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    console.error("Error fetching international config:", error);
    if (error.message === "Unauthorized - Admin access required") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    await connectDB();
    const { supportedCountries } = await req.json();

    if (!supportedCountries || !Array.isArray(supportedCountries)) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    let config = await InternationalConfig.findOne({ isSingleton: true });
    
    if (!config) {
      config = await InternationalConfig.create({ isSingleton: true, supportedCountries });
    } else {
      config.supportedCountries = supportedCountries;
      await config.save();
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    console.error("Error updating international config:", error);
    if (error.message === "Unauthorized - Admin access required") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
