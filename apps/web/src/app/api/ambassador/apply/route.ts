import { NextResponse } from "next/server";
import { connectDB, AmbassadorApplication } from "@swago/database";
import { z } from "zod";

const applicationSchema = z.object({
  kidName: z.string().trim().min(2, { message: "Kid's name must be at least 2 characters" }),
  kidAge: z.number().min(7, { message: "Age must be at least 7" }).max(14, { message: "Age must be at most 14" }),
  city: z.string().trim().min(2, { message: "City is required" }),
  parentName: z.string().trim().min(2, { message: "Parent's name must be at least 2 characters" }),
  parentEmail: z.string().email({ message: "Valid email is required" }),
  parentPhone: z.string().min(10, { message: "Valid phone number is required" }),
  whyJoin: z.string().optional(),
  consentGiven: z.boolean().refine(val => val === true, { message: "Consent is required" }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = applicationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { kidName, kidAge, city, parentName, parentEmail, parentPhone, whyJoin, consentGiven } = validation.data;

    await connectDB();

    // Check if email already applied
    const existingApplication = await AmbassadorApplication.findOne({ parentEmail });
    if (existingApplication) {
      return NextResponse.json(
        { error: "This email has already been used for an application" }, 
        { status: 409 }
      );
    }

    const application = await AmbassadorApplication.create({
      kidName,
      kidAge,
      city,
      parentName,
      parentEmail: parentEmail.toLowerCase(),
      parentPhone,
      whyJoin,
      consentGiven,
      status: 'pending',
    });

    return NextResponse.json({ 
      success: true, 
      message: "Application submitted successfully!",
      applicationId: application._id 
    });
  } catch (error) {
    console.error("Error creating ambassador application:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
