import { NextResponse } from "next/server";
import {
  connectDB,
  getOrCreateChannelEmailConfig,
  sanitizeChannelConfig,
  disconnectGmail,
} from "@swago/database";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();
    const config = await getOrCreateChannelEmailConfig();
    return NextResponse.json({ success: true, config: sanitizeChannelConfig(config) });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    await connectDB();
    const body = await request.json();
    const config = await getOrCreateChannelEmailConfig();

    if (typeof body.isEnabled === "boolean") {
      config.isEnabled = body.isEnabled;
    }
    if (Array.isArray(body.senderAllowlist)) {
      config.senderAllowlist = body.senderAllowlist
        .map((sender: string) => String(sender).trim())
        .filter(Boolean);
    }
    if (Array.isArray(body.productAliases)) {
      config.productAliases = body.productAliases
        .filter((alias: any) => alias?.alias && alias?.productId)
        .map((alias: any) => ({
          alias: String(alias.alias).trim(),
          productId: alias.productId,
          productName: String(alias.productName || "").trim(),
        }));
    }

    await config.save();
    return NextResponse.json({ success: true, config: sanitizeChannelConfig(config) });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function DELETE() {
  try {
    await requireAdmin();
    const config = await disconnectGmail();
    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
