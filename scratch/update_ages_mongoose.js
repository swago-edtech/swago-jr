const mongoose = require('mongoose');

const uri = "mongodb+srv://swagotech123_db_user:Otmezw2RG2N6DXAo@production.jhby6sd.mongodb.net/prod?appName=production";

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to database');

    const result = await mongoose.connection.collection('products').updateMany(
      { ageCategory: "5-7" },
      { $set: { ageCategory: "6-7" } }
    );

    console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(console.dir);
