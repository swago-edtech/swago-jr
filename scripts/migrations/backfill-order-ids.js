// scripts/migrations/backfill-order-ids.js
// Backfills existing orders with orderId in SW-OLD-XXXXXX format

require('dotenv').config({ path: '../.env.local' });
const mongoose = require('mongoose');

async function backfillOrderIds() {
    try {
        const ADMIN_URI = process.env.MONGODB_ADMIN_URI;

        if (!ADMIN_URI) {
            throw new Error('❌ MONGODB_ADMIN_URI not found in .env.local');
        }

        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(ADMIN_URI);

        const db = mongoose.connection.db;
        console.log('✅ Connected to MongoDB\n');

        // Find all orders without orderId
        const ordersWithoutId = await db.collection('orders')
            .find({ orderId: { $exists: false } })
            .sort({ createdAt: 1 })  // Oldest first
            .toArray();

        console.log(`📦 Found ${ordersWithoutId.length} orders without orderId\n`);

        if (ordersWithoutId.length === 0) {
            console.log('✅ No orders need backfilling!');
            await mongoose.disconnect();
            process.exit(0);
        }

        // Backfill each order with SW-OLD-XXXXXX format
        let updated = 0;
        let errors = 0;

        for (let i = 0; i < ordersWithoutId.length; i++) {
            const order = ordersWithoutId[i];
            const sequence = (i + 1).toString().padStart(6, '0');
            const orderId = `SW-OLD-${sequence}`;

            try {
                await db.collection('orders').updateOne(
                    { _id: order._id },
                    { $set: { orderId: orderId } }
                );
                updated++;

                // Log progress every 100 orders
                if (updated % 100 === 0) {
                    console.log(`📝 Processed ${updated}/${ordersWithoutId.length} orders...`);
                }
            } catch (error) {
                console.error(`❌ Failed to update order ${order._id}:`, error.message);
                errors++;
            }
        }

        console.log('\n========================================');
        console.log(`✅ Successfully backfilled ${updated} orders`);
        if (errors > 0) {
            console.log(`⚠️  Failed to update ${errors} orders`);
        }
        console.log('========================================\n');

        // Show sample of updated orders
        console.log('📋 Sample of updated orders:');
        const samples = await db.collection('orders')
            .find({ orderId: { $regex: /^SW-OLD-/ } })
            .sort({ createdAt: -1 })
            .limit(5)
            .project({ orderId: 1, name: 1, createdAt: 1, status: 1 })
            .toArray();

        samples.forEach(order => {
            console.log(`   ${order.orderId} - ${order.name} - ${order.status} - ${new Date(order.createdAt).toLocaleDateString()}`);
        });

        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration error:', error.message);
        console.error(error.stack);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Prompt for confirmation
console.log('========================================');
console.log('🔄 ORDER ID BACKFILL MIGRATION');
console.log('========================================');
console.log('');
console.log('This script will:');
console.log('1. Find all orders without orderId');
console.log('2. Assign them IDs in format: SW-OLD-000001, SW-OLD-000002, etc.');
console.log('');
console.log('Starting migration in 3 seconds...');
console.log('(Press Ctrl+C to cancel)\n');

setTimeout(backfillOrderIds, 3000);
