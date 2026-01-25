// scripts/indexes/01-ambassadorapplication-indexes.js

// require('dotenv').config({ path: '../../.env.local' }); // Points to ROOT .env.local

const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env.local')
});

console.log("ENV KEYS:", Object.keys(process.env).filter(k => k.includes("MONGO")));
const mongoose = require('mongoose');

async function createAmbassadorApplicationIndexes() {
  try {
    const ADMIN_URI = process.env.MONGODB_ADMIN_URI;
    
    if (!ADMIN_URI) {
      throw new Error('❌ MONGODB_ADMIN_URI not found in root .env.local');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(ADMIN_URI);
    
    const db = mongoose.connection.db;
    console.log('📊 Creating AmbassadorApplication indexes...\n');

    // Index 1: parentEmail (unique)
    await db.collection('ambassadorapplications').createIndex(
      { parentEmail: 1 }, 
      { unique: true }
    );
    console.log('✅ Created: ambassadorapplications.parentEmail (unique)');

    // Index 2: status + createdAt (compound, for admin filtering)
    await db.collection('ambassadorapplications').createIndex(
      { status: 1, createdAt: -1 }
    );
    console.log('✅ Created: ambassadorapplications.status + createdAt (compound)');

    // Index 3: createdAt (for sorting by date)
    await db.collection('ambassadorapplications').createIndex(
      { createdAt: -1 }
    );
    console.log('✅ Created: ambassadorapplications.createdAt (desc)');

    console.log('\n✅ All AmbassadorApplication indexes created successfully!');
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

createAmbassadorApplicationIndexes();
