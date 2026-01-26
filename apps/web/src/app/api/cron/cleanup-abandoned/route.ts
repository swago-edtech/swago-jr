import { NextRequest, NextResponse } from "next/server";
import { connectDB, Order, Product } from "@swago/database";
import { isValidObjectId } from "mongoose";
import { invalidateProductCache } from "@/lib/productCache";


// ✅ Type for product document
interface ProductDocument {
    _id: string;
    name: string;
    slug?: string;
    stock: number;
    reservedStock?: number;
    save: () => Promise<void>;
    [key: string]: unknown;
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


// ✅ Helper to get product by ID or slug
async function getProductById(id: string | number): Promise<ProductDocument | null> {
    try {
        const idString = id.toString();

        let product = await Product.findOne({ slug: idString });

        if (!product && isValidObjectId(idString)) {
            product = await Product.findOne({ _id: idString });
        }

        return product as ProductDocument | null;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}


/**
 * Cron job to mark abandoned orders and release reserved stock
 * 
 * This endpoint should be called periodically (e.g., every 15 minutes)
 * by a cron service like Vercel Cron or similar.
 * 
 * Configuration:
 * - CRON_SECRET environment variable must match the Authorization header
 * - ABANDONED_ORDER_TIMEOUT_MINUTES (default: 30) defines how long to wait
 */
export async function GET(req: NextRequest) {
    const timestamp = new Date().toISOString();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🕐 [${timestamp}] Abandoned order cleanup started`);

    try {
        // Verify cron secret
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            console.log('⚠️ CRON_SECRET not configured - allowing request in dev mode');
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
            }
        } else if (authHeader !== `Bearer ${cronSecret}`) {
            console.log('❌ Unauthorized cron request');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Get timeout in minutes (default 10 - matches frontend payment window)
        const timeoutMinutes = parseInt(process.env.ABANDONED_ORDER_TIMEOUT_MINUTES || '10', 10);
        const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

        console.log(`⏰ Looking for Pending orders older than ${timeoutMinutes} minutes`);
        console.log(`📅 Cutoff time: ${cutoffTime.toISOString()}`);

        // Find orders that are Pending and were created more than X minutes ago
        const abandonedOrders = await Order.find({
            status: 'Pending',
            $or: [
                { stockReservedAt: { $lt: cutoffTime } },
                { stockReservedAt: { $exists: false }, createdAt: { $lt: cutoffTime } }
            ]
        }).limit(100);  // Process in batches

        console.log(`📦 Found ${abandonedOrders.length} abandoned orders to process`);

        if (abandonedOrders.length === 0) {
            console.log('✅ No abandoned orders to process');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return NextResponse.json({
                processed: 0,
                message: 'No abandoned orders found'
            });
        }

        let processed = 0;
        let errors = 0;
        let stockReleased = 0;

        for (const order of abandonedOrders) {
            try {
                console.log(`\n🔄 Processing order: ${order.orderId || order._id}`);

                // Release reserved stock for each item
                for (const item of order.items) {
                    const productId = item.productId;
                    if (!productId) continue;

                    if (isHardcodedProduct(productId)) {
                        console.log(`   ⏭️ Skipping hardcoded product: ${item.name}`);
                        continue;
                    }

                    const product = await getProductById(productId);
                    if (!product) {
                        console.log(`   ⚠️ Product not found: ${item.name}`);
                        continue;
                    }

                    const quantity = item.quantity || 1;
                    const oldReserved = product.reservedStock || 0;

                    // Only release if there's reserved stock
                    if (oldReserved > 0) {
                        product.reservedStock = Math.max(0, oldReserved - quantity);
                        await product.save();
                        stockReleased += quantity;
                        console.log(`   🔓 Released ${quantity} of ${product.name}`);

                        try {
                            invalidateProductCache(product.slug || '');
                            invalidateProductCache(product._id.toString());
                        } catch (cacheError) {
                            // Non-critical
                        }
                    }
                }

                // Mark order as Abandoned
                order.status = 'Abandoned';
                await order.save();
                processed++;

                console.log(`   ✅ Order ${order.orderId || order._id} marked as Abandoned`);

            } catch (orderError) {
                console.error(`   ❌ Error processing order ${order._id}:`, orderError);
                errors++;
            }
        }

        const summary = {
            processed,
            errors,
            stockReleased,
            timestamp: new Date().toISOString()
        };

        console.log('\n========================================');
        console.log('📊 Cleanup Summary:');
        console.log(`   ✅ Orders processed: ${processed}`);
        console.log(`   🔓 Stock units released: ${stockReleased}`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return NextResponse.json(summary);

    } catch (error) {
        console.error('💥 Cleanup cron error:', error);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return NextResponse.json({
            error: 'Cleanup failed',
            message: (error as Error).message
        }, { status: 500 });
    }
}
