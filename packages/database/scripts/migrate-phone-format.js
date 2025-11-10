// packages/database/scripts/migrate-phone-format.js
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Try multiple .env.local locations
const envPaths = [
  path.resolve(__dirname, '../../../.env.local'),
  path.resolve(__dirname, '../../../apps/web/.env.local'),
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`✅ Loaded environment from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.error('❌ No .env.local file found');
  process.exit(1);
}

async function migratePhoneFormat() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // === ANALYZE CURRENT STATE === //
    console.log('\n📊 Analyzing current data...\n');

    // Users analysis
    const totalUsers = await db.collection('users').countDocuments({ phone: { $exists: true, $ne: null } });
    const usersWithPlus = await db.collection('users').countDocuments({ phone: /^\+/ });
    const usersWithoutPlus = await db.collection('users').countDocuments({ 
      phone: { $exists: true, $ne: null, $regex: /^[^+]/ } 
    });

    console.log('👥 Users:');
    console.log(`   Total: ${totalUsers}`);
    console.log(`   ✅ Already migrated (starts with +): ${usersWithPlus}`);
    console.log(`   ⏳ Need migration (no +): ${usersWithoutPlus}`);

    // Orders analysis
    const totalOrders = await db.collection('orders').countDocuments({ phone: { $exists: true, $ne: null } });
    const ordersWithPlus = await db.collection('orders').countDocuments({ phone: /^\+/ });
    const ordersWithoutPlus = await db.collection('orders').countDocuments({ 
      phone: { $exists: true, $ne: null, $regex: /^[^+]/ } 
    });

    console.log('\n📦 Orders:');
    console.log(`   Total: ${totalOrders}`);
    console.log(`   ✅ Already migrated (starts with +): ${ordersWithPlus}`);
    console.log(`   ⏳ Need migration (no +): ${ordersWithoutPlus}`);

    // Show samples
    const sampleOldUser = await db.collection('users').findOne({ phone: /^[^+]/ });
    const sampleNewUser = await db.collection('users').findOne({ phone: /^\+/ });

    if (sampleOldUser) {
      console.log(`\n📝 Sample OLD format: "${sampleOldUser.phone}"`);
    }
    if (sampleNewUser) {
      console.log(`📝 Sample NEW format: "${sampleNewUser.phone}"`);
    }

    // Check if migration needed
    if (usersWithoutPlus === 0 && ordersWithoutPlus === 0) {
      console.log('\n✅ All data already migrated! Nothing to do.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // === PERFORM MIGRATION === //
    console.log('\n🚀 Starting migration...\n');

    // Migrate Users (only those WITHOUT +)
    if (usersWithoutPlus > 0) {
      console.log('🔄 Migrating users...');
      
      // Use traditional update (not aggregation pipeline to avoid issues)
      const usersToMigrate = await db.collection('users').find({ 
        phone: { $exists: true, $ne: null, $regex: /^9/ } // Starts with 9 (India)
      }).toArray();

      let usersMigrated = 0;
      for (const user of usersToMigrate) {
        try {
          await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { phone: `+91${user.phone}` } }
          );
          usersMigrated++;
        } catch (err) {
          if (err.code === 11000) {
            console.log(`   ⚠️  Skipped user ${user._id} (duplicate phone: +91${user.phone})`);
          } else {
            throw err;
          }
        }
      }
      console.log(`✅ Migrated ${usersMigrated} users`);
    }

    // Migrate Orders (only those WITHOUT +)
    if (ordersWithoutPlus > 0) {
      console.log('\n🔄 Migrating orders...');
      
      const ordersToMigrate = await db.collection('orders').find({ 
        phone: { $exists: true, $ne: null, $regex: /^9/ }
      }).toArray();

      let ordersMigrated = 0;
      for (const order of ordersToMigrate) {
        try {
          await db.collection('orders').updateOne(
            { _id: order._id },
            { $set: { phone: `+91${order.phone}` } }
          );
          ordersMigrated++;
        } catch (err) {
          console.log(`   ⚠️  Error migrating order ${order._id}: ${err.message}`);
        }
      }
      console.log(`✅ Migrated ${ordersMigrated} orders`);
    }

    // === VERIFY FINAL STATE === //
    console.log('\n📊 Verifying migration...\n');

    const finalUsersWithPlus = await db.collection('users').countDocuments({ phone: /^\+/ });
    const finalUsersWithoutPlus = await db.collection('users').countDocuments({ 
      phone: { $exists: true, $ne: null, $regex: /^[^+]/ } 
    });

    const finalOrdersWithPlus = await db.collection('orders').countDocuments({ phone: /^\+/ });
    const finalOrdersWithoutPlus = await db.collection('orders').countDocuments({ 
      phone: { $exists: true, $ne: null, $regex: /^[^+]/ } 
    });

    console.log('👥 Users:');
    console.log(`   ✅ With +: ${finalUsersWithPlus}`);
    console.log(`   ⏳ Without +: ${finalUsersWithoutPlus}`);

    console.log('\n📦 Orders:');
    console.log(`   ✅ With +: ${finalOrdersWithPlus}`);
    console.log(`   ⏳ Without +: ${finalOrdersWithoutPlus}`);

    if (finalUsersWithoutPlus === 0 && finalOrdersWithoutPlus === 0) {
      console.log('\n🎉 Migration complete! All phone numbers now have country codes.');
    } else {
      console.log('\n⚠️  Some records still need manual review.');
    }

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

migratePhoneFormat();