import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Order, ProductCode, Product, InventoryItem, ProductConfig, InventoryTransaction, syncAffectedProducts } from '@swago/database';
import { isValidObjectId } from 'mongoose';
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
    const session = await requireAdmin();

    const { id } = await params;
    const { status: rawStatus } = await request.json();

    const normalizeStatus = (s: string) => {
      if (!s) return 'Pending';
      const lower = s.toLowerCase();
      if (lower === 'delivered') return 'Delivered';
      if (lower === 'cancelled') return 'Cancelled';
      if (lower === 'shipped') return 'Shipped';
      if (lower === 'paid') return 'Paid';
      if (lower === 'pending') return 'Pending';
      if (lower === 'packed') return 'Packed';
      if (lower === 'failed') return 'Failed';
      if (lower === 'abandoned') return 'Abandoned';
      if (lower === 'rto') return 'RTO';
      if (lower === 'returned') return 'Returned';
      if (lower === 'refunded') return 'Refunded';
      if (lower === 'out for delivery') return 'Out for Delivery';
      return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const status = normalizeStatus(rawStatus);

    // Validate status — must match the Order schema enum exactly
    const validStatuses = ['Pending', 'Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Failed', 'Abandoned', 'RTO', 'Returned', 'Refunded'];
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


    // Check if status is transitioning to a cancelled/returned state
    const cancellingStatuses = ['Cancelled', 'RTO', 'Returned', 'Refunded'];
    if (cancellingStatuses.includes(status) && !cancellingStatuses.includes(currentOrder.status) && currentOrder.items) {
      const affectedInventoryIds: string[] = [];

      try {
        for (const item of currentOrder.items) {
          const rawId = item.productId?.toString();
          if (!rawId) continue;
          let resolvedProductId = rawId;
          if (!isValidObjectId(rawId)) {
            const product = await Product.findOne({ slug: rawId });
            if (!product) continue;
            resolvedProductId = product._id.toString();
          }
          const config = await ProductConfig.findOne({ productId: resolvedProductId, isActive: true });
          if (!config?.components?.length) continue;
          const orderQty = item.quantity || 1;
          for (const component of config.components) {
            const addition = component.quantity * orderQty;
            const invItem = await InventoryItem.findById(component.inventoryItemId);
            if (!invItem) continue;
            const previousStock = invItem.currentStock;
            invItem.currentStock = previousStock + addition;
            await invItem.save();
            affectedInventoryIds.push(component.inventoryItemId.toString());
            await InventoryTransaction.create({
              inventoryItemId: component.inventoryItemId,
              inventoryItemName: invItem.name,
              type: "addition",
              quantity: addition,
              previousStock,
              newStock: invItem.currentStock,
              orderId: currentOrder.orderId || "",
              orderMongoId: currentOrder._id,
              productName: item.name || "",
              reason: `Order ${status} (${currentOrder.orderId || currentOrder._id})`,
              performedBy: session?.name || "Admin",
            });
          }
        }

        const uniqueInvIds = [...new Set(affectedInventoryIds)];
        if (uniqueInvIds.length > 0) {
          await syncAffectedProducts(uniqueInvIds);
        }
      } catch (err) {
        console.error("Inventory restore failed:", err);
      }
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