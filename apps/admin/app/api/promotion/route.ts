// apps/admin/app/api/promotion/route.ts

import { NextResponse } from "next/server";
import { connectDB, Promotion } from "@swago/database";
import { getAdminSession } from "@/lib/auth";
import { getSubdivision } from "@swago/utils/address";

/** COD block lists: Indian ISO 3166-2 codes + 6-digit PIN codes only. */
function cleanCodBlocks(states: unknown, pins: unknown): { ok: true; states?: string[]; pins?: string[] } | { ok: false; error: string } {
    let outStates: string[] | undefined;
    let outPins: string[] | undefined;
    if (states !== undefined) {
        if (!Array.isArray(states)) return { ok: false, error: "blockedCodStates must be an array" };
        outStates = [];
        for (const s of states) {
            const sub = getSubdivision(s);
            if (!sub || sub.country !== "IN") return { ok: false, error: `Invalid Indian state code: ${String(s)}` };
            if (!outStates.includes(sub.code)) outStates.push(sub.code);
        }
    }
    if (pins !== undefined) {
        if (!Array.isArray(pins)) return { ok: false, error: "blockedCodPincodes must be an array" };
        outPins = [];
        for (const p of pins) {
            const v = String(p).trim();
            if (!/^[1-9]\d{5}$/.test(v)) return { ok: false, error: `Invalid PIN code: ${v}` };
            if (!outPins.includes(v)) outPins.push(v);
        }
    }
    return { ok: true, states: outStates, pins: outPins };
}

export async function GET() {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        let promotion = await Promotion.findOne();

        // If no active promotion, create a default one
        if (!promotion) {
            promotion = await Promotion.create({
                name: "Default Promotion",
                isActive: true,
                redemptionTiers: [
                    { target: 799, off: 50 },
                    { target: 1200, off: 75 },
                    { target: 2000, off: 100 },
                    { target: 3000, off: 150 }
                ],
                bonusItems: [
                    { threshold: 999, label: "Mini Swago Game Card", slug: "mini-swago-game-card" },
                    { threshold: 1999, label: "Special Edition Item", slug: "special-edition-item" }
                ],
                blockedCodStates: [],
                blockedCodPincodes: []
            });
        }

        return NextResponse.json({ success: true, promotion });
    } catch (error) {
        console.error("Error fetching promotion:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { redemptionTiers, bonusItems, isActive } = body;
        const cod = cleanCodBlocks(body.blockedCodStates, body.blockedCodPincodes);
        if (!cod.ok) {
            return NextResponse.json({ error: cod.error }, { status: 400 });
        }
        const blockedCodStates = cod.states;
        const blockedCodPincodes = cod.pins;

        await connectDB();

        let promotion = await Promotion.findOne();
        if (promotion) {
            if (redemptionTiers !== undefined) promotion.redemptionTiers = redemptionTiers;
            if (bonusItems !== undefined) promotion.bonusItems = bonusItems;
            if (isActive !== undefined) promotion.isActive = isActive;
            if (blockedCodStates !== undefined) promotion.blockedCodStates = blockedCodStates;
            if (blockedCodPincodes !== undefined) promotion.blockedCodPincodes = blockedCodPincodes;
            await promotion.save();
        } else {
            promotion = await Promotion.create({
                name: "Default Promotion",
                isActive: isActive ?? true,
                redemptionTiers,
                bonusItems,
                blockedCodStates: blockedCodStates ?? [],
                blockedCodPincodes: blockedCodPincodes ?? []
            });
        }

        return NextResponse.json({ success: true, promotion });
    } catch (error) {
        console.error("Error updating promotion:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
