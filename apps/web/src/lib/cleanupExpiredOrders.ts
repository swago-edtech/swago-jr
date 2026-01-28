import { connectDB, Order, Product } from '@swago/database';

// ✅ Payment window expiry time in minutes (must match web/orders/page.tsx)
const PAYMENT_EXPIRY_MINUTES = 10;

interface ExpiredOrder {
    _id: string;
    orderId?: string;
    items?: Array<{
        productId?: string | number;
        quantity: number;
    }>;
}

/**
 * Mark expired prepaid orders as "Abandoned" and release reserved stock.
 * 
 * Criteria for abandonment:
 * - paymentMethod is NOT 'cod' (prepaid only)
 * - status is 'Pending' or 'pending'
 * - createdAt is older than PAYMENT_EXPIRY_MINUTES
 * 
 * @returns Number of orders marked as abandoned
 */
export async function cleanupExpiredOrders(): Promise<number> {
    try {
        await connectDB();

        const expiryTime = new Date(Date.now() - (PAYMENT_EXPIRY_MINUTES * 60 * 1000));

        // Find expired prepaid orders
        const expiredOrders = await Order.find({
            paymentMethod: { $ne: 'cod' },  // Not COD (prepaid only)
            status: { $in: ['Pending', 'pending'] },
            createdAt: { $lt: expiryTime }
        }).select('_id orderId items').lean() as ExpiredOrder[];

        if (expiredOrders.length === 0) {
            return 0;
        }

        console.log(`🧹 Found ${expiredOrders.length} expired prepaid orders to mark as abandoned`);

        // Mark orders as abandoned
        const orderIds = expiredOrders.map(o => o._id);
        await Order.updateMany(
            { _id: { $in: orderIds } },
            { $set: { status: 'Abandoned' } }
        );

        // Release reserved stock for each order
        for (const order of expiredOrders) {
            if (!order.items) continue;

            for (const item of order.items) {
                // Skip if no productId
                if (!item.productId) continue;

                const productIdStr = String(item.productId);

                // Only process MongoDB ObjectIds (24 hex characters)
                if (!/^[a-fA-F0-9]{24}$/.test(productIdStr)) {
                    continue;
                }

                try {
                    await Product.findByIdAndUpdate(
                        productIdStr,
                        { $inc: { reservedStock: -item.quantity } }
                    );
                    console.log(`Released ${item.quantity} reserved stock for product ${productIdStr}`);
                } catch (err) {
                    console.error(`Failed to release stock for product ${productIdStr}:`, err);
                }
            }
        }

        console.log(`✅ Marked ${expiredOrders.length} orders as Abandoned`);
        return expiredOrders.length;

    } catch (error) {
        console.error('Error cleaning up expired orders:', error);
        return 0;
    }
}
