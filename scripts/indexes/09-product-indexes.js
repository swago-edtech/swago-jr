// scripts/indexes/09-product-indexes.js

// require('dotenv').config({ path: '../../.env.local' });

const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env.local')
});
console.log("ENV KEYS:", Object.keys(process.env).filter(k => k.includes("MONGO")));
const mongoose = require('mongoose');

async function createProductIndexes() {
  try {
    const ADMIN_URI = process.env.MONGODB_ADMIN_URI;
    
    if (!ADMIN_URI) {
      throw new Error('❌ MONGODB_ADMIN_URI not found in root .env.local');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(ADMIN_URI);
    
    const db = mongoose.connection.db;
    console.log('📊 Creating Product indexes...\n');

    // Index 1: slug (unique - for SEO-friendly URLs)
    await db.collection('products').createIndex(
      { slug: 1 }, 
      { unique: true }
    );
    console.log('✅ Created: products.slug (unique)');

    // Index 2: isActive + createdAt (compound, for listing active products)
    await db.collection('products').createIndex(
      { isActive: 1, createdAt: -1 }
    );
    console.log('✅ Created: products.isActive + createdAt (compound)');

    // Index 3: stock (for inventory management queries)
    await db.collection('products').createIndex(
      { stock: 1 }
    );
    console.log('✅ Created: products.stock');

    // Index 4: isFeatured + isActive (compound, for featured products section)
    await db.collection('products').createIndex(
      { isFeatured: 1, isActive: 1 }
    );
    console.log('✅ Created: products.isFeatured + isActive (compound)');

    // Index 5: ageCategory + isActive (compound, for age-based filtering)
    await db.collection('products').createIndex(
      { ageCategory: 1, isActive: 1 }
    );
    console.log('✅ Created: products.ageCategory + isActive (compound)');

    // Index 6: coreElements + isActive (compound, for SWAGO element filtering)
    await db.collection('products').createIndex(
      { coreElements: 1, isActive: 1 }
    );
    console.log('✅ Created: products.coreElements + isActive (compound)');

    // Index 7: shortForms (for lottery code lookup)
    await db.collection('products').createIndex(
      { shortForms: 1 }
    );
    console.log('✅ Created: products.shortForms');

    console.log('\n✅ All Product indexes created successfully!');
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

createProductIndexes();
