import mongoose from 'mongoose';

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/swago-jr");
    
    const ExpressConfig = mongoose.models.ExpressConfig || mongoose.model("ExpressConfig", new mongoose.Schema({}, { strict: false }));
    const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", new mongoose.Schema({}, { strict: false }));

    let expressConfig = await ExpressConfig.findOne({ isSingleton: true }).lean();
    console.log("expressConfig.allowPublicCoupons:", expressConfig.allowPublicCoupons);

    const currentDate = new Date();
    const couponQuery: any = {
      active: true,
      $or: [
          { expiryDate: null },
          { expiryDate: { $gt: currentDate } }
      ]
    };
    
    if (!expressConfig.allowPublicCoupons) {
      couponQuery.isExpressOnly = true;
    }

    console.log("Executing Query:", JSON.stringify(couponQuery));
    const availableCoupons = await Coupon.find(couponQuery).select("code description").lean();
    console.log("availableCoupons found:", availableCoupons.length);
    console.log(availableCoupons);

    process.exit(0);
}

run().catch(console.error);
