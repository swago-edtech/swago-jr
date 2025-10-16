/**
 * Script to create the first admin user
 * Run from root: node apps/admin/scripts/create-admin.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

// Import from workspace packages
const mongoose = require('../../../packages/database/node_modules/mongoose');
const bcrypt = require('../node_modules/bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in root .env.local');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: String,
  isAdmin: { type: Boolean, default: false },
  wishlist: [Number],
  age: Number,
  address: String,
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
}, { timestamps: true });

async function createAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const email = 'admin@swagojr.com';
    const password = 'Admin@123';
    const name = 'Admin User';

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('⚠️  Admin user already exists');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log('👤 Creating admin user...');
    await User.create({
      email,
      password: hashedPassword,
      name,
      isAdmin: true,
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('\n⚠️  Change password after first login!\n');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();