import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Order, ProductCode } from '@swago/database';
import { requireAdmin } from '@/lib/auth';

// Helper function to generate random hex string
function generateRandomHex(length: number = 5): string {
  const chars = 'ABCDEF0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to generate product codes
async function generateProductCodes(orderId: string, items: any[]) {
  const eligibleProductIds = [3, 8]; // Scarf Dumb Charades (3), Seek Rush (8)
  const productNames: { [key: number]: string } = {
    3: 'Scarf',
    8: 'Seek',
  };

  const generatedCodes: Array<{ productId: number; code: string }> = [];

  for (const item of items) {
    if (eligibleProductIds.includes(item.productId)) {
      // Generate one code per product (regardless of quantity)
      const prefix = productNames[item.productId];
      const randomHex = generateRandomHex(5);
      const code = `${prefix}_${item.productId}_${randomHex}`;

      // Check if code already exists for this order + product
      const existingCode = await ProductCode.findOne({
        orderId,
        productId: item.productId,
      });

      if (!existingCode) {
        // Create new product code
        await ProductCode.create({
          code,
          productId: item.productId,
          orderId,
          isUsed: false,
        });

        generatedCodes.push({ productId: item.productId, code });
      }
    }
  }

  return generatedCodes;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    await requireAdmin();

    const { id } = await params;
    const { status: rawStatus } = await request.json();

    // Normalize to Title Case to match DB enum
    const status = rawStatus?.charAt(0).toUpperCase() + rawStatus?.slice(1).toLowerCase();

    // Validate status — must match the Order schema enum exactly
    const validStatuses = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled', 'Failed', 'Abandoned'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Get current order to check items
    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    const order = await Order.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    let generatedCodes: Array<{ productId: number; code: string }> = [];

    // Generate product codes if status is being set to "confirmed"
    if (status === 'Shipped' && currentOrder.items) {
      generatedCodes = await generateProductCodes(id, currentOrder.items);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order._id,
        status: order.status,
      },
      codesGenerated: generatedCodes.length > 0,
      codes: generatedCodes, // Include codes in response for admin to see
    });
  } catch (error: any) {
    console.error('Update order status error:', error);
    
    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}