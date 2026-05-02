import { NextResponse } from "next/server";
import { connectDB, Product } from "@swago/database";

// Ticket type names mapping (internal map for fancy names)
const TICKET_TYPE_NAMES: Record<string, string> = {
  SSR: "Diamond Ticket",
  SDC: "Golden Ticket",
  SCJ: "Diamond Ticket",
};

export async function GET() {
  try {
    await connectDB();

    // Find all active products that have shortForms
    const products = await Product.find({
      isActive: true,
      shortForms: { $exists: true, $not: { $size: 0 } }
    }).select("name shortForms");

    const ticketTypes: Array<{ id: string; label: string; product: string }> = [];

    products.forEach(product => {
      if (product.shortForms && Array.isArray(product.shortForms)) {
        product.shortForms.forEach((sf: string) => {
          const fancyName = TICKET_TYPE_NAMES[sf] || `${product.name} Ticket`;
          ticketTypes.push({
            id: sf,
            label: `${getEmoji(sf)} ${fancyName}`,
            product: product.name
          });
        });
      }
    });

    return NextResponse.json({
      success: true,
      ticketTypes
    });
  } catch (error) {
    console.error("Error fetching ticket types:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ticket types" },
      { status: 500 }
    );
  }
}

function getEmoji(shortForm: string): string {
  if (shortForm === 'SSR' || shortForm === 'SCJ') return '💎';
  if (shortForm === 'SDC') return '🏆';
  return '🎟️';
}
