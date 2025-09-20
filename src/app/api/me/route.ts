import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";

export async function GET() {
  const session = await getLoginSession();

  if (!session) {
    return NextResponse.json(
      { loggedIn: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    loggedIn: true,
    user: session, // contains { phone }
  });
}
