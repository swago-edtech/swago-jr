// apps/web/src/app/api/check-user/route.ts
import { NextResponse } from "next/server";
import { connectDB, User } from "@swago/database";
import { z } from "zod";

// ✅ Define the user type from database
interface UserDocument {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
}

// ✅ UPDATED: Support both phone and email
const checkSchema = z.object({
  identifier: z.string().min(1, { message: "Phone or email is required" }),
  authMethod: z.enum(['phone', 'email']),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = checkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const { identifier, authMethod } = validation.data;

    // Connect to database
    await connectDB();

    // ✅ Check if user exists by phone OR email
    let user: UserDocument | null = null;
    if (authMethod === 'phone') {
      user = await User.findOne({ phone: identifier }).lean() as UserDocument | null;
    } else {
      user = await User.findOne({ email: identifier }).lean() as UserDocument | null;
    }

    // ✅ Type-safe check - no more any!
    const hasProfile = user
      ? Boolean(user.name && (authMethod === 'email' || user.email))
      : false;

    return NextResponse.json({
      success: true,
      exists: !!user,
      hasProfile,
      authMethod, // ✅ Return which method was used
    });
  } catch (err: unknown) {
    console.error("❌ Check user error:", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong checking your account. Please try again later." },
      { status: 500 }
    );
  }
}
