import mongoose from 'mongoose';

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/swago-jr");
    
    const ExpressConfig = mongoose.models.ExpressConfig || mongoose.model("ExpressConfig", new mongoose.Schema({}, { strict: false }));

    const result = await ExpressConfig.findOneAndUpdate({ isSingleton: true }, { $set: { allowPublicCoupons: true } }, { new: true });
    console.log("Updated Config:", result);

    process.exit(0);
}

run().catch(console.error);
