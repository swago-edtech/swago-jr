import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Product } from '@swago/database';
import { getAdminSession } from '@/lib/auth';

// GET: Fetch all short forms for a product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;

    await connectDB();

    const product = await Product.findById(productId).select('name shortForms');
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      shortForms: product.shortForms || [],
      productName: product.name,
    });
  } catch (error) {
    console.error('Error fetching short forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch short forms' },
      { status: 500 }
    );
  }
}

// POST: Add a new short form to a product
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await req.json();
    const { shortForm } = body;

    // Validate input
    if (!shortForm || typeof shortForm !== 'string') {
      return NextResponse.json(
        { error: 'Short form is required' },
        { status: 400 }
      );
    }

    const trimmed = shortForm.trim().toUpperCase();

    // Validate format: 2-10 alphanumeric characters
    if (!/^[A-Z0-9]{2,10}$/.test(trimmed)) {
      return NextResponse.json(
        { error: 'Short form must be 2-10 alphanumeric characters' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if this product exists
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // ✅ CRITICAL: Check if short form is already used by ANOTHER product
    const existingProduct = await Product.findOne({
      _id: { $ne: productId }, // Not this product
      shortForms: trimmed,
    }).select('name');

    if (existingProduct) {
      return NextResponse.json(
        { 
          error: `Short form "${trimmed}" is already used by product: ${existingProduct.name}`,
          conflictProduct: existingProduct.name,
        },
        { status: 409 }
      );
    }

    // Check if this product already has this short form
    if (product.shortForms.includes(trimmed)) {
      return NextResponse.json(
        { error: 'This product already has this short form' },
        { status: 400 }
      );
    }

    // Add short form to product
    product.shortForms.push(trimmed);
    await product.save();

    return NextResponse.json({
      success: true,
      message: `Short form "${trimmed}" added successfully`,
      shortForms: product.shortForms,
    });
  } catch (error) {
    console.error('Error adding short form:', error);
    return NextResponse.json(
      { error: 'Failed to add short form' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a short form from a product
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;
    const { searchParams } = new URL(req.url);
    const shortForm = searchParams.get('shortForm');

    if (!shortForm) {
      return NextResponse.json(
        { error: 'Short form parameter is required' },
        { status: 400 }
      );
    }

    const trimmed = shortForm.trim().toUpperCase();

    await connectDB();

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if product has this short form
    if (!product.shortForms.includes(trimmed)) {
      return NextResponse.json(
        { error: 'Product does not have this short form' },
        { status: 404 }
      );
    }

    // Remove short form
    product.shortForms = product.shortForms.filter((sf: string) => sf !== trimmed);
    await product.save();

    return NextResponse.json({
      success: true,
      message: `Short form "${trimmed}" removed successfully`,
      shortForms: product.shortForms,
    });
  } catch (error) {
    console.error('Error removing short form:', error);
    return NextResponse.json(
      { error: 'Failed to remove short form' },
      { status: 500 }
    );
  }
}
