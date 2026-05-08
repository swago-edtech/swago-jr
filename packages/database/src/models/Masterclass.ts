import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  ageGroup: { type: String, required: true },
  pricing: [{
    currency: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 }
  }],
  duration: { type: String, default: "" },
  schedule: { type: String, default: "" },
  highlights: [{ type: String }],
  thumbnail: { type: String, default: "" },
  maxSeats: { type: Number, default: 50 },
  bookedSeats: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  reviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
}, { _id: true });

const TargetAudienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  icon: { type: String, default: "" },
}, { _id: true });

const FAQItemSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  order: { type: Number, default: 0 },
}, { _id: true });

const TestimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, default: "Parent" },
  message: { type: String, required: true },
  avatar: { type: String, default: "" },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  order: { type: Number, default: 0 },
}, { _id: true });

const ModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: String, default: "" },
  points: [{ type: String }],
  order: { type: Number, default: 0 },
}, { _id: true });

const BonusSchema = new mongoose.Schema({
  title: { type: String, required: true },
  value: { type: String, default: "" },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  order: { type: Number, default: 0 },
}, { _id: true });

const MentorSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  title: { type: String, default: "" },
  bio: { type: String, default: "" },
  image: { type: String, default: "" },
  stats: [{
    platform: { type: String },
    count: { type: String },
  }]
}, { _id: false });

const CertificationSchema = new mongoose.Schema({
  title: { type: String, default: "Get Certified" },
  description: { type: String, default: "" },
  points: [{ type: String }],
  image: { type: String, default: "" },
}, { _id: false });

const MasterclassSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Masterclass title is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },

    hero: {
      headline: { type: String, default: "" },
      subheadline: { type: String, default: "" },
      videoUrl: { type: String, default: "" },
      stats: [{
        label: { type: String },
        subtext: { type: String }
      }],
      guaranteeBadge: { type: String, default: "" },
    },

    sessions: [SessionSchema],
    modules: [ModuleSchema],
    bonuses: [BonusSchema],
    targetAudience: [TargetAudienceSchema],
    faqs: [FAQItemSchema],
    testimonials: [TestimonialSchema],

    mentor: { type: MentorSchema, default: () => ({}) },
    certification: { type: CertificationSchema, default: () => ({}) },
  },
  { timestamps: true }
);

MasterclassSchema.pre("save", function (next) {
  if (this.isModified("title") || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 100);
  }
  next();
});

export default mongoose.models.Masterclass ||
  mongoose.model("Masterclass", MasterclassSchema);
