import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Product, Order, User } from "@swago/database";
import { isValidObjectId } from "mongoose";
import { generateOrderId } from "@/lib/generateOrderId";
import { sendOrderConfirmationEmail } from "@/lib/msg91-email";
import { cleanupExpiredOrders } from "@/lib/cleanupExpiredOrders";
import { invalidateProductCache } from "@/lib/productCache";

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

// ✅ Helper to detect hardcoded products
function isHardcodedProduct(productId: string | number | undefined): boolean {
    if (!productId) return false;

    if (typeof productId === 'number') {
        return productId >= 1 && productId <= 100;
    }

    const idString = productId.toString();

    if (idString.startsWith('hardcoded-')) {
        const numericPart = parseInt(idString.replace('hardcoded-', ''), 10);
        return !isNaN(numericPart) && numericPart >= 1 && numericPart <= 100;
    }

    const numericId = Number(idString);
    return !isNaN(numericId) && numericId >= 1 && numericId <= 100;
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

        // ✅ DEBUG: Log full cart structure
        console.log('━━━━━━━━━━━━━━━━━━━━━━━ COD CART DEBUG ━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Full cart:', JSON.stringify(orderDetails.cart, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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
            // ✅ FIXED: Check numeric id FIRST (for hardcoded products), then productId, then _id
            // MongoDB embeds add _id to subdocuments, so we need to prioritize the product's actual ID
            const productId = item.id?.toString() || item.productId?.toString() || item._id;

            console.log('🔍 [COD] Item:', item.name);
            console.log('   item.id:', item.id, 'item.productId:', item.productId, 'item._id:', item._id);
            console.log('   Final productId:', productId, 'isHardcoded:', isHardcodedProduct(productId));

            if (!productId) {
                stockErrors.push(`Invalid product ID for ${item.name}`);
                continue;
            }

            // Skip hardcoded products
            if (isHardcodedProduct(productId)) {
                console.log(`⏭️ [COD] Skipping stock check for hardcoded product: ${item.name}`);
                continue;
            }

            // Database products - check stock
            const product = await getProductById(productId);

            if (!product) {
                stockErrors.push(`${item.name} is no longer available`);
                continue;
            }

            const availableStock = Math.max(0, product.stock - (product.reservedStock || 0));

            console.log(`📦 [COD] ${product.name}: Available=${availableStock}, Requested=${item.quantity}`);

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
            console.log('❌ [COD] Stock validation failed:', stockErrors);
            return NextResponse.json({
                error: "Stock unavailable",
                stockErrors: stockErrors,
                details: stockErrors.join('; ')
            }, { status: 400 });
        }

        // Step 2: Reduce stock immediately for COD orders
        // ✅ FIXED: COD orders are confirmed immediately, so we reduce actual stock (not just reserve)
        console.log('✅ [COD] Stock validation passed. Reducing stock...');

        for (const { product, quantity } of reservations) {
            // Store old values for logging
            const oldStock = product.stock;
            const oldSold = product.totalSold || 0;

            // Reduce actual stock
            product.stock = Math.max(0, product.stock - quantity);

            // Increase total sold
            product.totalSold = (product.totalSold || 0) + quantity;

            await product.save();

            console.log(`✅ [COD] ${product.name}:`);
            console.log(`   📦 Stock: ${oldStock} → ${product.stock} (reduced by ${quantity})`);
            console.log(`   📊 Total Sold: ${oldSold} → ${product.totalSold}`);

            // Invalidate product cache (in-memory)
            try {
                invalidateProductCache(product.slug || '');
                invalidateProductCache(product._id.toString());
            } catch (cacheError) {
                console.error('⚠️ Cache invalidation failed (non-critical):', cacheError);
            }

            // ✅ Force revalidate paths ensuring instant reflection
            try {
                revalidatePath(`/product/${product.slug}`);
                revalidatePath(`/product/${product._id}`);
                revalidatePath('/products');
                revalidatePath('/'); // Homepage might have featured products
            } catch (e) {
                console.error('Revalidate path failed', e);
            }
        }

        // ========================================
        // ✅ CREATE COD ORDER
        // ========================================
        console.log('📝 [COD] Creating order...');

        const orderId = await generateOrderId();
        console.log('✅ [COD] Generated Order ID:', orderId);

        // Prepare order items
        const orderItems: OrderItem[] = orderDetails.cart.map((item: CartItem) => ({
            productId: item._id || item.id || 0,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image || item.images?.[0] || '',
        }));

        // Calculate totals
        const subtotal = orderDetails.originalAmount || orderItems.reduce(
            (sum: number, item: OrderItem) => sum + (item.price * item.quantity),
            0
        );
        const discountAmount = orderDetails.discount?.savedAmount || 0;

        // Create the order with COD payment method
        const newOrder = await Order.create({
            orderId: orderId,
            userId: new mongoose.Types.ObjectId(user._id),
            paymentMethod: 'cod',  // ✅ COD payment method
            phone: orderDetails.phone,
            email: orderDetails.email,
            name: orderDetails.name,
            age: orderDetails.age,
            address: orderDetails.address,
            city: orderDetails.city,
            state: orderDetails.state,
            pincode: orderDetails.pincode,
            status: "Pending",  // ← Stays Pending until delivery
            items: orderItems,
            subtotal: subtotal,
            discount: discountAmount,
            total: totalAmount,
            stockReservedAt: new Date(),
            createdVia: 'frontend',
            ...(orderDetails.coupon && {
                couponCode: orderDetails.coupon.code,
                couponDetails: orderDetails.coupon,
            }),
        });

        console.log('✅ [COD] Order created:', orderId);

        // Link order to user
        try {
            user.orders.push(newOrder._id);
            await user.save();
            console.log('✅ [COD] Order linked to user');
        } catch (linkError) {
            console.error('⚠️ [COD] Could not link order to user:', linkError);
        }

        // ========================================
        // ✅ SEND CONFIRMATION EMAIL
        // ========================================
        try {
            const orderObject = newOrder.toObject();

            interface OrderItemFromDb {
                name: string;
                quantity: number;
                price: number;
            }

            const itemsHtml = orderObject.items.map((item: OrderItemFromDb) => `
        <tr class="item-row">
          <td class="item-name">${item.name}</td>
          <td class="item-qty">x${item.quantity}</td>
          <td class="item-price">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `).join('');

            await sendOrderConfirmationEmail({
                name: orderObject.name,
                orderNumber: orderId,
                orderDate: new Date().toLocaleString('en-IN'),
                email: orderObject.email,
                items: itemsHtml,
                totalAmount: orderObject.total.toFixed(2),
                address: orderObject.address,
                city: orderObject.city,
                state: orderObject.state,
                pincode: orderObject.pincode,
            });

            console.log('✅ [COD] Confirmation email sent');
        } catch (emailError) {
            console.error('⚠️ [COD] Email failed (order still created):', emailError);
        }

        return NextResponse.json({
            success: true,
            orderId: orderId,
            mongoOrderId: newOrder._id.toString(),
            paymentMethod: 'cod',
            message: 'COD order placed successfully'
        });

    } catch (error: unknown) {
        console.error("[COD] Order creation error:", error);

        let errorMessage = "Failed to create COD order";
        if (error instanceof Error) {
            errorMessage = error.message || errorMessage;
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
