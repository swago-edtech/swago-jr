import { NextResponse } from "next/server";
import { connectDB, Waitlist } from "@swago/database";
import { z } from "zod";

const waitlistSchema = z.object({
  kidName: z.string().trim().min(2, { message: "Kid's name must be at least 2 characters" }),
  kidAge: z.number().min(7, { message: "Age must be at least 7" }).max(14, { message: "Age must be at most 14" }),
  parentEmail: z.string().email({ message: "Valid email is required" }),
  parentPhone: z.string().min(10, { message: "Valid phone number is required" }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = waitlistSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { kidName, kidAge, parentEmail, parentPhone } = validation.data;

    await connectDB();

    // Check if email already in waitlist
    const existingEntry = await Waitlist.findOne({ parentEmail });
    if (existingEntry) {
      return NextResponse.json(
        { error: "This email is already in the waitlist" }, 
        { status: 409 }
      );
    }

    const waitlistEntry = await Waitlist.create({
      kidName,
      kidAge,
      parentEmail: parentEmail.toLowerCase(),
      parentPhone,
      notified: false,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Successfully joined the waitlist!",
      waitlistId: waitlistEntry._id 
    });
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
