const mongoose = require('mongoose');

// Try THE ACTUAL IP from lsof
const MONGODB_URI_IP = "mongodb://probruta_db_user:rYMPgpgUFps7YmiB@159.41.196.84:27017/test?authSource=admin";

async function run() {
    try {
        console.log("Connecting directly to IP:", MONGODB_URI_IP);
        await mongoose.connect(MONGODB_URI_IP, { serverSelectionTimeoutMS: 5000 });
        console.log("✅ Managed to connect.");

        const phone = "6369758396";
        const User = mongoose.connection.collection('users');
        const user = await User.findOne({ phone: phone });

        if (!user) {
            console.log(`❌ User with phone ${phone} not found in this DB.`);
            process.exit(0);
        }

        const userId = user._id;
        console.log(`Found user: ${user.name} (ID: ${userId})`);

        await mongoose.connection.collection('kidprofiles').deleteMany({ userId: userId });
        await mongoose.connection.collection('orders').deleteMany({ userId: userId });
        await User.deleteOne({ _id: userId });

        console.log("✅ Cleanup complete.");
    } catch (err) {
        console.error("Error during cleanup:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
