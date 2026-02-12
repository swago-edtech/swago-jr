import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Order, User, Product, Coupon, KidProfile } from "@swago/database";
import { isValidObjectId } from "mongoose";
import { generateOrderId } from "@/lib/generateOrderId";
import { sendOrderConfirmationEmail } from "@/lib/msg91-email";
import { cleanupExpiredOrders } from "@/lib/cleanupExpiredOrders";
import { invalidateProductCache } from "@/lib/productCache";
import { validateCoupon } from "@/lib/coupon";

// ✅ Type definitions
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

// ✅ Check if phone is Indian (+91)
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

        // ✅ India-only check
        const phone = orderDetails.phone || session.phone;
        if (!phone || !isIndianPhone(phone)) {
            return NextResponse.json({
                error: "COD is only available for Indian phone numbers (+91)",
                code: "INDIA_ONLY"
            }, { status: 400 });
        }

        // ========================================
        // ✅ STOCK VALIDATION & RESERVATION
        // ========================================
        console.log('🔍 [COD] Starting stock validation for', orderDetails.cart.length, 'items');

        await connectDB();

        // ✅ Clean up expired orders first to release reserved stock
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
                stockErrors.push(`${item.name}: Only ${availableStock} available (you requested ${item.quantity})`);
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
            await product.save();

            try {
                invalidateProductCache(product.slug || '');
                invalidateProductCache(product._id.toString());
                revalidatePath(`/product/${product.slug}`);
                revalidatePath(`/product/${product._id}`);
                revalidatePath('/products');
                revalidatePath('/');
            } catch (e) {
                console.error('Revalidate path/cache failed', e);
            }
        }

        // ========================================
        // ✅ CREATE COD ORDER
        // ========================================
        const orderId = await generateOrderId();

        // Prepare order items
        const orderItems: OrderItem[] = orderDetails.cart.map((item: CartItem) => ({
            productId: item._id || item.id || 0,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image || item.images?.[0] || '',
        }));

        // Recalculate subtotal server-side
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
                return NextResponse.json({ error: `Coupon Error: ${couponError.message}` }, { status: 400 });
            }
        }

        const calculatedAmountAfterCoupon = Math.max(0, subtotal - discountAmount);

        // ✅ NEW: Handle Swago Money Redemption
        const swagoMoneyRedeemed = orderDetails.swagoMoneyRedeemed || 0;
        const swagoMoneyKidId = orderDetails.swagoMoneyKidId;

        const calculatedTotal = Math.max(0, calculatedAmountAfterCoupon - swagoMoneyRedeemed);

        // Create the order with COD payment method
        const newOrder = await Order.create({
            orderId: orderId,
            userId: new mongoose.Types.ObjectId(user._id),
            paymentMethod: 'cod',
            phone: orderDetails.phone,
            email: orderDetails.email,
            name: orderDetails.name,
            age: orderDetails.age,
            address: orderDetails.address,
            city: orderDetails.city,
            state: orderDetails.state,
            pincode: orderDetails.pincode,
            status: "Pending",
            items: orderItems,
            subtotal: subtotal,
            discount: discountAmount,
            total: calculatedTotal,
            swagoMoneyRedeemed: swagoMoneyRedeemed,
            swagoMoneyKidId: swagoMoneyKidId,
            stockReservedAt: new Date(),
            createdVia: 'frontend',
            ...(validatedCoupon && {
                couponCode: validatedCoupon.code,
                couponDetails: validatedCoupon,
            }),
        });

        // Increment coupon usage
        if (newOrder.couponCode) {
            await Coupon.updateOne(
                { code: newOrder.couponCode },
                { $inc: { usageCount: 1 } }
            );
        }

        // Link order to user
        try {
            user.orders.push(newOrder._id);
            await user.save();

            // ✅ NEW: Deduct Swago Money from Kid Profile if redeemed
            if (swagoMoneyRedeemed > 0 && swagoMoneyKidId) {
                await KidProfile.updateOne(
                    { _id: swagoMoneyKidId },
                    { $inc: { "ambassador.swagoMoney": -swagoMoneyRedeemed } }
                );
                console.log(`💰 Deducted ${swagoMoneyRedeemed} SD from KidProfile ${swagoMoneyKidId}`);
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
                shipping: "0.00",
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
