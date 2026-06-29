const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvoiceCounterSchema = new Schema({
    key: { type: String, required: true, unique: true },
    sequence: { type: Number, default: 2600183 }
}, { timestamps: true });

const InvoiceCounter = mongoose.model("InvoiceCounter", InvoiceCounterSchema);

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db');
    await InvoiceCounter.deleteMany({});
    const counter = await InvoiceCounter.findOneAndUpdate(
        { key: 'invoice' },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
    );
    console.log("FIRST INVOICE NUMBER: ", counter.sequence);
    await mongoose.disconnect();
}
run().catch(console.error);
