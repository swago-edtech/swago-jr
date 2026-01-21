// scripts/indexes/03-contactsubmission-indexes.js

require('dotenv').config({ path: '../../.env.local' });
const mongoose = require('mongoose');

async function createContactSubmissionIndexes() {
  try {
    const ADMIN_URI = process.env.MONGODB_ADMIN_URI;
    
    if (!ADMIN_URI) {
      throw new Error('❌ MONGODB_ADMIN_URI not found in root .env.local');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(ADMIN_URI);
    
    const db = mongoose.connection.db;
    console.log('📊 Creating ContactSubmission indexes...\n');

    // Index 1: status + createdAt (compound, for admin filtering)
    await db.collection('contactsubmissions').createIndex(
      { status: 1, createdAt: -1 }
    );
    console.log('✅ Created: contactsubmissions.status + createdAt (compound)');

    // Index 2: email (for looking up submissions by email)
    await db.collection('contactsubmissions').createIndex(
      { email: 1 }
    );
    console.log('✅ Created: contactsubmissions.email');

    // Index 3: isViewed (for notification queries)
    await db.collection('contactsubmissions').createIndex(
      { isViewed: 1 }
    );
    console.log('✅ Created: contactsubmissions.isViewed');

    console.log('\n✅ All ContactSubmission indexes created successfully!');
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

createContactSubmissionIndexes();
