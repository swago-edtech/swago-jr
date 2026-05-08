import { NextResponse } from "next/server";
import { connectDB, MasterclassBooking } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const masterclassId = searchParams.get("masterclassId");

    const query: any = {};
    if (status && status !== "all") query.status = status;
    if (masterclassId && masterclassId !== "all") query.masterclassId = masterclassId;

    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: "i" } },
        { childName: { $regex: search, $options: "i" } },
        { parentName: { $regex: search, $options: "i" } },
        { parentEmail: { $regex: search, $options: "i" } },
        { parentPhone: { $regex: search, $options: "i" } },
      ];
    }

    const bookings = await MasterclassBooking.find(query)
      .populate("masterclassId", "title")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    console.error("Error fetching masterclass bookings:", error);
    if (error.message === "Unauthorized - Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
