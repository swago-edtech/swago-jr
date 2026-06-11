// apps/web/src/lib/coupon.ts

import { Coupon, User, ExpressConfig } from "@swago/database";

export async function validateCoupon(couponCode: string, orderAmount: number, cartItems: any[] = [], userId?: string, isExpressCheckout: boolean = false) {
    const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        active: true,
    });

    if (!coupon) {
        throw new Error("Invalid or inactive coupon code");
    }

    // Enforce coupon separation logic
    if (isExpressCheckout) {
        let allowPublicCoupons = false;
        const config: any = await ExpressConfig.findOne({ isSingleton: true }).lean();
        if (config && config.allowPublicCoupons) {
            allowPublicCoupons = true;
        }

        if (!coupon.isExpressOnly && !allowPublicCoupons) {
            throw new Error("This coupon is not valid for Checkout");
        }
    } else {
        if (coupon.isExpressOnly) {
            throw new Error("This coupon is only valid for Checkout");
        }
    }

    // Check target group logic
    if (coupon.targetGroup === "new_users" || coupon.targetGroup === "no_orders") {
        if (!userId) {
            throw new Error("You must be logged in to use this coupon.");
        }
        const userObj = await User.findById(userId);
        if (userObj && userObj.orders && userObj.orders.length > 0) {
            throw new Error("This coupon is only valid for your first order.");
        }
    } else if (coupon.targetGroup === "specific_users") {
        if (!userId) {
            throw new Error("You must be logged in to use this coupon.");
        }
        const isTargeted = coupon.targetUsers && coupon.targetUsers.some((id: any) => id.toString() === userId.toString());
        if (!isTargeted) {
            throw new Error("This coupon is not valid for your account.");
        }
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
        discountAmount = Math.round((applicableAmount * coupon.value) / 100);
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
