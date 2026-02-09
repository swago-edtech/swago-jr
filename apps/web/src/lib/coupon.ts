// apps/web/src/lib/coupon.ts

import { Coupon } from "@swago/database";

export async function validateCoupon(couponCode: string, orderAmount: number) {
    const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        active: true,
    });

    if (!coupon) {
        throw new Error("Invalid or inactive coupon code");
    }

    // Check expiry date
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
        throw new Error("This coupon has expired");
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        throw new Error("This coupon has reached its usage limit");
    }

    // Check minimum amount
    if (orderAmount < coupon.minAmount) {
        throw new Error(`Minimum order amount of ₹${coupon.minAmount} required for this coupon`);
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === "percentage") {
        discountAmount = (orderAmount * coupon.value) / 100;
        // Apply maximum discount limit
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
        }
    } else if (coupon.type === "fixed") {
        discountAmount = coupon.value;
    }

    return {
        coupon,
        discountAmount,
        finalAmount: Math.max(0, orderAmount - discountAmount)
    };
}
