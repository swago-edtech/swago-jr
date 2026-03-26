const mongoose = require('mongoose');

// STAGING URI
const MONGODB_URI = "mongodb+srv://swago_app_user_staging:2o0luhUclPu84EhT@swagojr.iooinxu.mongodb.net/SwagoJR?retryWrites=true&w=majority";

const phoneToDelete = process.argv[2];

if (!phoneToDelete) {
    console.log("Please provide a phone number as an argument.");
    console.log("Example: node scripts/delete_user_by_number.js 6369758396");
    process.exit(1);
}

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        const phonesToTry = [phoneToDelete, `+91${phoneToDelete}`, `91${phoneToDelete}`];
        const User = mongoose.connection.collection('users');
        let user = null;

        for (const p of phonesToTry) {
            user = await User.findOne({ phone: p });
            if (user) break;
        }

        if (!user) {
            console.log(`❌ No user found for phone: ${phoneToDelete}`);
            process.exit(1);
        }

        const userId = user._id;
        console.log(`🗑️ Found user: ${user.name} (Phone: ${user.phone}, ID: ${userId}). Deleting...`);

        // Clean up linked data
        const kids = await mongoose.connection.collection('kidprofiles').deleteMany({ userId: userId });
        const orders = await mongoose.connection.collection('orders').deleteMany({ userId: userId });
        await User.deleteOne({ _id: userId });

        console.log(`✅ Success! Deleted user, ${kids.deletedCount} kid profiles, and ${orders.deletedCount} orders.`);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
