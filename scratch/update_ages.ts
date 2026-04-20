import mongoose from 'mongoose';
import { connectDB, Product } from './packages/database/src/index';

async function updateAgeCategories() {
  await connectDB();
  console.log('Connected to database');

  const result = await Product.updateMany(
    { ageCategory: '5-7' },
    { $set: { ageCategory: '6-7' } }
  );

  console.log(`Updated ${result.modifiedCount} products from 5-7 to 6-7`);
  
  process.exit(0);
}

updateAgeCategories().catch(err => {
  console.error(err);
  process.exit(1);
});
