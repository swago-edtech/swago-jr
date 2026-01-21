// scripts/indexes/10-productcode-indexes.js

require('dotenv').config({ path: '../../.env.local' });
const mongoose = require('mongoose');

async function createProductCodeIndexes() {
  try {
    const ADMIN_URI = process.env.MONGODB_ADMIN_URI;
    
    if (!ADMIN_URI) {
      throw new Error('❌ MONGODB_ADMIN_URI not found in root .env.local');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(ADMIN_URI);
    
    const db = mongoose.connection.db;
    console.log('📊 Creating ProductCode indexes...\n');

    // Index 1: code (unique - prevents duplicate product unlock codes)
    await db.collection('productcodes').createIndex(
      { code: 1 }, 
      { unique: true }
    );
    console.log('✅ Created: productcodes.code (unique)');

    // Index 2: orderId (for finding codes by order)
    await db.collection('productcodes').createIndex(
      { orderId: 1 }
    );
    console.log('✅ Created: productcodes.orderId');

    // Index 3: isUsed (for finding unused codes)
    await db.collection('productcodes').createIndex(
      { isUsed: 1 }
    );
    console.log('✅ Created: productcodes.isUsed');

    // Index 4: orderId + productId (compound, for finding codes by order and product)
    await db.collection('productcodes').createIndex(
      { orderId: 1, productId: 1 }
    );
    console.log('✅ Created: productcodes.orderId + productId (compound)');

    // Index 5: usedBy (for finding codes used by a kid profile)
    await db.collection('productcodes').createIndex(
      { usedBy: 1 }
    );
    console.log('✅ Created: productcodes.usedBy');

    console.log('\n✅ All ProductCode indexes created successfully!');
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

createProductCodeIndexes();
