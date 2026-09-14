import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { Product } from "@swago/database";
import { connectDB } from "@swago/database";
import mongoose from "mongoose";
import { parseComboFields } from "@/lib/combo-units";

// GET /api/products/[id] - Get single product
export async function GET(
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

    const product = await Product.findById(id).lean();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error("Error fetching product:", error);

    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product
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

    // Find existing product
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Update fields
    const updateFields: any = {};

    if (body.name !== undefined) updateFields.name = body.name;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.price !== undefined) updateFields.price = body.price;
    if (body.originalPrice !== undefined) updateFields.originalPrice = body.originalPrice;
    if (body.images !== undefined) updateFields.images = body.images;
    if (body.videos !== undefined) updateFields.videos = body.videos;
    if (body.ageCategory !== undefined) updateFields.ageCategory = body.ageCategory;
    if (body.coreElements !== undefined) updateFields.coreElements = body.coreElements;
    if (body.boxContents !== undefined) updateFields.boxContents = body.boxContents;
    if (body.benefits !== undefined) updateFields.benefits = body.benefits;
    if (body.stock !== undefined) updateFields.stock = body.stock;
    if (body.weight !== undefined) updateFields.weight = body.weight;
    if (body.lowStockThreshold !== undefined) updateFields.lowStockThreshold = body.lowStockThreshold;
    if (body.isFeatured !== undefined) updateFields.isFeatured = body.isFeatured;
    if (body.isActive !== undefined) updateFields.isActive = body.isActive;
    if (
      body.isCombo !== undefined ||
      body.comboUnitCount !== undefined ||
      body.comboProductIds !== undefined
    ) {
      const combo = parseComboFields({
        isCombo: body.isCombo !== undefined ? body.isCombo : existingProduct.isCombo,
        comboUnitCount:
          body.comboUnitCount !== undefined
            ? body.comboUnitCount
            : existingProduct.comboUnitCount,
        comboProductIds:
          body.comboProductIds !== undefined
            ? body.comboProductIds
            : existingProduct.comboProductIds,
      });
      if (!combo.ok) {
        return NextResponse.json({ error: combo.error }, { status: 400 });
      }
      updateFields.isCombo = combo.fields.isCombo;
      updateFields.comboUnitCount = combo.fields.comboUnitCount;
      updateFields.comboProductIds = combo.fields.comboProductIds;
    }
    if (body.label !== undefined) updateFields.label = body.label;
    if (body.rating !== undefined) updateFields.rating = body.rating;
    if (body.numReviews !== undefined) updateFields.numReviews = body.numReviews;
    if (body.showPromotionalMessage !== undefined) updateFields.showPromotionalMessage = body.showPromotionalMessage;
    if (body.promotionalMessage !== undefined) updateFields.promotionalMessage = body.promotionalMessage;
    if (body.skills !== undefined) updateFields.skills = body.skills;

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error("Error updating product:", error);

    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle duplicate slug error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A product with similar name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Soft delete product
export async function DELETE(
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

    // Soft delete: Set isActive to false
    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting product:", error);

    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
