import { NextResponse } from "next/server";
import { connectDB, Masterclass } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    await connectDB();

    let masterclass = await Masterclass.findOne({});
    
    if (!masterclass) {
      // Create a default one if it doesn't exist
      masterclass = await Masterclass.create({
        title: "Masterclass",
        description: "",
        isActive: true,
        order: 1,
        hero: { headline: "", subheadline: "", videoUrl: "", stats: [], guaranteeBadge: "" },
        sessions: [],
        modules: [],
        bonuses: [],
        targetAudience: [],
        faqs: [],
        testimonials: [],
        mentor: { name: "", title: "", bio: "", image: "", stats: [] },
        certification: { title: "Get Certified", description: "", points: [], image: "" }
      });
    }

    return NextResponse.json({ success: true, masterclass });
  } catch (error: any) {
    console.error("Error fetching masterclass:", error);
    if (error.message === "Unauthorized - Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await req.json();

    const masterclass = await Masterclass.findOneAndUpdate(
      {}, // updates the first document found (which should be the only one)
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!masterclass) {
      return NextResponse.json({ error: "Masterclass not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, masterclass });
  } catch (error: any) {
    console.error("Error updating masterclass:", error);
    if (error.message === "Unauthorized - Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
