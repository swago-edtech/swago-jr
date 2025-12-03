import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    console.log("🔍 Cloudinary Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json(
        { error: "CLOUDINARY_CLOUD_NAME not found" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("📁 Original file name:", file.name);

    // Validate
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be less than 5MB" }, { status: 400 });
    }

    // Generate a safe filename (remove spaces and special chars)
    const timestamp = Date.now();
    const safeName = file.name
      .replace(/\s+/g, '_')  // Replace spaces with underscore
      .replace(/[^a-zA-Z0-9._-]/g, '');  // Remove special chars

    console.log("📝 Safe filename:", safeName);
    console.log("🕐 Timestamp:", timestamp);

    // Convert to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    console.log("📤 Uploading to Cloudinary...");

    // Upload with minimal parameters
    const uploadData = {
      file: dataURI,
      upload_preset: "swago111",
      // Don't send folder, public_id, or any other parameters
    };

    const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    const cloudinaryResponse = await fetch(uploadUrl, {
      method: "POST",
      body: JSON.stringify(uploadData),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("📥 Response status:", cloudinaryResponse.status);

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.json();
      console.error("❌ Cloudinary error:", JSON.stringify(errorData, null, 2));
      return NextResponse.json(
        { 
          error: `Upload failed: ${errorData.error?.message || 'Unknown error'}`,
          details: errorData
        },
        { status: 500 }
      );
    }

    const cloudinaryData = await cloudinaryResponse.json();
    console.log("✅ Upload successful!");
    console.log("📷 Image URL:", cloudinaryData.secure_url);

    return NextResponse.json({
      success: true,
      url: cloudinaryData.secure_url,
      publicId: cloudinaryData.public_id,
    });

  } catch (error: any) {
    console.error("💥 Error:", error.message);

    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
