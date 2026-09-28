// scripts/indexes/14-howtoplay-indexes.js
// Creates indexes for the HowToPlay collection (/how-to-play/<slug> pages)

require('dotenv').config({ path: '../../.env.local' });
const mongoose = require('mongoose');

async function createHowToPlayIndexes() {
    try {
        const ADMIN_URI = process.env.MONGODB_ADMIN_URI;

        if (!ADMIN_URI) {
            throw new Error('❌ MONGODB_ADMIN_URI not found in root .env.local');
        }

        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(ADMIN_URI);

        const db = mongoose.connection.db;
        console.log('📊 Creating HowToPlay indexes...\n');

        await db.collection('howtoplays').createIndex({ slug: 1 }, { unique: true });
        console.log('✅ Created: howtoplays.slug (unique)');

        console.log('\n✅ All HowToPlay indexes created successfully!');
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 11000) {
            console.error('⚠️  Duplicate slugs exist - fix them before creating the unique index');
        }
        if (error.code === 85) {
            console.error('⚠️  Index already exists with different options');
        }
        await mongoose.disconnect();
        process.exit(1);
    }
}

createHowToPlayIndexes();
