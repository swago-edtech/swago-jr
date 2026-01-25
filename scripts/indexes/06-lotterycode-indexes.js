// scripts/indexes/06-lotterycode-indexes.js

// require('dotenv').config({ path: '../../.env.local' });

const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env.local')
});

console.log("ENV KEYS:", Object.keys(process.env).filter(k => k.includes("MONGO")));
const mongoose = require('mongoose');

async function createLotteryCodeIndexes() {
  try {
    const ADMIN_URI = process.env.MONGODB_ADMIN_URI;
    
    if (!ADMIN_URI) {
      throw new Error('❌ MONGODB_ADMIN_URI not found in root .env.local');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(ADMIN_URI);
    
    const db = mongoose.connection.db;
    console.log('📊 Creating LotteryCode indexes...\n');

    // Index 1: code (unique - critical for lottery system)
    await db.collection('lotterycodes').createIndex(
      { code: 1 }, 
      { unique: true }
    );
    console.log('✅ Created: lotterycodes.code (unique)');

    // Index 2: productId (single field)
    await db.collection('lotterycodes').createIndex(
      { productId: 1 }
    );
    console.log('✅ Created: lotterycodes.productId');

    // Index 3: shortForm (single field)
    await db.collection('lotterycodes').createIndex(
      { shortForm: 1 }
    );
    console.log('✅ Created: lotterycodes.shortForm');

    // Index 4: isUsed (single field)
    await db.collection('lotterycodes').createIndex(
      { isUsed: 1 }
    );
    console.log('✅ Created: lotterycodes.isUsed');

    // Index 5: productId + isUsed (compound, for finding unused codes per product)
    await db.collection('lotterycodes').createIndex(
      { productId: 1, isUsed: 1 }
    );
    console.log('✅ Created: lotterycodes.productId + isUsed (compound)');

    // Index 6: usedBy + usedAt (compound, for user's lottery history)
    await db.collection('lotterycodes').createIndex(
      { usedBy: 1, usedAt: -1 }
    );
    console.log('✅ Created: lotterycodes.usedBy + usedAt (compound)');

    // Index 7: productId + shortForm (compound, for product-specific short form queries)
    await db.collection('lotterycodes').createIndex(
      { productId: 1, shortForm: 1 }
    );
    console.log('✅ Created: lotterycodes.productId + shortForm (compound)');

    console.log('\n✅ All LotteryCode indexes created successfully!');
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

createLotteryCodeIndexes();
