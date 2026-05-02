import connectDB from "../packages/database/src/connection";
import { User, Order } from "@swago/database";

async function run() {
  const phone = "6369758396";
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    const user = await User.findOne({ phone });
    if (!user) {
      console.log(`User not found for phone: ${phone}`);
      process.exit(0);
    }

    const userId = user._id;
    console.log(`Found user: ${user.name} (${userId})`);

    const orderResult = await Order.deleteMany({ userId });
    console.log(`Deleted ${orderResult.deletedCount} orders`);

    await User.deleteOne({ _id: userId });
    console.log(`Deleted user`);

    console.log("Cleanup complete!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
