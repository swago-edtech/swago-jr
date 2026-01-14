// apps/web/src/app/api/ambassador/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@swago/database";
import mongoose from "mongoose";

// Ambassador Application Schema
const AmbassadorApplicationSchema = new mongoose.Schema(
  {
    kidName: {
      type: String,
      required: true,
      trim: true,
    },
    kidAge: {
      type: Number,
      required: true,
      min: 7,
      max: 14,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    parentName: {
      type: String,
      required: true,
      trim: true,
    },
    parentPhone: {
      type: String,
      required: true,
      trim: true,
    },
    parentEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    whyJoin: {
      type: String,
      default: "",
    },
    consentGiven: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "waitlisted"],
      default: "pending",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      enum: ["application", "waitlist"],
      default: "application",
    },
  },
  { timestamps: true }
);

// Index for faster queries
AmbassadorApplicationSchema.index({ parentEmail: 1 });
AmbassadorApplicationSchema.index({ status: 1, createdAt: -1 });

const AmbassadorApplication =
  mongoose.models.AmbassadorApplication ||
  mongoose.model("AmbassadorApplication", AmbassadorApplicationSchema);

// POST - Submit ambassador application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      kidName,
      kidAge,
      city,
      parentName,
      parentPhone,
      parentEmail,
      whyJoin,
      consentGiven,
    } = body;

    // Validation
    if (!kidName || !kidAge || !city || !parentName || !parentPhone || !parentEmail) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    if (kidAge < 7 || kidAge > 14) {
      return NextResponse.json(
        { error: "Ambassador program is only for kids aged 7-14" },
        { status: 400 }
      );
    }

    if (!consentGiven) {
      return NextResponse.json(
        { error: "Parent consent is required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Phone validation (basic)
    const phoneRegex = /^[+]?[\d\s()-]{10,}$/;
    if (!phoneRegex.test(parentPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if application already exists for this email
    const existingApplication = await AmbassadorApplication.findOne({
      parentEmail: parentEmail.toLowerCase().trim(),
    });

    if (existingApplication) {
      return NextResponse.json(
        {
          error: "An application with this email already exists. Please check your email for updates.",
        },
        { status: 400 }
      );
    }

    // Create new application
    const application = new AmbassadorApplication({
      kidName: kidName.trim(),
      kidAge: parseInt(kidAge),
      city: city.trim(),
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      parentEmail: parentEmail.toLowerCase().trim(),
      whyJoin: whyJoin ? whyJoin.trim() : "",
      consentGiven: true,
      status: "pending",
      source: "application",
    });

    await application.save();

    // TODO: Send confirmation email to parent
    // TODO: Notify admin about new application

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully!",
        applicationId: application._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ambassador application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application. Please try again." },
      { status: 500 }
    );
  }
}

// GET - Check application status (optional, for parents to check)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const application = await AmbassadorApplication.findOne({
      parentEmail: email.toLowerCase().trim(),
    }).select("-__v");

    if (!application) {
      return NextResponse.json(
        { error: "No application found for this email" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application: {
        kidName: application.kidName,
        status: application.status,
        submittedAt: application.createdAt,
        reviewedAt: application.reviewedAt,
      },
    });
  } catch (error) {
    console.error("Get application error:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}
