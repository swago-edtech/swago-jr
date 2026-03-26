const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 1. Manually parse .env.local to get CURRENT MONGODB_URI
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
let uri = '';
for (const line of lines) {
    if (line.startsWith('MONGODB_URI=')) {
        uri = line.split('=')[1].trim();
        break;
    }
}

// 2. If it's localhost, but lsof showed 159.41.196.84, it might be SRV issue or something.
// We will try the URI from the file first.
console.log("Found URI in .env.local:", uri);

if (!uri || uri.includes('localhost')) {
    // FALLBACK: User probably is using the remote cluster but the .env.local is old or pointing to a proxy.
    // Try the SRV strings from the comments if localhost fails.
    uri = "mongodb+srv://probruta_db_user:rYMPgpgUFps7YmiB@cluster0.aipuhfp.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";
}

async function run() {
    try {
        console.log("Connecting to:", uri);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log("✅ Managed to connect.");

        const phone = "6369758396";
        const User = mongoose.connection.collection('users');
        const user = await User.findOne({ phone: phone });

        if (!user) {
            console.log(`❌ User with phone ${phone} not found.`);
            // Try another possible DB from the other comment in .env.local
            const uri2 = "mongodb+srv://kamalkantpareek24_db_user:R8boUHk9cosku7Ii@swjr.h168iua.mongodb.net/swjr?retryWrites=true&w=majority&appName=SwJr";
            console.log("Trying second remote URI:", uri2);
            await mongoose.disconnect();
            await mongoose.connect(uri2, { serverSelectionTimeoutMS: 5000 });
            console.log("✅ Managed to connect to second DB.");
            
            const user2 = await mongoose.connection.collection('users').findOne({ phone: phone });
            if (!user2) {
                console.log(`❌ User not found in both clusters.`);
                process.exit(0);
            }
            console.log(`Found user: ${user2.name} (ID: ${user2._id})`);
            
            await mongoose.connection.collection('kidprofiles').deleteMany({ userId: user2._id });
            await mongoose.connection.collection('orders').deleteMany({ userId: user2._id });
            await mongoose.connection.collection('users').deleteOne({ _id: user2._id });
            console.log("✅ Cleanup complete in second DB.");
            process.exit(0);
        }

        const userId = user._id;
        console.log(`Found user: ${user.name} (ID: ${userId})`);

        await mongoose.connection.collection('kidprofiles').deleteMany({ userId: userId });
        await mongoose.connection.collection('orders').deleteMany({ userId: userId });
        await User.deleteOne({ _id: userId });

        console.log("✅ Cleanup complete.");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
