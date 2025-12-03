import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/msg91-email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Build sample items HTML
    const itemsHtml = `
      <tr class="item-row">
        <td class="item-name">Smart Learning Mat - Basics</td>
        <td class="item-qty">x2</td>
        <td class="item-price">₹1,998.00</td>
      </tr>
      <tr class="item-row">
        <td class="item-name">Math Explorer Kit</td>
        <td class="item-qty">x1</td>
        <td class="item-price">₹999.00</td>
      </tr>
    `;

    const testData = {
      name: name,
      orderNumber: 'TEST01',
      orderDate: new Date().toLocaleString('en-IN'),
      email: email,
      items: itemsHtml,
      totalAmount: '2997.00',
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
