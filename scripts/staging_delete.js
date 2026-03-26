const mongoose = require('mongoose');

// CURRENT STAGING URI from apps/web/.env.local
const MONGODB_URI = "mongodb+srv://swago_app_user_staging:2o0luhUclPu84EhT@swagojr.iooinxu.mongodb.net/SwagoJR?retryWrites=true&w=majority";

async function run() {
    try {
        console.log("Connecting to Staging MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Managed to connect.");

        const phone = "6369758396";
        const User = mongoose.connection.collection('users');
        const user = await User.findOne({ phone: phone });

        if (!user) {
            console.log(`❌ User with phone ${phone} not found in Staging DB.`);
            process.exit(0);
        }

        const userId = user._id;
        console.log(`Found user: ${user.name} (ID: ${userId})`);

        // Deleting related data
        const kidDelete = await mongoose.connection.collection('kidprofiles').deleteMany({ userId: userId });
        console.log(`Deleted ${kidDelete.deletedCount} kid profiles.`);

        const orderDelete = await mongoose.connection.collection('orders').deleteMany({ userId: userId });
        console.log(`Deleted ${orderDelete.deletedCount} orders.`);

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
