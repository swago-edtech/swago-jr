// apps/web/src/lib/coupon.ts

import { Coupon } from "@swago/database";

export async function validateCoupon(couponCode: string, orderAmount: number, cartItems: any[] = []) {
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

    // Check if coupon is restricted to specific products
    const isRestricted = coupon.applicableProducts && coupon.applicableProducts.length > 0;
    let applicableAmount = orderAmount;

    if (isRestricted) {
        // Calculate subtotal of applicable products in the cart
        const applicableItems = cartItems.filter(item => {
            const pid = item.productId || item._id || item.id;
            return coupon.applicableProducts.some((apId: any) => apId.toString() === pid?.toString());
        });

        if (applicableItems.length === 0) {
            throw new Error("This coupon is not applicable to any products in your cart");
        }

        applicableAmount = applicableItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Check minimum amount (based on applicable amount if restricted, else order amount)
    if (applicableAmount < coupon.minAmount) {
        if (isRestricted) {
            throw new Error(`Minimum amount of ₹${coupon.minAmount} for applicable products required for this coupon`);
        } else {
            throw new Error(`Minimum order amount of ₹${coupon.minAmount} required for this coupon`);
        }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === "percentage") {
        discountAmount = (applicableAmount * coupon.value) / 100;
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
