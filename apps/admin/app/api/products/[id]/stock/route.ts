import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { Product, hasActiveBomConfig } from "@swago/database";
import { connectDB } from "@swago/database";
import mongoose from "mongoose";

// PUT /api/products/[id]/stock - Quick stock update
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ✅ Check admin authentication
    await requireAdmin();

    await connectDB();

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const body = await request.json();
    const { stock } = body;

    if (stock === undefined || stock < 0) {
      return NextResponse.json(
        { error: "Valid stock value is required" },
        { status: 400 }
      );
    }

    if (await hasActiveBomConfig(id)) {
      return NextResponse.json(
        { error: "Stock is auto-calculated from inventory BOM and cannot be edited manually." },
        { status: 400 }
      );
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { stock },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Stock updated successfully",
      stock: product.stock,
    });
  } catch (error: any) {
    console.error("Error updating stock:", error);
    
    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    );
  }
}
