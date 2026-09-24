import { connectDB, Order, Product, releaseInventoryAllocation } from '@swago/database';

// ✅ Payment window expiry time in minutes (must match web/orders/page.tsx)
const PAYMENT_EXPIRY_MINUTES = 10;

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

        // Find expired prepaid orders (need inventory fields for BOM release)
        const expiredOrders = await Order.find({
            paymentMethod: { $ne: 'cod' },  // Not COD (prepaid only)
            status: { $in: ['Pending', 'pending'] },
            createdAt: { $lt: expiryTime }
        });

        if (expiredOrders.length === 0) {
            return 0;
        }

        console.log(`🧹 Found ${expiredOrders.length} expired prepaid orders to mark as abandoned`);

        for (const order of expiredOrders) {
            order.status = 'Abandoned';
            await order.save();

            // Restock BOM inventory allocated during prepaid reserve
            if (order.inventoryAllocationStatus === 'allocated') {
                await releaseInventoryAllocation(order);
            }

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
                    const prod = await Product.findById(productIdStr);
                    if (prod) {
                        prod.reservedStock = Math.max(0, (prod.reservedStock || 0) - item.quantity);
                        await prod.save();
                        console.log(`Released ${item.quantity} reserved stock for product ${productIdStr}`);
                    }
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
