import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ReturnGiftOrder, GiftingPageConfig } from '@swago/database';
import { z } from 'zod';

// Validation schema
const returnGiftSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(10, 'Phone number is required').max(15),
  email: z.string().email('Invalid email address'),
  product: z.string().min(1, 'Product selection is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  address: z.string().min(5, 'Address must be at least 5 characters').max(500),
  message: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validation = returnGiftSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          error: validation.error.issues[0].message 
        },
        { status: 400 }
      );
    }

    const { name, phone, email, product, quantity, address, message } = validation.data;

    // Connect to database
    await connectDB();

    // Create return gift order
    const order = await ReturnGiftOrder.create({
      name,
      phone,
      email,
      product,
      quantity,
      address,
      message,
      status: 'pending',
    });

    console.log('Return Gift form submitted:', {
      id: order._id,
      name,
      email,
    });

    return NextResponse.json({
      success: true,
      message: 'Your request has been submitted successfully! We\'ll contact you soon.',
    });
  } catch (error: unknown) {
    console.error('Return Gift form submission error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to submit your request. Please try again later.' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    
    let config = await GiftingPageConfig.findOne({ isSingleton: true });
    
    if (!config) {
      config = await GiftingPageConfig.create({
        bannerDesktopUrl: '',
        bannerMobileUrl: '',
        isSingleton: true
      });
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error fetching gifting config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}
