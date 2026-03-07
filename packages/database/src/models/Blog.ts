// packages/database/src/models/Blog.ts
import mongoose from "mongoose";

const BlogBlockSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["paragraph", "heading", "image", "quiz", "html", "list", "spacer"],
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
});

const BlogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        metaDescription: {
            type: String,
            trim: true
        },
        coverImage: {
            type: String,
            default: ""
        },
        content: [BlogBlockSchema],
        isPublished: {
            type: Boolean,
            default: false
        },
        author: {
            type: String,
            default: "Swago Team"
        }
    },
    { timestamps: true }
);

export default mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
