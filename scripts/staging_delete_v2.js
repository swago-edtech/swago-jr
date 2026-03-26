const mongoose = require('mongoose');

// CURRENT STAGING URI
const MONGODB_URI = "mongodb+srv://swago_app_user_staging:2o0luhUclPu84EhT@swagojr.iooinxu.mongodb.net/SwagoJR?retryWrites=true&w=majority";

async function run() {
    try {
        console.log("Connecting to Staging MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Managed to connect.");

        const rawPhone = "6369758396";
        const phonesToTry = [rawPhone, `+91${rawPhone}`, `91${rawPhone}`];
        
        const User = mongoose.connection.collection('users');
        let user = null;
        for (const p of phonesToTry) {
            console.log(`Checking for phone: ${p}`);
            user = await User.findOne({ phone: p });
            if (user) break;
        }

        if (!user) {
            // Try with email if phone not found
            console.log("Phone not found, checking for users with name 'Kiran' (common user in this turn)...");
            user = await User.findOne({ name: /Kiran/i });
            if (!user) {
                console.log(`❌ No user found for phone ${rawPhone} or name Kiran.`);
                process.exit(0);
            }
        }

        const userId = user._id;
        console.log(`Found user: ${user.name} (Phone: ${user.phone}, ID: ${userId})`);

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
