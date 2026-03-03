// packages/database/src/models/Quest.ts
import mongoose from "mongoose";

const QuestSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Quest title is required"],
            trim: true
        },
        description: {
            type: String,
            required: [true, "Quest description is required"]
        },
        image: {
            type: String,
            required: [true, "Quest image is required"]
        },
        reward: {
            type: Number,
            required: [true, "Reward amount is required"],
            default: 0
        },
        frequency: {
            type: String,
            default: "Once per box"
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product association is required"]
        },
        tags: [{
            name: String,
            color: String,
            iconName: String // Store icon name (e.g., 'Zap', 'Target')
        }],
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

export default mongoose.models.Quest || mongoose.model("Quest", QuestSchema);
