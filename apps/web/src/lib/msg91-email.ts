import * as React from 'react';
import { render } from '@react-email/render';
import OrderConfirmationEmail from '../emails/OrderConfirmationEmail';

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
  items: any[]; // Array of order items
  subtotal: string;
  discount: string;
  swagoMoneyRedeemed?: string;
  shipping: string;
  totalAmount: string;
  paymentMethod: string;
  paymentStatus: string;
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
    // Dynamically render the React Email component into an HTML string
    // Since this is a .ts file, we use React.createElement instead of JSX
    const emailElement = React.createElement(OrderConfirmationEmail, data as any);
    const htmlContent = await render(emailElement);

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

            // Pass the rendered HTML as items AND html_body. 
            // In case the MSG91 template references {{items}} or {{html_body}}, this covers both cleanly.
            items: htmlContent,
            html_body: htmlContent,

            subtotal: data.subtotal,
            discount: data.discount,
            shipping: data.shipping,
            totalAmount: data.totalAmount,
            paymentMethod: data.paymentMethod,
            paymentStatus: data.paymentStatus,
            address: `${data.address}, ${data.city}, ${data.state} - ${data.pincode}`,
          }
        }
      ],
      from: {
        email: "no-reply@support.swagojr.com",
        name: "Swago"
      },
      domain: "support.swagojr.com",
      template_id: "swagojr_order_confirmation2"
    };

    console.log('📧 Sending raw HTML email via MSG91 to:', data.email);

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
      console.log('✅ Custom order confirmation email sent via MSG91');
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

export async function sendNotificationEmail(
  toEmail: string,
  toName: string,
  subject: string,
  htmlContent: string
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
              email: toEmail,
              name: toName || 'Swago Fam',
            }
          ],
          variables: {
            // Using html_body for the template placeholder, if applicable
            html_body: htmlContent,
            items: htmlContent // Fallback in case template requires items
          }
        }
      ],
      from: {
        email: "no-reply@support.swagojr.com",
        name: "Swago"
      },
      domain: "support.swagojr.com",
      template_id: "swagojr_order_confirmation2" // Reusing the known working template
    };

    console.log('📧 Sending notification email via MSG91 to:', toEmail);

    const response = await fetch(MSG91_EMAIL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': MSG91_AUTH_KEY,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json() as MSG91Response;

    if (response.ok) {
      console.log('✅ Notification email sent via MSG91');
      return { success: true, response: result };
    } else {
      console.error('❌ MSG91 notification email failed:', result);
      return { success: false, error: result.message || 'Failed to send email', response: result };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ MSG91 notification email error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
