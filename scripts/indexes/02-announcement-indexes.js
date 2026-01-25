// scripts/indexes/02-announcement-indexes.js

// require('dotenv').config({ path: '../../.env.local' });


const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env.local')
});

console.log("ENV KEYS:", Object.keys(process.env).filter(k => k.includes("MONGO")));
const mongoose = require('mongoose');

async function createAnnouncementIndexes() {
  try {
    const ADMIN_URI = process.env.MONGODB_ADMIN_URI;
    
    if (!ADMIN_URI) {
      throw new Error('❌ MONGODB_ADMIN_URI not found in root .env.local');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(ADMIN_URI);
    
    const db = mongoose.connection.db;
    console.log('📊 Creating Announcement indexes...\n');

    // Index 1: isActive (for filtering active announcements)
    await db.collection('announcements').createIndex(
      { isActive: 1 }
    );
    console.log('✅ Created: announcements.isActive');

    console.log('\n✅ All Announcement indexes created successfully!');
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

createAnnouncementIndexes();
