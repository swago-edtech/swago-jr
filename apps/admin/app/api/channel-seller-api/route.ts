import { NextResponse } from "next/server";
import { getSellerApiStatus, runChannelSellerApiSync, setSellerApiEnabled } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const status = await getSellerApiStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function POST() {
  try {
    await requireAdmin();
    const result = await runChannelSellerApiSync();
    const status = await getSellerApiStatus();
    return NextResponse.json({ success: true, result, ...status });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

/** Enable or disable polling for a platform. Credentials and ingested data are not deleted. */
export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const platform = body?.platform === "flipkart" ? "flipkart" : body?.platform === "amazon" ? "amazon" : null;
    if (!platform || typeof body.enabled !== "boolean") {
      return NextResponse.json({ success: false, error: "platform (amazon|flipkart) and enabled boolean required" }, { status: 400 });
    }
    const status = await setSellerApiEnabled(platform, body.enabled);
    return NextResponse.json({ success: true, ...status });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
