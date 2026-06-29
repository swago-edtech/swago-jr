// packages/database/src/models/InvoiceCounter.ts
import mongoose from "mongoose";

const InvoiceCounterSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    sequence: {
        type: Number,
        default: 2600183
    }
}, {
    timestamps: true
});

export default mongoose.models.InvoiceCounter || mongoose.model("InvoiceCounter", InvoiceCounterSchema);
