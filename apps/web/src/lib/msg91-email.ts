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
  const logoUrl = "https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq";
  const itemsHtml = data.items.map(item => `
    <div style="display: flex; margin-bottom: 20px; border-bottom: 1px dashed #eee; padding-bottom: 20px;">
        <img src="${item.image || 'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq'}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 8px; border: 1px solid #eee; margin-right: 20px;">
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
        <div style="text-align: center; background: #fff;">
             <img src="${logoUrl}" alt="Swago" style="width: 100%; max-width: 600px; height: auto; display: block;">
             <div style="padding: 40px 30px;">
                 <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Hi ${data.name}!</h1>
                 <p style="margin: 15px 0 0; color: #555; font-size: 17px; line-height: 1.5;">Your order is confirmed and we're getting it ready for you.</p>
             </div>
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
            <div style="background: #fff; border: 1px solid #eee; padding: 25px; border-radius: 12px; margin: 40px 0;">
                <h2 style="font-size: 20px; font-weight: bold; margin: 0 0 20px; color: #2d3436;">Price breakup</h2>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; color: #636e72;">
                    <span>MRP</span>
                    <span style="font-weight: bold; color: #2d3436;">₹${data.subtotal}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; color: #636e72;">
                    <span>Discount</span>
                    <span style="font-weight: bold; color: #2d3436;">- ₹${data.discount}</span>
                </div>
                
                <div style="height: 1px; background: #eee; margin: 15px 0;"></div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; color: #636e72;">
                    <span>Discounted Price</span>
                    <span style="font-weight: bold; color: #2d3436;">₹${data.totalAmount}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; color: #2d3436; font-weight: bold;">
                    <span>Total Amount</span>
                    <span>₹${data.totalAmount}</span>
                </div>
                
                <div style="height: 1px; background: #eee; margin: 15px 0;"></div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 16px; color: #2d3436; font-weight: 800;">
                    <span>Net Paid</span>
                    <span>₹${data.totalAmount}</span>
                </div>
                
                <div style="font-size: 13px; color: #555; margin-top: 15px;">
                    You saved <span style="color: #00b894; font-weight: bold;">₹${data.discount}</span> on this order.
                </div>
            </div>

            <!-- Delivering at Section -->
            <div style="background: #fff; border: 1px solid #eee; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
                <h2 style="font-size: 20px; font-weight: bold; margin: 0 0 15px; color: #2d3436;">Delivering at</h2>
                <div style="font-size: 15px; line-height: 1.6; color: #636e72;">
                    <strong style="color: #2d3436;">📍 ${data.name}</strong>, ${data.address}, ${data.city}, ${data.state} - ${data.pincode}
                </div>
            </div>

            <!-- Side-by-Side Cards -->
            <div style="display: flex; gap: 20px; margin-top: 40px;">
                <!-- What's next Card -->
                <div style="flex: 1; background: #fff; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
                    <h4 style="font-size: 18px; margin: 0 0 12px; color: #2d3436; font-weight: bold;">What's next?</h4>
                    <p style="font-size: 14px; color: #636e72; margin: 0; line-height: 1.6;">
                        Once you receive your kit, look for the unique code inside! Your child can redeem it in the Kids Zone to unlock exciting digital games and activities.
                    </p>
                </div>
                
                <!-- Need help Card -->
                <div style="flex: 1; background: #fff; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
                    <h4 style="font-size: 18px; margin: 0 0 12px; color: #2d3436; font-weight: bold;">Need help?</h4>
                    <p style="font-size: 14px; color: #636e72; margin: 0; line-height: 1.6;">
                        For queries, or any assistance <a href="mailto:support@swagojr.com" style="color: #ff7675; text-decoration: none; font-weight: bold;">contact us</a> or reach out at support@swagojr.com
                    </p>
                </div>
            </div>

            <!-- Swago Junior Signature -->
            <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 30px;">
                <div style="font-weight: 800; font-size: 18px; color: #2d3436; margin-bottom: 5px;">Swago Junior</div>
                <div style="font-size: 14px; color: #636e72; margin-bottom: 20px;">Making Learning Fun & Interactive</div>
                
                <div style="font-size: 14px; color: #2d3436;">
                    <a href="https://www.swago.co" style="color: #0984e3; text-decoration: none;">Visit Website</a> &nbsp;|&nbsp; 
                    <a href="https://www.swago.co/orders" style="color: #0984e3; text-decoration: none;">Track Order</a> &nbsp;|&nbsp; 
                    <a href="mailto:support@swagojr.com" style="color: #0984e3; text-decoration: none;">Support</a>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #fafafa; border-top: 1px solid #eee; padding: 30px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #999;">
                <a href="#" style="color: #0984e3; text-decoration: underline;">Unsubscribe</a>
            </p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">© 2026 Swago Junior. All rights reserved.</p>
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
    const logoUrl = "https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq";

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
                  <td align="center" style="padding-bottom: 0;">
                    <img src="${logoUrl}" alt="Swago Banner" width="600" style="display: block; border: 0; width: 100%; max-width: 600px; height: auto;">
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; color: #333333; padding: 30px 0;">
                    Hi ${data.name}, Thank you for your order!
                  </td>
                </tr>
                <tr>
                  <td>
                    ${data.items.map(item => `
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; border-bottom: 1px solid #eeeeee; padding-bottom: 15px;">
                        <tr>
                          <td width="80" valign="top">
                            <img src="${item.image || 'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq'}" width="70" height="70" style="display: block; border-radius: 8px; border: 1px solid #eeeeee; object-fit: contain;">
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
                  <td style="padding-top: 30px; border-top: 1px solid #eeeeee; font-family: Arial, sans-serif;">
                    <!-- Price Breakup -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #eeeeee; border-radius: 12px; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 25px;">
                          <h2 style="font-size: 18px; font-weight: bold; margin: 0 0 15px; color: #2d3436;">Price breakup</h2>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="font-size: 14px; color: #636e72; padding-bottom: 10px;">MRP</td>
                              <td align="right" style="font-size: 14px; color: #2d3436; font-weight: bold; padding-bottom: 10px;">₹${data.subtotal}</td>
                            </tr>
                            <tr>
                              <td style="font-size: 14px; color: #636e72; padding-bottom: 10px;">Discount</td>
                              <td align="right" style="font-size: 14px; color: #2d3436; font-weight: bold; padding-bottom: 10px;">- ₹${data.discount}</td>
                            </tr>
                            <tr><td colspan="2" style="height: 1px; background-color: #eeeeee; margin: 10px 0;"></td></tr>
                            <tr>
                              <td style="font-size: 14px; color: #636e72; padding: 10px 0;">Discounted Price</td>
                              <td align="right" style="font-size: 14px; color: #2d3436; font-weight: bold; padding: 10px 0;">₹${data.totalAmount}</td>
                            </tr>
                            <tr>
                              <td style="font-size: 14px; color: #2d3436; font-weight: bold; padding-bottom: 10px;">Total Amount</td>
                              <td align="right" style="font-size: 14px; color: #2d3436; font-weight: bold; padding-bottom: 10px;">₹${data.totalAmount}</td>
                            </tr>
                            <tr><td colspan="2" style="height: 1px; background-color: #eeeeee; margin: 10px 0;"></td></tr>
                            <tr>
                              <td style="font-size: 16px; color: #2d3436; font-weight: 800; padding-top: 10px;">Net Paid</td>
                              <td align="right" style="font-size: 16px; color: #2d3436; font-weight: 800; padding-top: 10px;">₹${data.totalAmount}</td>
                            </tr>
                          </table>
                          <div style="font-size: 12px; color: #555555; margin-top: 15px;">
                            You saved <span style="color: #00b894; font-weight: bold;">₹${data.discount}</span> on this order.
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Delivering at -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #eeeeee; border-radius: 12px; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 25px;">
                          <h2 style="font-size: 18px; font-weight: bold; margin: 0 0 10px; color: #2d3436;">Delivering at</h2>
                          <div style="font-size: 14px; color: #636e72; line-height: 1.5;">
                            <strong style="color: #2d3436;">📍 ${data.name}</strong>, ${data.address}, ${data.city}, ${data.state} - ${data.pincode}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- What's next and Need help cards -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                      <tr>
                        <td width="48%" valign="top" style="background-color: #ffffff; border: 1px solid #eeeeee; border-radius: 12px; padding: 20px;">
                          <h4 style="font-size: 16px; font-weight: bold; margin: 0 0 10px; color: #2d3436;">What's next?</h4>
                          <p style="font-size: 13px; color: #636e72; margin: 0; line-height: 1.5;">
                            Once you receive your kit, look for the unique code inside! Your child can redeem it in the Kids Zone to unlock exciting digital games and activities.
                          </p>
                        </td>
                        <td width="4%"></td>
                        <td width="48%" valign="top" style="background-color: #ffffff; border: 1px solid #eeeeee; border-radius: 12px; padding: 20px;">
                          <h4 style="font-size: 16px; font-weight: bold; margin: 0 0 10px; color: #2d3436;">Need help?</h4>
                          <p style="font-size: 13px; color: #636e72; margin: 0; line-height: 1.5;">
                            For queries, or any assistance <a href="mailto:support@swagojr.com" style="color: #ff7675; text-decoration: none; font-weight: bold;">contact us</a> or reach out at support@swagojr.com
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Signature -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #eeeeee; padding-top: 25px;">
                      <tr>
                        <td>
                          <div style="font-weight: 800; font-size: 16px; color: #2d3436; margin-bottom: 5px;">Swago Junior</div>
                          <div style="font-size: 13px; color: #636e72; margin-bottom: 15px;">Making Learning Fun & Interactive</div>
                          <div style="font-size: 13px; color: #2d3436;">
                            <a href="https://www.swago.co" style="color: #0984e3; text-decoration: none;">Visit Website</a> &nbsp;|&nbsp; 
                            <a href="https://www.swago.co/orders" style="color: #0984e3; text-decoration: none;">Track Order</a> &nbsp;|&nbsp; 
                            <a href="mailto:support@swagojr.com" style="color: #0984e3; text-decoration: none;">Support</a>
                          </div>
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
