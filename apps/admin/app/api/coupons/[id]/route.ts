// apps/admin/app/api/coupons/[id]/route.ts

import { NextResponse } from 'next/server';
import { connectDB, Coupon } from '@swago/database';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, coupon });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const body = await req.json();
        const { id } = await params;

        // If code is being updated, check for uniqueness
        if (body.code) {
            const normalizedCode = body.code.toUpperCase();
            const existingCoupon = await Coupon.findOne({
                code: normalizedCode,
                _id: { $ne: id }
            });
            if (existingCoupon) {
                return NextResponse.json({ success: false, error: 'Coupon code already exists' }, { status: 400 });
            }
            body.code = normalizedCode;
        }

        const coupon = await Coupon.findByIdAndUpdate(id, body, { new: true });

        if (!coupon) {
            return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, coupon });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        const coupon = await Coupon.findByIdAndDelete(id);

        if (!coupon) {
            return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
