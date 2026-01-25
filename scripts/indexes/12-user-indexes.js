// scripts/indexes/12-user-indexes.js

// require('dotenv').config({ path: '../../.env.local' });

const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env.local')
});

console.log("ENV KEYS:", Object.keys(process.env).filter(k => k.includes("MONGO")));

const mongoose = require('mongoose');

async function createUserIndexes() {
  try {
    const ADMIN_URI = process.env.MONGODB_ADMIN_URI;
    
    if (!ADMIN_URI) {
      throw new Error('❌ MONGODB_ADMIN_URI not found in root .env.local');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(ADMIN_URI);
    
    const db = mongoose.connection.db;
    console.log('📊 Creating User indexes...\n');

    // Index 1: phone (unique, sparse - allows null, critical for phone auth)
    await db.collection('users').createIndex(
      { phone: 1 }, 
      { unique: true, sparse: true }
    );
    console.log('✅ Created: users.phone (unique, sparse)');

    // Index 2: email (unique, sparse - allows null, critical for email auth)
    await db.collection('users').createIndex(
      { email: 1 }, 
      { unique: true, sparse: true }
    );
    console.log('✅ Created: users.email (unique, sparse)');

    // Index 3: isAdmin (for admin user queries)
    await db.collection('users').createIndex(
      { isAdmin: 1 }
    );
    console.log('✅ Created: users.isAdmin');

    console.log('\n✅ All User indexes created successfully!');
    console.log('🎉 AUTHENTICATION INDEXES ARE NOW SECURE!\n');
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

createUserIndexes();
