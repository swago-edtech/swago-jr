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

    // ✅ Find current logged-in user
    const currentUser = session.phone 
      ? await User.findOne({ phone: session.phone })
      : await User.findOne({ email: session.email });

    if (!currentUser) {
      return NextResponse.json(
        { valid: false, error: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Check if email is used by ANOTHER user
    const existingEmailUser = await User.findOne({ email });
    
    if (existingEmailUser && existingEmailUser._id.toString() !== currentUser._id.toString()) {
      // Email belongs to a different user
      return NextResponse.json({
        valid: false,
        error: `This email is already registered to another account. Please use a different email or contact support.`,
        field: "email",
      });
    }

    // ✅ Check if phone is used by ANOTHER user (optional, for extra safety)
    const existingPhoneUser = await User.findOne({ phone });
    
    if (existingPhoneUser && existingPhoneUser._id.toString() !== currentUser._id.toString()) {
      // Phone belongs to a different user
      return NextResponse.json({
        valid: false,
        error: `This phone number is already registered to another account. Please use a different number or contact support.`,
        field: "phone",
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
