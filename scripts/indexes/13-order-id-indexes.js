// scripts/indexes/13-order-id-indexes.js
// Creates indexes for the new orderId field and OrderCounter collection

require('dotenv').config({ path: '../../.env.local' });
const mongoose = require('mongoose');

async function createOrderIdIndexes() {
    try {
        const ADMIN_URI = process.env.MONGODB_ADMIN_URI;

        if (!ADMIN_URI) {
            throw new Error('❌ MONGODB_ADMIN_URI not found in root .env.local');
        }

        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(ADMIN_URI);

        const db = mongoose.connection.db;
        console.log('📊 Creating Order ID indexes...\n');

        // ========================================
        // ORDER COLLECTION INDEXES
        // ========================================

        // Index 1: orderId (unique, sparse - allows existing orders without orderId)
        await db.collection('orders').createIndex(
            { orderId: 1 },
            { unique: true, sparse: true }
        );
        console.log('✅ Created: orders.orderId (unique, sparse)');

        // Index 2: razorpay_order_id (for webhook lookups)
        await db.collection('orders').createIndex(
            { razorpay_order_id: 1 }
        );
        console.log('✅ Created: orders.razorpay_order_id');

        // Index 3: status + stockReservedAt (for abandoned order cleanup)
        await db.collection('orders').createIndex(
            { status: 1, stockReservedAt: 1 }
        );
        console.log('✅ Created: orders.status + stockReservedAt (for cleanup cron)');

        // ========================================
        // ORDER COUNTER COLLECTION INDEXES
        // ========================================

        // Index 1: date (unique, for daily sequence lookup)
        await db.collection('ordercounters').createIndex(
            { date: 1 },
            { unique: true }
        );
        console.log('✅ Created: ordercounters.date (unique)');

        console.log('\n✅ All Order ID indexes created successfully!');
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 11000) {
            console.error('⚠️  Duplicate key error - index may already exist');
        }
        if (error.code === 85) {
            console.error('⚠️  Index already exists with different options');
        }
        await mongoose.disconnect();
        process.exit(1);
    }
}

createOrderIdIndexes();
