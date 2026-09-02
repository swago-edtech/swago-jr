import { connectDB, Order, Product } from '@swago/database';
import { isValidObjectId } from 'mongoose';
import { releaseInventoryAllocation } from './inventory-service';

const PAYMENT_EXPIRY_MINUTES = 10;

interface ExpiredOrder {
    _id: string;
    orderId?: string;
    items?: Array<{
        productId?: string | number;
        quantity: number;
    }>;
    inventoryAllocationStatus?: string;
}

export async function cleanupExpiredOrders(): Promise<number> {
    try {
        await connectDB();

        const expiryTime = new Date(Date.now() - (PAYMENT_EXPIRY_MINUTES * 60 * 1000));

        const expiredOrders = await Order.find({
            paymentMethod: { $ne: 'cod' },
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

            if (order.inventoryAllocationStatus === 'allocated') {
                await releaseInventoryAllocation(order);
            }

            if (!order.items) continue;

            for (const item of order.items) {
                if (!item.productId) continue;

                const productIdStr = String(item.productId);
                try {
                    let prod = await Product.findOne({ slug: productIdStr });
                    if (!prod && isValidObjectId(productIdStr)) {
                        prod = await Product.findById(productIdStr);
                    }
                    if (prod) {
                        prod.reservedStock = Math.max(0, (prod.reservedStock || 0) - item.quantity);
                        await prod.save();
                    }
                } catch (err) {
                    console.error(`Failed to release legacy reserved stock for product ${productIdStr}:`, err);
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
