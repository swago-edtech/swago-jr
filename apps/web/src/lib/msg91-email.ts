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
  shipping: string;
  totalAmount: string;
  paymentMethod: string;
  paymentStatus: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

function generateOrderHtml(data: OrderEmailData) {
  const logoUrl = "https://www.swago.co/Swago_logo.png";
  const itemsHtml = data.items.map(item => `
    <div style="display: flex; margin-bottom: 20px; border-bottom: 1px dashed #eee; padding-bottom: 20px;">
        <img src="${item.image || 'https://www.swago.co/logo.png'}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 8px; border: 1px solid #eee; margin-right: 20px;">
        <div style="flex: 1;">
            <div style="font-weight: bold; font-size: 15px; color: #333;">${item.name}</div>
            <div style="font-size: 13px; color: #666; margin-top: 5px;">Qty: ${item.quantity}</div>
            <div style="font-size: 15px; font-weight: bold; color: #333; margin-top: 10px;">₹${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f4f7f6;">
    <div style="max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
        
        <!-- Premium Header -->
        <div style="padding: 40px 30px; text-align: center; background: #fff;">
             <img src="${logoUrl}" alt="Swago" style="height: 70px; margin-bottom: 25px;">
             <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Hi ${data.name}!</h1>
             <p style="margin: 15px 0 0; color: #555; font-size: 17px; line-height: 1.5;">Your order is confirmed and we're getting it ready for you.</p>
        </div>
        
        <!-- Status Indicator -->
        <div style="background-color: #00b894; color: #fff; padding: 30px; text-align: center;">
            <div style="font-weight: bold; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">✓ Order Confirmed</div>
            <div style="font-size: 14px; margin-top: 8px; opacity: 0.9;">Sit back and relax, your purchase is being processed.</div>
        </div>

        <div style="padding: 40px 30px;">
            <!-- Order Info Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; background: #fafafa; padding: 25px; border-radius: 12px; border: 1px solid #f0f0f0;">
                <div>
                    <div style="font-size: 12px; color: #999; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Order Number</div>
                    <div style="font-size: 16px; font-weight: bold; color: #333;">#${data.orderNumber}</div>
                </div>
                <div>
                    <div style="font-size: 12px; color: #999; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Order Date</div>
                    <div style="font-size: 16px; font-weight: bold; color: #333;">${data.orderDate}</div>
                </div>
                <div style="margin-top: 15px;">
                    <div style="font-size: 12px; color: #999; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Payment Method</div>
                    <div style="font-size: 15px; font-weight: bold; color: #333;">${data.paymentMethod}</div>
                </div>
                <div style="margin-top: 15px;">
                    <div style="font-size: 12px; color: #999; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Payment Status</div>
                    <div style="font-size: 15px; font-weight: bold; color: ${data.paymentStatus === 'Successful' ? '#00b894' : '#fdcb6e'}">${data.paymentStatus}</div>
                </div>
            </div>

            <!-- Items Ordered -->
            <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 25px; color: #1a1a1a;">Items Ordered</h2>
            ${itemsHtml}

            <!-- Price Breakdown -->
            <div style="background: #fff; border: 2px solid #f8f9fa; padding: 25px; border-radius: 16px; margin: 40px 0;">
                <h2 style="font-size: 18px; font-weight: 800; margin: 0 0 20px; color: #1a1a1a; display: flex; align-items: center;">
                    Price Breakup
                </h2>
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 15px; color: #666;">
                    <span>MRP Total</span>
                    <span>₹${data.subtotal}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 15px; color: #e17055;">
                    <span>Discount Applied</span>
                    <span>-₹${data.discount}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 15px; color: #666;">
                    <span>Shipping Charges</span>
                    <span style="color: #00b894; font-weight: bold;">FREE</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 2px solid #f8f9fa; margin-top: 20px; padding-top: 20px; font-weight: 900; font-size: 22px; color: #1a1a1a;">
                    <span>Total Paid</span>
                    <span>₹${data.totalAmount}</span>
                </div>
                <div style="margin-top: 15px; font-size: 13px; color: #00b894; font-weight: bold; background: #e6f7f4; padding: 10px; border-radius: 8px; text-align: center;">
                    You saved ₹${data.discount} on this order!
                </div>
            </div>

            <!-- Shipping Address -->
            <div style="background: #fdfdfd; border: 1px solid #f0f0f0; padding: 25px; border-radius: 16px;">
                <h2 style="font-size: 18px; font-weight: 800; margin: 0 0 15px; color: #1a1a1a;">Shipping Address</h2>
                <div style="font-size: 16px; line-height: 1.6; color: #444;">
                    <strong style="color: #1a1a1a;">${data.name}</strong><br>
                    ${data.address}<br>
                    ${data.city}, ${data.state} - ${data.pincode}
                </div>
            </div>

            <!-- Next Steps -->
            <div style="margin-top: 50px; background: #fff; padding-top: 30px;">
                <div style="display: flex; gap: 30px;">
                    <div style="flex: 1;">
                        <h4 style="font-size: 16px; margin: 0 0 12px; color: #1a1a1a;">What happens next?</h4>
                        <p style="font-size: 14px; color: #666; margin: 0; line-height: 1.6;">Your order will be processed within 3 working days. You'll receive tracking details via email soon.</p>
                    </div>
                    <div style="flex: 1; border-left: 1px solid #eee; padding-left: 30px;">
                         <h4 style="font-size: 16px; margin: 0 0 12px; color: #1a1a1a;">Need help?</h4>
                         <p style="font-size: 14px; color: #666; margin: 0; line-height: 1.6;">
                            Reach us at <a href="mailto:support@swagojr.com" style="color: #00b894; text-decoration: none; font-weight: bold;">support@swagojr.com</a><br>
                            or call +91 6283883397
                         </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #1a1a1a; color: #fff; padding: 40px 30px; text-align: center;">
            <p style="margin: 0 0 15px; font-size: 14px; opacity: 0.8;">Thank you for shopping with us!</p>
            <div style="font-size: 20px; font-weight: 900; margin-bottom: 20px;">SWAGO</div>
            <div style="font-size: 14px; opacity: 0.6;">
                <a href="https://www.swago.co" style="color: #fff; text-decoration: none;">Website</a> &nbsp; | &nbsp; 
                <a href="https://www.swago.co/orders" style="color: #fff; text-decoration: none;">Track Order</a>
            </div>
            <p style="margin-top: 25px; font-size: 12px; opacity: 0.4;">© 2026 Swago. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
}

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
    const htmlContent = generateOrderHtml(data);

    // Use a robust logo URL and table layout for the logo
    const logoUrl = "https://www.swago.co/Swago_logo.png";

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
            // Prepend logo and greeting to items variable using robust tables
            items: `
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <img src="${logoUrl}" alt="Swago" width="160" style="display: block; border: 0;">
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; color: #333333; padding-bottom: 30px;">
                    Hi ${data.name}, Thank you for your order!
                  </td>
                </tr>
                <tr>
                  <td>
                    ${data.items.map(item => `
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; border-bottom: 1px solid #eeeeee; padding-bottom: 15px;">
                        <tr>
                          <td width="80" valign="top">
                            <img src="${item.image || 'https://www.swago.co/logo.png'}" width="70" height="70" style="display: block; border-radius: 8px; border: 1px solid #eeeeee; object-fit: contain;">
                          </td>
                          <td valign="top" style="padding-left: 15px; font-family: Arial, sans-serif;">
                            <div style="font-weight: bold; font-size: 15px; color: #333333;">${item.name}</div>
                            <div style="font-size: 13px; color: #666666; margin-top: 5px;">Qty: ${item.quantity} | ₹${item.price}</div>
                          </td>
                          <td width="100" align="right" valign="top" style="font-family: Arial, sans-serif; font-weight: bold; font-size: 15px; color: #333333;">
                            ₹${(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      </table>
                    `).join('')}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; border-radius: 12px; border: 1px solid #eeeeee;">
                      <tr>
                        <td style="padding: 20px;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="font-family: Arial, sans-serif; font-size: 14px; color: #666666; padding-bottom: 10px;">Subtotal</td>
                              <td align="right" style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; padding-bottom: 10px;">₹${data.subtotal}</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, sans-serif; font-size: 14px; color: #e17055; font-weight: bold; padding-bottom: 10px;">Discount</td>
                              <td align="right" style="font-family: Arial, sans-serif; font-size: 14px; color: #e17055; font-weight: bold; padding-bottom: 10px;">-₹${data.discount}</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, sans-serif; font-size: 14px; color: #666666; padding-bottom: 10px;">Shipping</td>
                              <td align="right" style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; padding-bottom: 10px;">₹${data.shipping}</td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid #dddddd; padding-top: 15px; font-family: Arial, sans-serif; font-size: 18px; font-weight: 800; color: #111111;">Total Amount</td>
                              <td align="right" style="border-top: 1px solid #dddddd; padding-top: 15px; font-family: Arial, sans-serif; font-size: 18px; font-weight: 800; color: #111111;">₹${data.totalAmount}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            `,
            subtotal: data.subtotal,
            discount: data.discount,
            shipping: data.shipping,
            totalAmount: data.totalAmount,
            paymentMethod: data.paymentMethod,
            paymentStatus: data.paymentStatus,
            address: `${data.address}, ${data.city}, ${data.state} - ${data.pincode}`,
            html_body: htmlContent
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

    console.log('📧 Sending custom HTML email via MSG91 to:', data.email);

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
