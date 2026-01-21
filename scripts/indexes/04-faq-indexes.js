// scripts/indexes/04-faq-indexes.js

require('dotenv').config({ path: '../../.env.local' });
const mongoose = require('mongoose');

async function createFAQIndexes() {
  try {
    const ADMIN_URI = process.env.MONGODB_ADMIN_URI;
    
    if (!ADMIN_URI) {
      throw new Error('❌ MONGODB_ADMIN_URI not found in root .env.local');
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(ADMIN_URI);
    
    const db = mongoose.connection.db;
    console.log('📊 Creating FAQ indexes...\n');

    // Index 1: isActive + order (compound, for sorting active FAQs)
    await db.collection('faqs').createIndex(
      { isActive: 1, order: 1 }
    );
    console.log('✅ Created: faqs.isActive + order (compound)');

    // Index 2: category + isActive (compound, for filtering by category)
    await db.collection('faqs').createIndex(
      { category: 1, isActive: 1 }
    );
    console.log('✅ Created: faqs.category + isActive (compound)');

    // Index 3: category + order (compound, for sorting within category)
    await db.collection('faqs').createIndex(
      { category: 1, order: 1 }
    );
    console.log('✅ Created: faqs.category + order (compound)');

    // Index 4: Text search on question and answer
    try {
      await db.collection('faqs').createIndex(
        { question: "text", answer: "text" }
        // No custom name - use MongoDB's default naming
      );
      console.log('✅ Created: faqs.question + answer (text search)');
    } catch (error) {
      if (error.code === 85 || error.message.includes('already exists')) {
        console.log('⚠️  Text index already exists - skipping (this is OK)');
      } else {
        throw error;
      }
    }

    console.log('\n✅ All FAQ indexes created successfully!');
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

createFAQIndexes();
