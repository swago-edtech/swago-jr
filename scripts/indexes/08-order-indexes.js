// scripts/indexes/08-order-indexes.js

require('dotenv').config({ path: '../../.env.local' });
const mongoose = require('mongoose');

async function createOrderIndexes() {
  try {
    const ADMIN_URI = process.env.MONGODB_ADMIN_URI;
    
    if (!ADMIN_URI) {
      throw new Error('❌ MONGODB_ADMIN_URI not found in root .env.local');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(ADMIN_URI);
    
    const db = mongoose.connection.db;
    console.log('📊 Creating Order indexes...\n');

    // Index 1: razorpay_payment_id (unique, sparse - allows null values)
    await db.collection('orders').createIndex(
      { razorpay_payment_id: 1 }, 
      { unique: true, sparse: true }
    );
    console.log('✅ Created: orders.razorpay_payment_id (unique, sparse)');

    // Index 2: userId + createdAt (compound, for user's order history)
    await db.collection('orders').createIndex(
      { userId: 1, createdAt: -1 }
    );
    console.log('✅ Created: orders.userId + createdAt (compound)');

    // Index 3: phone + createdAt (compound, backward compatibility)
    await db.collection('orders').createIndex(
      { phone: 1, createdAt: -1 }
    );
    console.log('✅ Created: orders.phone + createdAt (compound)');

    // Index 4: status + createdAt (compound, for admin filtering by status)
    await db.collection('orders').createIndex(
      { status: 1, createdAt: -1 }
    );
    console.log('✅ Created: orders.status + createdAt (compound)');

    // Index 5: createdAt (descending, for chronological sorting)
    await db.collection('orders').createIndex(
      { createdAt: -1 }
    );
    console.log('✅ Created: orders.createdAt (desc)');

    console.log('\n✅ All Order indexes created successfully!');
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('⚠️  Duplicate key error - index may already exist or there is duplicate data');
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

createOrderIndexes();
