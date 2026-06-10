import { NextResponse } from "next/server";
import { connectDB, Coupon } from "@swago/database";

export async function GET() {
    try {
        await connectDB();

        const currentDate = new Date();

        const coupons = await Coupon.find({
            isPublic: { $ne: false },
            isExpressOnly: { $ne: true },
            active: true,
            $or: [
                { expiryDate: null },
                { expiryDate: { $gt: currentDate } }
            ]
        }).select('code description type value minAmount maxDiscount expiryDate targetGroup').sort({ createdAt: -1 });

        return NextResponse.json({ success: true, coupons });
    } catch (error: any) {
        console.error("Error fetching public coupons:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch public coupons" },
            { status: 500 }
        );
    }
}
