// /tmp/remove_user_6369758396.js
const mongoose = require('mongoose');

// MONGODB_URI from .env.local
const MONGODB_URI = "mongodb://localhost:27017/swjr"; // Added /swjr base on common naming

async function run() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Managed to connect.");

        const phone = "6369758396";
        
        // Use generic collection access to avoid model dependency issues in one-off script
        const User = mongoose.connection.collection('users');
        const KidProfile = mongoose.connection.collection('kidprofiles');
        const Order = mongoose.connection.collection('orders');

        const user = await User.findOne({ phone: phone });

        if (!user) {
            console.log(`❌ User with phone ${phone} not found.`);
            process.exit(0);
        }

        const userId = user._id;
        console.log(`Found user: ${user.name} (ID: ${userId})`);

        // Deleting related data
        console.log("Deleting kid profiles...");
        const kidDelete = await KidProfile.deleteMany({ userId: userId });
        console.log(`Deleted ${kidDelete.deletedCount} kid profiles.`);

        console.log("Deleting orders...");
        const orderDelete = await Order.deleteMany({ userId: userId });
        console.log(`Deleted ${orderDelete.deletedCount} orders.`);

        console.log("Deleting user...");
        const userDelete = await User.deleteOne({ _id: userId });
        console.log(`User deleted.`);

        console.log("✅ Cleanup complete.");
    } catch (err) {
        console.error("Error during cleanup:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
