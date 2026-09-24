'use server';

import { connectDB, ReturnGiftOrder } from '@swago/database';
import { revalidatePath } from 'next/cache';

export async function getReturnGiftOrders() {
  try {
    await connectDB();
    const orders = await ReturnGiftOrder.find().sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(orders));
  } catch (error) {
    console.error('Failed to fetch return gift orders:', error);
    return [];
  }
}

export async function markAsResolved(id: string) {
  try {
    await connectDB();
    await ReturnGiftOrder.findByIdAndUpdate(id, { status: 'resolved' });
    revalidatePath('/return-gifts');
    return { success: true };
  } catch (error) {
    console.error('Failed to resolve return gift order:', error);
    return { success: false, error: 'Failed to update status' };
  }
}
