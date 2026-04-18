import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/msg91-email';

export async function POST(req: Request) {
  // Force hot reload
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    const testData = {
      name: name,
      orderNumber: 'TEST01',
      orderDate: new Date().toLocaleString('en-IN'),
      email: email,
      items: [
        {
          name: "Smart Learning Mat - Basics",
          quantity: 2,
          price: 999,
          image: "https://www.swago.co/logo.png"
        },
        {
          name: "Math Explorer Kit",
          quantity: 1,
          price: 999,
          image: "https://www.swago.co/logo.png"
        }
      ],
      subtotal: '2997.00',
      discount: '0.00',
      shipping: '0.00',
      totalAmount: '2997.00',
      paymentMethod: 'Online (Test)',
      paymentStatus: 'Successful',
      address: '123 Test Street, Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    };

    console.log('🧪 Testing MSG91 email with data:', testData);

    const result = await sendOrderConfirmationEmail(testData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        response: result.response,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        response: result.response,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Test email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
