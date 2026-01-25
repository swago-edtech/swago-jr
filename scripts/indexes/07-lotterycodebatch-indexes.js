// scripts/indexes/07-lotterycodebatch-indexes.js

// require('dotenv').config({ path: '../../.env.local' });

const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env.local')
});

console.log("ENV KEYS:", Object.keys(process.env).filter(k => k.includes("MONGO")));
const mongoose = require('mongoose');

async function createLotteryCodeBatchIndexes() {
  try {
    const ADMIN_URI = process.env.MONGODB_ADMIN_URI;
    
    if (!ADMIN_URI) {
      throw new Error('❌ MONGODB_ADMIN_URI not found in root .env.local');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(ADMIN_URI);
    
    const db = mongoose.connection.db;
    console.log('📊 Creating LotteryCodeBatch indexes...\n');

    // Index 1: batchNumber (unique - prevents duplicate batch generation)
    await db.collection('lotterycodebatches').createIndex(
      { batchNumber: 1 }, 
      { unique: true }
    );
    console.log('✅ Created: lotterycodebatches.batchNumber (unique)');

    // Index 2: productId (for filtering batches by product)
    await db.collection('lotterycodebatches').createIndex(
      { productId: 1 }
    );
    console.log('✅ Created: lotterycodebatches.productId');

    // Index 3: shortForm (for filtering batches by short form)
    await db.collection('lotterycodebatches').createIndex(
      { shortForm: 1 }
    );
    console.log('✅ Created: lotterycodebatches.shortForm');

    // Index 4: status (for filtering by batch status)
    await db.collection('lotterycodebatches').createIndex(
      { status: 1 }
    );
    console.log('✅ Created: lotterycodebatches.status');

    // Index 5: generatedAt (descending, for chronological sorting)
    await db.collection('lotterycodebatches').createIndex(
      { generatedAt: -1 }
    );
    console.log('✅ Created: lotterycodebatches.generatedAt (desc)');

    console.log('\n✅ All LotteryCodeBatch indexes created successfully!');
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

createLotteryCodeBatchIndexes();
