import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Product, Order, User, Coupon as CouponModel, Promotion } from "@swago/database";
import { generateOrderId } from "@/lib/generateOrderId";
import { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail } from "@/lib/msg91-email";
import { cleanupExpiredOrders } from "@/lib/cleanupExpiredOrders";
import { invalidateProductCache } from "@/lib/productCache";
import { generateAndUploadInvoice } from "@/lib/invoice-service";
import {
  allocateInventoryForOrder,
  InsufficientInventoryError,
} from "@/lib/inventory-service";
import {
  COD_MAX_UNITS,
  COD_UNIT_LIMIT_MESSAGE,
  SWAGO_CONTACT,
  cartUnitCount,
} from "@/lib/cod-limits";
import { isCodBlocked, isIndianPhone } from "@/lib/address-server";
import { adminChargedAndShipTo } from "@/lib/international-order-notify";
import { clientTotalDrifted, orderPricingFields, type PromotionLike } from "@/lib/order-pricing";
import { jsonError, orderAddressFields, prepareCheckout, quoteView } from "@/lib/checkout/order-request";

/**
 * Cash on Delivery order for a logged-in customer. India-only: the country is
 * derived from the validated address (ISO state + PIN), never from the client.
 */
export async function POST(req: Request) {
    try {
        const session = await getLoginSession();
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        let raw: unknown;
        try {
            raw = await req.json();
        } catch {
            return jsonError(400, { error: "Invalid JSON body", code: "INVALID_REQUEST" });
        }

        await connectDB();
        const user = session.phone
            ? await User.findOne({ phone: session.phone })
            : session.email
                ? await User.findOne({ email: session.email })
                : null;
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const prepared = await prepareCheckout(raw, {
            context: "payment/cod",
            paymentMethod: "cod",
            user,
            loadPromotion: () => Promotion.findOne().lean() as unknown as Promise<PromotionLike | null>,
        });
        if (!prepared.ok) return prepared.response;
        const { body, address, pricing, promotion: activePromotion } = prepared;
        const orderDetails = body.orderDetails;

        if (address.country !== "IN") {
            return jsonError(400, { error: "Cash on Delivery is only available for addresses in India.", code: "INDIA_ONLY" });
        }
        const phone = orderDetails.phone || session.phone;
        if (!isIndianPhone(phone)) {
            return jsonError(400, { error: "COD is only available for Indian phone numbers (+91)", code: "INDIA_ONLY" });
        }
        if (isCodBlocked(activePromotion, address)) {
            return jsonError(400, { error: "COD is not available in your location", code: "COD_BLOCKED" });
        }
        const units = cartUnitCount(pricing.items);
        if (units > COD_MAX_UNITS) {
            return jsonError(400, {
                error: `${COD_UNIT_LIMIT_MESSAGE} Contact ${SWAGO_CONTACT.phoneDisplay} / WhatsApp / ${SWAGO_CONTACT.email}`,
                code: "COD_UNIT_LIMIT",
                maxUnits: COD_MAX_UNITS,
                cartUnits: units,
            });
        }
        if (clientTotalDrifted(pricing, { total: body.expectedTotal, currency: body.expectedCurrency })) {
            return jsonError(409, {
                error: "Your order total changed. Please review the updated total and try again.",
                code: "PRICE_CHANGED",
                quote: quoteView(pricing, address),
            });
        }

        await cleanupExpiredOrders();

        const reservations = pricing.lines;
        const swagoMoneyRedeemed = pricing.swagoMoneyRedeemed;
        const orderId = await generateOrderId();

        const newOrder = await Order.create({
            orderId,
            userId: new mongoose.Types.ObjectId(user._id),
            paymentMethod: "cod",
            phone,
            email: orderDetails.email,
            name: orderDetails.name,
            age: orderDetails.age,
            referralSource: orderDetails.referralSource,
            ...orderAddressFields(address),
            status: "Pending",
            ...orderPricingFields(pricing),
            swagoMoneyKidId: user._id,
            stockReservedAt: new Date(),
            createdVia: "frontend",
        });

        try {
            await allocateInventoryForOrder(newOrder, { consumeImmediately: true });
        } catch (allocError) {
            await Order.findByIdAndDelete(newOrder._id);
            if (allocError instanceof InsufficientInventoryError) {
                return NextResponse.json({
                    error: "Stock unavailable",
                    stockErrors: [allocError.message],
                    details: allocError.message,
                }, { status: 400 });
            }
            throw allocError;
        }

        for (const { product, quantity } of reservations) {
            await Product.findByIdAndUpdate(product._id, {
                $inc: { totalSold: quantity },
            });
            try {
                invalidateProductCache(product.slug || '');
                invalidateProductCache(product._id.toString());
            } catch {
                // non-critical
            }
        }

        // Increment coupon usage
        if (newOrder.couponCode) {
            await (CouponModel as any).updateOne(
                { code: newOrder.couponCode },
                { $inc: { usageCount: 1 } }
            );
        }

        // Link order to user
        try {
            user.orders.push(newOrder._id);
            await user.save();

            // Deduct Swago Money from User directly
            if (swagoMoneyRedeemed > 0) {
                // Conditional decrement: never take the wallet below zero under concurrency.
                const debit = await User.updateOne(
                    { _id: user._id, "ambassador.swagoMoney": { $gte: swagoMoneyRedeemed } },
                    { $inc: { "ambassador.swagoMoney": -swagoMoneyRedeemed } }
                );
                if (debit.modifiedCount !== 1) {
                    console.error(`🚨 [COD] Swago Money debit failed for order ${orderId} (insufficient balance at commit)`);
                    await Order.updateOne({ _id: newOrder._id }, { $set: { walletDebitFailed: true } });
                } else {
                    console.log(`💰 Deducted ${swagoMoneyRedeemed} SD from User ${user._id}`);
                }
            }
        } catch (linkError) {
            console.error('Could not link order to user:', linkError);
        }

        // Send confirmation email
        try {
            const orderObject = newOrder.toObject();
            await sendOrderConfirmationEmail({
                name: orderObject.name,
                orderNumber: orderId,
                orderDate: new Date().toLocaleString('en-IN'),
                email: orderObject.email,
                items: orderObject.items,
                subtotal: orderObject.subtotal.toFixed(2),
                discount: orderObject.discount.toFixed(2),
                swagoMoneyRedeemed: (orderObject.swagoMoneyRedeemed || 0).toFixed(2),
                shipping: (orderObject.shippingFee || 0).toFixed(2),
                totalAmount: orderObject.total.toFixed(2),
                paymentMethod: "Cash on Delivery",
                paymentStatus: "Pending",
                address: orderObject.address,
                city: orderObject.city,
                state: orderObject.state,
                pincode: orderObject.pincode,
            });

            // ✅ Fire Admin Email Asynchronously
            const adminItems = orderObject.items.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price.toFixed(2),
            }));

            sendAdminOrderNotificationEmail({
                orderNumber: orderId,
                orderDate: new Date().toLocaleString('en-IN'),
                customerName: orderObject.name,
                customerEmail: orderObject.email,
                customerPhone: orderObject.phone,
                shippingMethod: "Standard Shipping",
                paymentMethod: "Cash on Delivery",
                totalAmount: orderObject.total.toFixed(2),
                subtotal: orderObject.subtotal.toFixed(2),
                discount: orderObject.discount.toFixed(2),
                couponCode: orderObject.couponCode,
                swagoMoneyRedeemed: (orderObject.swagoMoneyRedeemed || 0).toFixed(2),
                shippingFee: (orderObject.shippingFee || 0).toFixed(2),
                items: adminItems,
                adminUrl: `https://admin.swagojr.com/orders/${orderObject._id}`,
                ...adminChargedAndShipTo(orderObject),
            }).catch(console.error);

        } catch (emailError) {
            console.error('Email failed:', emailError);
        }

        // Generate Invoice in background
        generateAndUploadInvoice(newOrder).catch(err => {
            console.error('Invoice generation failed:', err);
        });

        return NextResponse.json({
            success: true,
            orderId: orderId,
            mongoOrderId: newOrder._id.toString(),
            paymentMethod: 'cod',
        });

    } catch (error: any) {
        console.error("[COD] Error:", error);
        return NextResponse.json({ error: error.message || "Failed to create COD order" }, { status: 500 });
    }
}
