const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkDB() {
    if (!MONGODB_URI) {
        console.error("❌ MONGODB_URI not found in environment.");
        process.exit(1);
    }

    console.log("Connecting to:", MONGODB_URI.replace(/:([^:@]{1,})@/, ':****@')); // Hide password

    try {
        await mongoose.connect(MONGODB_URI, { 
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000 
        });
        
        console.log("✅ Successfully connected to MongoDB.");
        
        const dbName = mongoose.connection.name;
        console.log("Database Name:", dbName);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("\nCollections in this database:");
        collections.forEach(col => {
            console.log(`- ${col.name}`);
        });

        // Query a document from the 'users' collection as a final check
        const usersCount = await mongoose.connection.db.collection('users').countDocuments();
        console.log(`\nTotal documents in 'users' collection: ${usersCount}`);

        const latestUser = await mongoose.connection.db.collection('users').findOne({}, { sort: { createdAt: -1 } });
        if (latestUser) {
            console.log("Latest user found:", latestUser.name || latestUser.phone || latestUser.email || "Unnamed User");
        } else {
            console.log("No users found in the database.");
        }

    } catch (err) {
        console.error("❌ Error connecting to or querying the database:", err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkDB();
