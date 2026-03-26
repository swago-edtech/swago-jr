// /Users/kiran/Desktop/swago/swago-jr/scripts/delete_user_remote.js
const mongoose = require('mongoose');

// REMOTE URI from .env.local comments
const MONGODB_URI = "mongodb+srv://kamalkantpareek24_db_user:R8boUHk9cosku7Ii@swjr.h168iua.mongodb.net/swjr?retryWrites=true&w=majority&appName=SwJr";

async function run() {
    try {
        console.log("Connecting to Remote MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Managed to connect.");

        const phone = "6369758396";
        
        const User = mongoose.connection.collection('users');
        const KidProfile = mongoose.connection.collection('kidprofiles');
        const Order = mongoose.connection.collection('orders');

        const user = await User.findOne({ phone: phone });

        if (!user) {
            console.log(`❌ User with phone ${phone} not found in this DB.`);
            
            // Try another possible DB from the other comment in .env.local
            const MONGODB_URI_2 = "mongodb+srv://probruta_db_user:rYMPgpgUFps7YmiB@cluster0.aipuhfp.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
            console.log("Trying second remote URI...");
            await mongoose.disconnect();
            await mongoose.connect(MONGODB_URI_2);
            console.log("✅ Managed to connect to second DB.");
            
            const user2 = await mongoose.connection.collection('users').findOne({ phone: phone });
            if (!user2) {
                console.log(`❌ User with phone ${phone} not found in second DB either.`);
                process.exit(0);
            }
            console.log(`Found user in second DB: ${user2.name} (ID: ${user2._id})`);
            
            const userId = user2._id;
            await mongoose.connection.collection('kidprofiles').deleteMany({ userId: userId });
            await mongoose.connection.collection('orders').deleteMany({ userId: userId });
            await mongoose.connection.collection('users').deleteOne({ _id: userId });
            console.log("✅ Cleanup complete in second DB.");
            process.exit(0);
        }

        const userId = user._id;
        console.log(`Found user: ${user.name} (ID: ${userId})`);

        await KidProfile.deleteMany({ userId: userId });
        await Order.deleteMany({ userId: userId });
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
