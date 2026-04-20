const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://swagotech123_db_user:Otmezw2RG2N6DXAo@production.jhby6sd.mongodb.net/prod?appName=production";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db('prod');
    const products = database.collection('products');

    const result = await products.updateMany(
      { ageCategory: "5-7" },
      { $set: { ageCategory: "6-7" } }
    );

    console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
