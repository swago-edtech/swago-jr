import mongoose from 'mongoose';

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/swago-jr");
    
    const ExpressConfig = mongoose.models.ExpressConfig || mongoose.model("ExpressConfig", new mongoose.Schema({}, { strict: false }));
    const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", new mongoose.Schema({}, { strict: false }));

    const config = await ExpressConfig.findOne({ isSingleton: true }).lean();
    console.log("Config:", config);

    const coupons = await Coupon.find().lean();
    console.log("All coupons count:", coupons.length);
    console.log("Coupons:", coupons.map((c: any) => ({ code: c.code, active: c.active, isExpressOnly: c.isExpressOnly, expiryDate: c.expiryDate })));

    process.exit(0);
}

run().catch(console.error);
