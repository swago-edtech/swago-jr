import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Product, Order, User, Coupon as CouponModel, Promotion, InternationalConfig } from "@swago/database";
import { isValidObjectId } from "mongoose";
import { generateOrderId } from "@/lib/generateOrderId";
import { sendOrderConfirmationEmail } from "@/lib/msg91-email";
import { cleanupExpiredOrders } from "@/lib/cleanupExpiredOrders";
import { invalidateProductCache } from "@/lib/productCache";
import { validateCoupon } from "@/lib/coupon";
import { generateAndUploadInvoice } from "@/lib/invoice-service";


interface ProductDocument {
    _id: string;
    name: string;
    slug: string;
    stock: number;
    reservedStock?: number;
    totalSold?: number;
    isActive: boolean;
    save: () => Promise<void>;
    [key: string]: unknown;
}

interface CartItem {
    _id?: string;
    id?: number;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    images?: string[];
    slug?: string;
}

interface OrderItem {
    productId: number | string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

// Helper to get product by ID or slug
async function getProductById(id: string): Promise<ProductDocument | null> {
    try {
        let product = await Product.findOne({ slug: id, isActive: true });

        if (!product && isValidObjectId(id)) {
            product = await Product.findOne({ _id: id, isActive: true });
        }

        return product as ProductDocument | null;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

// Check if phone is Indian (+91)
function isIndianPhone(phone: string): boolean {
    if (!phone) return false;
    // Check for +91 prefix (with or without space/dash)
    return phone.startsWith('+91') || phone.startsWith('91') && phone.length >= 12;
}

export async function POST(req: Request) {
    try {
        const session = await getLoginSession();
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { totalAmount, orderDetails } = await req.json();

        if (!totalAmount || typeof totalAmount !== "number") {
            return NextResponse.json({ error: "A valid total amount is required" }, { status: 400 });
        }

        if (!orderDetails?.cart || !Array.isArray(orderDetails.cart) || orderDetails.cart.length === 0) {
            return NextResponse.json({ error: "Cart is required" }, { status: 400 });
        }

        const countryCode = orderDetails.country || 'IN';
        if (countryCode !== 'IN') {
            return NextResponse.json({
                error: "COD is only available in India",
                code: "INDIA_ONLY"
            }, { status: 400 });
        }

        
        const phone = orderDetails.phone || session.phone;
        if (!phone || !isIndianPhone(phone)) {
            return NextResponse.json({
                error: "COD is only available for Indian phone numbers (+91)",
                code: "INDIA_ONLY"
            }, { status: 400 });
        }

        // ========================================
        
        // ========================================
        console.log('🔍 [COD] Starting stock validation for', orderDetails.cart.length, 'items');

        await connectDB();

        
        const activePromotion = await Promotion.findOne().lean() as any;
        const isBlockedState = activePromotion?.blockedCodStates?.some((blockedState: string) => blockedState.toLowerCase() === orderDetails.state.toLowerCase());
        const isBlockedPincode = activePromotion?.blockedCodPincodes?.includes(orderDetails.pincode);
        if (isBlockedState || isBlockedPincode) {
            return NextResponse.json({ error: "COD is not available in your location" }, { status: 400 });
        }

        // Clean up expired orders first to release reserved stock
        await cleanupExpiredOrders();

        // Find the user
        let user = null;
        if (session.phone) {
            user = await User.findOne({ phone: session.phone });
        } else if (session.email) {
            user = await User.findOne({ email: session.email });
        }

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const stockErrors: string[] = [];
        const reservations: Array<{ product: ProductDocument; quantity: number }> = [];


        // Step 1: Validate all items have sufficient stock
        for (const item of orderDetails.cart) {
            const productId = item.id?.toString() || item.productId?.toString() || item._id;

            if (!productId) {
                stockErrors.push(`Invalid product ID for ${item.name}`);
                continue;
            }

            const product = await getProductById(productId);

            if (!product) {
                stockErrors.push(`${item.name} is no longer available`);
                continue;
            }

            const availableStock = Math.max(0, product.stock - (product.reservedStock || 0));

            if (availableStock === 0) {
                stockErrors.push(`${item.name} is out of stock`);
            } else if (item.quantity > availableStock) {
                stockErrors.push(`${item.name}: Only ${availableStock} available(you requested ${item.quantity})`);
            } else {
                reservations.push({ product, quantity: item.quantity });
            }
        }

        // If any stock errors, don't proceed
        if (stockErrors.length > 0) {
            return NextResponse.json({
                error: "Stock unavailable",
                stockErrors: stockErrors,
                details: stockErrors.join('; ')
            }, { status: 400 });
        }

        // Step 2: Reduce stock immediately for COD orders
        for (const { product, quantity } of reservations) {
            product.stock = Math.max(0, product.stock - quantity);
            product.totalSold = (product.totalSold || 0) + quantity;
            if (product.reservedStock && product.reservedStock < 0) {
                product.reservedStock = 0;
            }
            await product.save();

            try {
                invalidateProductCache(product.slug || '');
                invalidateProductCache(product._id.toString());
                revalidatePath(`/ product / ${product.slug} `);
                revalidatePath(`/ product / ${product._id} `);
                revalidatePath('/products');
                revalidatePath('/');
            } catch (e) {
                console.error('Revalidate path/cache failed', e);
            }
        }

        // ========================================
        // CALCULATE FINAL TOTAL ORDER
        // ========================================
        const orderId = await generateOrderId();

        // ZEPRO Reference: Server-side Bonus Item Validation
        // activePromotion is already fetched above

        const BONUS_THRESHOLDS: Record<string, number> = {};
        if (activePromotion?.isActive && activePromotion?.bonusItems) {
            activePromotion.bonusItems.forEach((item: any) => {
                BONUS_THRESHOLDS[item.slug] = item.threshold;
            });
        } else {
            // Fallback
            BONUS_THRESHOLDS['mini-swago-game-card'] = 999;
            BONUS_THRESHOLDS['special-edition-item'] = 1999;
        }

        // SECURITY FIX: Calculate non-bonus subtotal using DB prices, NOT frontend prices
        const nonBonusSubtotal = orderDetails.cart.reduce((sum: number, item: any) => {
            const productId = item.id?.toString() || item.productId?.toString() || item._id;
            const reservation = reservations.find(r =>
                r.product._id.toString() === productId ||
                r.product.slug === productId
            );
            const productPrice = reservation ? (reservation.product as any).price || 0 : item.price;

            const slugValue = item.slug || item.productId || item._id;
            if (item.price === 1 && BONUS_THRESHOLDS[slugValue as string]) return sum;

            return sum + (productPrice * item.quantity);
        }, 0);

        for (const item of orderDetails.cart) {
            const slugValue = item.slug || item.productId || item._id;
            if (item.price === 1 && BONUS_THRESHOLDS[slugValue]) {
                if (nonBonusSubtotal < BONUS_THRESHOLDS[slugValue]) {
                    console.error(`❌ Fraud Detection: Bonus item ${item.name} added without meeting threshold ₹${BONUS_THRESHOLDS[slugValue]}. Current subtotal: ₹${nonBonusSubtotal} `);
                    return NextResponse.json({ error: "Invalid bonus item threshold" }, { status: 400 });
                }
            }
        }

        // SECURITY FIX: Build order items using DB-verified prices (not frontend prices)
        const orderItems: OrderItem[] = orderDetails.cart.map((item: CartItem) => {
            const productId = item.id?.toString() || (item as any).productId?.toString() || item._id;
            const reservation = reservations.find(r =>
                r.product._id.toString() === productId ||
                r.product.slug === productId
            );

            const dbProduct = reservation?.product as any;
            let finalPrice = dbProduct?.price || item.price;

            const slugValue = item.slug || (item as any).productId || item._id;
            // Allow price of 1 if it passed the bonus threshold check above
            if (item.price === 1 && BONUS_THRESHOLDS[slugValue as string] && nonBonusSubtotal >= BONUS_THRESHOLDS[slugValue as string]) {
                finalPrice = 1;
            }

            return {
                productId: item._id || item.id || 0,
                name: dbProduct?.name || item.name,
                price: finalPrice,
                quantity: item.quantity,
                image: item.image || item.images?.[0] || '',
            };
        });

        // Subtotal from DB-verified order items (source of truth)
        const subtotal = orderItems.reduce(
            (sum: number, item: OrderItem) => sum + (item.price * item.quantity),
            0
        );

        let discountAmount = 0;
        let validatedCoupon = null;

        // Server-side coupon validation
        if (orderDetails.coupon?.code) {
            try {
                const { coupon, discountAmount: validatedDiscount } = await validateCoupon(
                    orderDetails.coupon.code,
                    subtotal
                );
                discountAmount = validatedDiscount;
                validatedCoupon = coupon;
            } catch (couponError: any) {
                console.error("Coupon validation failed during COD checkout:", couponError.message);
                return NextResponse.json({ error: `Coupon Error: ${couponError.message} ` }, { status: 400 });
            }
        }

        const calculatedAmountAfterCoupon = Math.max(0, subtotal - discountAmount);

        // NEW: Handle Swago Money Redemption
        const swagoMoneyRedeemed = orderDetails.swagoMoneyRedeemed || 0;

        if (swagoMoneyRedeemed > 0) {
            if (calculatedAmountAfterCoupon < 799) {
                return NextResponse.json({ error: "Order amount must be ₹799 or more to use Swago Dollars" }, { status: 400 });
            }

            const maxAllowed = Math.trunc(calculatedAmountAfterCoupon * 0.05);
            if (swagoMoneyRedeemed > maxAllowed) {
                return NextResponse.json({ error: `You can only use up to 5% (₹${maxAllowed}) of your order amount in Swago Dollars` }, { status: 400 });
            }

            // Verify User has enough — check directly on User
            const totalAvailable = user.ambassador?.swagoMoney || user.swagoMoney || 0;

            if (totalAvailable < swagoMoneyRedeemed) {
                return NextResponse.json({ error: "Insufficient Swago Dollars balance" }, { status: 400 });
            }
        }

        const shippingThreshold = activePromotion?.shippingThreshold || 1450;
        const shippingFee = calculatedAmountAfterCoupon >= shippingThreshold ? 0 : 50;
        const calculatedTotal = Math.max(0, calculatedAmountAfterCoupon - swagoMoneyRedeemed + shippingFee);

        // Create the order with COD payment method
        const newOrder = await Order.create({
            orderId: orderId,
            userId: new mongoose.Types.ObjectId(user._id),
            paymentMethod: 'cod',
            phone: orderDetails.phone,
            email: orderDetails.email,
            name: orderDetails.name,
            age: orderDetails.age,
            referralSource: orderDetails.referralSource,
            address: orderDetails.address,
            city: orderDetails.city,
            state: orderDetails.state,
            pincode: orderDetails.pincode,
            status: "Pending",
            items: orderItems,
            subtotal: subtotal,
            discount: discountAmount,
            shippingFee: shippingFee,
            internationalShippingFee: 0,
            total: calculatedTotal,
            swagoMoneyRedeemed: swagoMoneyRedeemed,
            swagoMoneyKidId: user._id, // Now references User directly
            stockReservedAt: new Date(),
            createdVia: 'frontend',
            country: countryCode,
            currency: 'INR',
            exchangeRateUsed: 1,
            displayTotal: calculatedTotal,
            ...(validatedCoupon && {
                couponCode: validatedCoupon.code,
                couponDetails: validatedCoupon,
            }),
        });

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
                await User.updateOne(
                    { _id: user._id },
                    { $inc: { "ambassador.swagoMoney": -swagoMoneyRedeemed } }
                );
                console.log(`💰 Deducted ${swagoMoneyRedeemed} SD from User ${user._id}`);
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
