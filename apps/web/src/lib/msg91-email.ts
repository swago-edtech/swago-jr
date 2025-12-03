const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_EMAIL_API = 'https://control.msg91.com/api/v5/email/send';

if (!MSG91_AUTH_KEY) {
  console.warn('⚠️ MSG91_AUTH_KEY not found in environment variables');
}

export type OrderEmailData = {
  name: string;
  orderNumber: string;
  orderDate: string;
  email: string;
  items: string; // Pre-built HTML string
  totalAmount: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

// ✅ Type for MSG91 API response
interface MSG91Response {
  message?: string;
  [key: string]: unknown;
}

export async function sendOrderConfirmationEmail(
  data: OrderEmailData
): Promise<{ success: boolean; error?: string; response?: MSG91Response }> {
  if (!MSG91_AUTH_KEY) {
    return { success: false, error: 'MSG91_AUTH_KEY not configured' };
  }

  try {
    const payload = {
      recipients: [
        {
          to: [
            {
              email: data.email,
              name: data.name,
            }
          ],
          variables: {
            name: data.name,
            orderNumber: data.orderNumber,
            orderDate: data.orderDate,
            email: data.email,
            items: data.items,
            totalAmount: data.totalAmount,
            address: data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
          }
        }
      ],
      from: {
        email: "no-reply@support.swagojr.com",
        name: "Swago Junior"
      },
      domain: "support.swagojr.com",
      template_id: "swagojr_order_confirmation2"
    };

    console.log('📧 Sending email via MSG91 to:', data.email);

    const response = await fetch(MSG91_EMAIL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': MSG91_AUTH_KEY,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json() as MSG91Response;
    
    console.log('📧 MSG91 Response Status:', response.status);
    console.log('📧 MSG91 Response:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Order confirmation email sent via MSG91');
      return { success: true, response: result };
    } else {
      console.error('❌ MSG91 email failed:', result);
      return { success: false, error: result.message || 'Failed to send email', response: result };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ MSG91 Email API error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
