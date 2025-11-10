import { NextResponse } from "next/server";
import { connectDB, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";
import { z } from "zod";

const validateSchema = z.object({
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone is required"),
});

export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json(
        { valid: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = validateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { valid: false, error: "Invalid data format" },
        { status: 400 }
      );
    }

    const { email, phone } = validation.data;

    await connectDB();

    const existingEmailUser = await User.findOne({ email });
    
    if (existingEmailUser && existingEmailUser.phone !== phone) {
      return NextResponse.json({
        valid: false,
        error: `This email is already registered with a different phone number. Please use a different email or contact support.`,
        field: "email",
      });
    }

    return NextResponse.json({ valid: true });

  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Validation failed. Please try again." },
      { status: 500 }
    );
  }
}