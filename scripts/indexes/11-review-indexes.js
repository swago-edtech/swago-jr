// scripts/indexes/11-review-indexes.js

require('dotenv').config({ path: '../../.env.local' });
const mongoose = require('mongoose');

async function createReviewIndexes() {
  try {
    const ADMIN_URI = process.env.MONGODB_ADMIN_URI;
    
    if (!ADMIN_URI) {
      throw new Error('❌ MONGODB_ADMIN_URI not found in root .env.local');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(ADMIN_URI);
    
    const db = mongoose.connection.db;
    console.log('📊 Creating Review indexes...\n');

    // Index 1: productId (for fast product lookup)
    await db.collection('reviews').createIndex(
      { productId: 1 }
    );
    console.log('✅ Created: reviews.productId');

    // Index 2: productId + status (compound, for getting approved reviews)
    await db.collection('reviews').createIndex(
      { productId: 1, status: 1 }
    );
    console.log('✅ Created: reviews.productId + status (compound)');

    // Index 3: userId + productId (compound, unique - one review per user per product)
    await db.collection('reviews').createIndex(
      { userId: 1, productId: 1 }, 
      { unique: true }
    );
    console.log('✅ Created: reviews.userId + productId (compound, unique)');

    // Index 4: orderId (for checking if order already reviewed)
    await db.collection('reviews').createIndex(
      { orderId: 1 }
    );
    console.log('✅ Created: reviews.orderId');

    // Index 5: status + createdAt (compound, for admin moderation queue)
    await db.collection('reviews').createIndex(
      { status: 1, createdAt: -1 }
    );
    console.log('✅ Created: reviews.status + createdAt (compound)');

    console.log('\n✅ All Review indexes created successfully!');
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

createReviewIndexes();
