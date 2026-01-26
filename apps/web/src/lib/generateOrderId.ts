// apps/web/src/lib/generateOrderId.ts
// Generates sequential order IDs in SW-YYMMDD-XXXX format

import { connectDB, OrderCounter } from "@swago/database";

/**
 * Generates a unique order ID in the format SW-YYMMDD-XXXX
 * - SW: Prefix for Swago
 * - YYMMDD: Current date (e.g., 260126 for 2026-01-26)
 * - XXXX: Daily sequential number starting from 0001
 * 
 * Uses atomic findOneAndUpdate to ensure uniqueness even under concurrent requests.
 * The sequence resets to 0001 each new day.
 * 
 * @returns Promise<string> - The generated order ID (e.g., "SW-260126-0001")
 */
export async function generateOrderId(): Promise<string> {
    await connectDB();

    // Get current date in YYMMDD format
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // "26" for 2026
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // "01" for January
    const day = now.getDate().toString().padStart(2, '0'); // "26" for 26th
    const dateStr = `${year}${month}${day}`; // "260126"

    // Atomically increment the counter for today
    // upsert: true creates the document if it doesn't exist
    // new: true returns the updated document
    const counter = await OrderCounter.findOneAndUpdate(
        { date: dateStr },
        { $inc: { sequence: 1 } },
        { upsert: true, new: true }
    );

    // Format sequence as 4-digit padded number (supports up to 9999 orders/day)
    const sequence = counter.sequence.toString().padStart(4, '0');

    const orderId = `SW-${dateStr}-${sequence}`;

    console.log(`✅ Generated Order ID: ${orderId}`);

    return orderId;
}

/**
 * Generates a legacy-style order ID for backfilling existing orders
 * Format: SW-OLD-XXXXXX (6-digit sequence)
 * 
 * @param sequence - The sequence number for the legacy order
 * @returns string - The legacy order ID
 */
export function generateLegacyOrderId(sequence: number): string {
    return `SW-OLD-${sequence.toString().padStart(6, '0')}`;
}

/**
 * Validates if a string is a valid Swago order ID format
 * Accepts: SW-YYMMDD-XXXX or SW-OLD-XXXXXX
 */
export function isValidOrderId(orderId: string): boolean {
    // Standard format: SW-YYMMDD-XXXX
    const standardPattern = /^SW-\d{6}-\d{4}$/;
    // Legacy format: SW-OLD-XXXXXX
    const legacyPattern = /^SW-OLD-\d{6}$/;

    return standardPattern.test(orderId) || legacyPattern.test(orderId);
}
