// apps/admin/app/api/coupons/route.ts

import { NextResponse } from 'next/server';
import { connectDB, Coupon } from '@swago/database';

export async function GET() {
    try {
        await connectDB();
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        return NextResponse.json({ success: true, coupons });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({ code: body.code.toUpperCase() });
        if (existingCoupon) {
            return NextResponse.json({ success: false, error: 'Coupon code already exists' }, { status: 400 });
        }

        const coupon = await Coupon.create({
            ...body,
            code: body.code.toUpperCase()
        });

        return NextResponse.json({ success: true, coupon });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
