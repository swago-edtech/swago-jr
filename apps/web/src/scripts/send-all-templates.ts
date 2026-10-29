import * as React from 'react';
import { render } from '@react-email/render';
import OrderConfirmationEmail, { OrderConfirmationEmailProps } from '../emails/OrderConfirmationEmail';
import OrderAdminNotificationEmail, { AdminOrderEmailProps } from '../emails/OrderAdminNotificationEmail';

const MSG91_AUTH_KEY = '479425AQjIf0JN69255002P1';
const MSG91_EMAIL_API = 'https://control.msg91.com/api/v5/email/send';
const TARGET_EMAIL = 'janasomnath173@gmail.com';
const TARGET_NAME = 'Somnath Jana';

async function sendViaMSG91(subjectTag: string, htmlContent: string, extraVars: Record<string, any> = {}) {
  const payload = {
    recipients: [
      {
        to: [
          {
            email: TARGET_EMAIL,
            name: TARGET_NAME,
          },
        ],
        variables: {
          html_body: htmlContent,
          items: htmlContent,
          ...extraVars,
        },
      },
    ],
    from: {
      email: 'no-reply@support.swagojr.com',
      name: 'Swago',
    },
    domain: 'support.swagojr.com',
    template_id: 'swagojr_order_confirmation2',
  };

  console.log(`\n======================================================`);
  console.log(`🚀 Sending [${subjectTag}] to ${TARGET_EMAIL}...`);
  console.log(`======================================================`);

  const response = await fetch(MSG91_EMAIL_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: MSG91_AUTH_KEY,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(result, null, 2));

  if (response.ok && (result as any).status === 'success') {
    console.log(`✅ [${subjectTag}] sent successfully!`);
    return { success: true, result };
  } else {
    console.error(`❌ [${subjectTag}] failed to send!`, result);
    return { success: false, result };
  }
}

// Helper to escape HTML in low stock
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function main() {
  console.log(`Starting to send all email templates to ${TARGET_EMAIL}...`);
  const results: Record<string, boolean> = {};

  // 1. Order Confirmation Email (Domestic - INR)
  console.log('\n--- 1. Rendering Customer Order Confirmation (Domestic INR) ---');
  const domesticOrderProps: OrderConfirmationEmailProps = {
    name: 'Somnath Jana',
    orderNumber: 'SW-82491',
    orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    email: TARGET_EMAIL,
    items: [
      {
        name: 'Seek Rush - Focus Building Board Game for Kids',
        quantity: 1,
        price: 999.00,
        image: 'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq',
      },
      {
        name: 'Smart Learning Activity Mat - Explorer Edition',
        quantity: 2,
        price: 749.00,
        image: 'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq',
      },
    ],
    subtotal: '2497.00',
    discount: '250.00',
    swagoMoneyRedeemed: '100.00',
    shipping: '0.00',
    totalAmount: '2147.00',
    paymentMethod: 'Online (Prepaid)',
    paymentStatus: 'Successful',
    address: 'Flat 402, Green Meadows Apartment, 14th Main, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    currencySymbol: '₹',
    shippingLabel: 'Standard Shipping',
  };

  const htmlOrderConfirmDomestic = await render(React.createElement(OrderConfirmationEmail, domesticOrderProps));
  const res1 = await sendViaMSG91('1. Customer Order Confirmation (Domestic INR)', htmlOrderConfirmDomestic, {
    name: domesticOrderProps.name,
    orderNumber: domesticOrderProps.orderNumber,
    orderDate: domesticOrderProps.orderDate,
    email: domesticOrderProps.email,
    subtotal: domesticOrderProps.subtotal,
    discount: domesticOrderProps.discount,
    shipping: domesticOrderProps.shipping,
    totalAmount: domesticOrderProps.totalAmount,
    paymentMethod: domesticOrderProps.paymentMethod,
    paymentStatus: domesticOrderProps.paymentStatus,
    address: `${domesticOrderProps.address}, ${domesticOrderProps.city}, ${domesticOrderProps.state} - ${domesticOrderProps.pincode}`,
  });
  results['1_Customer_Order_Confirmation_Domestic'] = res1.success;

  await new Promise((r) => setTimeout(r, 2000));

  // 2. Order Confirmation Email (International - USD)
  console.log('\n--- 2. Rendering Customer Order Confirmation (International USD) ---');
  const intlOrderProps: OrderConfirmationEmailProps = {
    name: 'Somnath Jana',
    orderNumber: 'SW-INT-9014',
    orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    email: TARGET_EMAIL,
    items: [
      {
        name: 'Seek Rush - Focus Building Board Game (International Pack)',
        quantity: 1,
        price: 29.99,
        image: 'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq',
      },
      {
        name: 'Math Explorer & Sensory Board Game Kit',
        quantity: 1,
        price: 19.99,
        image: 'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq',
      },
    ],
    subtotal: '49.98',
    discount: '5.00',
    swagoMoneyRedeemed: '0.00',
    shipping: '15.00',
    totalAmount: '59.98',
    paymentMethod: 'Online (Stripe / Credit Card)',
    paymentStatus: 'Successful',
    address: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'Oregon',
    pincode: '97477',
    currencySymbol: '$',
    shippingLabel: 'DHL Express International Shipping',
  };

  const htmlOrderConfirmIntl = await render(React.createElement(OrderConfirmationEmail, intlOrderProps));
  const res2 = await sendViaMSG91('2. Customer Order Confirmation (International USD)', htmlOrderConfirmIntl, {
    name: intlOrderProps.name,
    orderNumber: intlOrderProps.orderNumber,
    orderDate: intlOrderProps.orderDate,
    email: intlOrderProps.email,
    subtotal: intlOrderProps.subtotal,
    discount: intlOrderProps.discount,
    shipping: intlOrderProps.shipping,
    totalAmount: intlOrderProps.totalAmount,
    paymentMethod: intlOrderProps.paymentMethod,
    paymentStatus: intlOrderProps.paymentStatus,
    address: `${intlOrderProps.address}, ${intlOrderProps.city}, ${intlOrderProps.state} - ${intlOrderProps.pincode}`,
  });
  results['2_Customer_Order_Confirmation_Intl'] = res2.success;

  await new Promise((r) => setTimeout(r, 2000));

  // 3. Admin Order Notification Email (Domestic)
  console.log('\n--- 3. Rendering Store Admin Order Notification (Domestic) ---');
  const adminOrderProps: AdminOrderEmailProps = {
    orderNumber: 'SW-82491',
    orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    customerName: 'Somnath Jana',
    customerEmail: TARGET_EMAIL,
    customerPhone: '+91 98765 43210',
    shippingMethod: 'Express Delivery (Blue Dart Air)',
    paymentMethod: 'Online (Razorpay UPI)',
    subtotal: '2497.00',
    discount: '250.00',
    couponCode: 'FESTIVE10',
    swagoMoneyRedeemed: '100.00',
    shippingFee: '0.00',
    totalAmount: '2147.00',
    adminUrl: 'https://admin.swagojr.com/orders/SW-82491',
    items: [
      {
        name: 'Seek Rush - Focus Building Board Game for Kids',
        quantity: 1,
        price: '999.00',
      },
      {
        name: 'Smart Learning Activity Mat - Explorer Edition',
        quantity: 2,
        price: '1498.00',
      },
    ],
  };

  const htmlAdminOrder = await render(React.createElement(OrderAdminNotificationEmail, adminOrderProps));
  const res3 = await sendViaMSG91('3. Store Admin Order Notification (Domestic)', htmlAdminOrder);
  results['3_Admin_Order_Notification_Domestic'] = res3.success;

  await new Promise((r) => setTimeout(r, 2000));

  // 4. Admin Order Notification Email (International)
  console.log('\n--- 4. Rendering Store Admin Order Notification (International) ---');
  const adminOrderIntlProps: AdminOrderEmailProps = {
    orderNumber: 'SW-INT-9014',
    orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    customerName: 'Somnath Jana',
    customerEmail: TARGET_EMAIL,
    customerPhone: '+1 (555) 234-5678',
    shippingMethod: 'DHL Express International Shipping',
    paymentMethod: 'Online (Stripe)',
    subtotal: '49.98',
    discount: '5.00',
    couponCode: 'GLOBAL5',
    swagoMoneyRedeemed: '0.00',
    shippingFee: '15.00',
    totalAmount: '59.98',
    adminUrl: 'https://admin.swagojr.com/orders/SW-INT-9014',
    items: [
      {
        name: 'Seek Rush - Focus Building Board Game (International Pack)',
        quantity: 1,
        price: '29.99',
      },
      {
        name: 'Math Explorer & Sensory Board Game Kit',
        quantity: 1,
        price: '19.99',
      },
    ],
    internationalLines: [
      'Destination: United States (US)',
      'Currency Charged: $59.98 USD',
      'Calculated Base: ₹4,175 INR (FX: 1 USD = 83.50 INR)',
      'Customs Duty: Prepaid (DDP)',
    ],
  };

  const htmlAdminOrderIntl = await render(React.createElement(OrderAdminNotificationEmail, adminOrderIntlProps));
  const res4 = await sendViaMSG91('4. Store Admin Order Notification (International)', htmlAdminOrderIntl);
  results['4_Admin_Order_Notification_Intl'] = res4.success;

  await new Promise((r) => setTimeout(r, 2000));

  // 5. Low Stock Alert Email
  console.log('\n--- 5. Rendering Inventory Low Stock Alert ---');
  const lowStockItems = [
    { name: 'Seek Rush Board Game', sku: 'SW-GAME-01', currentStock: 3, lowStockThreshold: 10, unit: 'pcs' },
    { name: 'Math Explorer Kit - Age 4-7', sku: 'SW-KIT-04', currentStock: 0, lowStockThreshold: 15, unit: 'kits' },
    { name: 'Interactive Sound Book - Animals', sku: 'SW-BOOK-02', currentStock: 5, lowStockThreshold: 20, unit: 'pcs' },
  ];

  const lowStockRows = lowStockItems
    .map(
      (i) =>
        `<tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#1e293b">${escapeHtml(i.name)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#64748b;text-align:center">${escapeHtml(i.sku || '—')}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:700;color:#dc2626;text-align:center">${i.currentStock}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#64748b;text-align:center">${i.lowStockThreshold}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#64748b;text-align:center">${escapeHtml(i.unit)}</td>
        </tr>`
    )
    .join('\n');

  const htmlLowStock = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f8fafc">
<table align="center" width="600" cellpadding="0" cellspacing="0" style="margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
<tr><td style="padding:0">
  <div style="background:#dc2626;padding:28px 36px;text-align:center">
    <h1 style="margin:0;font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.01em">⚠️ Low Stock Alert</h1>
    <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:500">Inventory items have fallen below their low-stock threshold</p>
  </div>
  <div style="padding:24px 28px">
    <p style="font-size:15px;color:#334155;margin:0 0 8px">The following <strong style="color:#dc2626">${lowStockItems.length}</strong> inventory items need attention:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-top:12px">
      <thead>
        <tr style="background:#f1f5f9">
          <th style="padding:10px 12px;font-size:12px;font-weight:700;color:#475569;text-align:left;text-transform:uppercase;letter-spacing:0.05em">Item</th>
          <th style="padding:10px 12px;font-size:12px;font-weight:700;color:#475569;text-align:center;text-transform:uppercase;letter-spacing:0.05em">SKU</th>
          <th style="padding:10px 12px;font-size:12px;font-weight:700;color:#475569;text-align:center;text-transform:uppercase;letter-spacing:0.05em">Stock</th>
          <th style="padding:10px 12px;font-size:12px;font-weight:700;color:#475569;text-align:center;text-transform:uppercase;letter-spacing:0.05em">Threshold</th>
          <th style="padding:10px 12px;font-size:12px;font-weight:700;color:#475569;text-align:center;text-transform:uppercase;letter-spacing:0.05em">Unit</th>
        </tr>
      </thead>
      <tbody>
${lowStockRows}
      </tbody>
    </table>
    <p style="font-size:13px;color:#64748b;margin:16px 0 0;padding:12px 0 0;border-top:1px solid #e5e7eb">Please review and arrange replenishment at the earliest convenience.</p>
  </div>
  <div style="background:#f8fafc;padding:16px 28px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="margin:0;font-size:12px;color:#94a3b8">Swago Inventory System &middot; Automated Alert</p>
  </div>
</td></tr></table>
</body>
</html>`;

  const res5 = await sendViaMSG91('5. Inventory Low Stock Alert', htmlLowStock);
  results['5_Low_Stock_Alert'] = res5.success;

  await new Promise((r) => setTimeout(r, 2000));

  // 6. Lottery Winner Notification Email
  console.log('\n--- 6. Rendering Lottery Winner Announcement ---');
  const lotteryWinnerHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #eaeaea;">
        <h2 style="color: #1e3a8a; text-align: center;">Congratulations, ${TARGET_NAME}! 🏆</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">
            Amazing news! You have been selected as a winner in this week's Swago Jr. Lottery Draw!
        </p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #4b5563; font-size: 14px;"><strong>Prize Credited:</strong> ₹500 Swago Money</p>
            <p style="margin: 5px 0 0; color: #4b5563; font-size: 14px;"><strong>Winning Ticket:</strong> SWAGO-WIN-9821</p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">
            Your reward has already been deposited directly into your account and is ready to use on your next purchase!
        </p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://swagojr.com" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Shop Now
            </a>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
            If you have any questions, please reply to this email.<br/>
            © ${new Date().getFullYear()} Swago Jr. All rights reserved.
        </p>
    </div>
  `;

  const res6 = await sendViaMSG91('6. Lottery Winner Notification', lotteryWinnerHtml);
  results['6_Lottery_Winner_Notification'] = res6.success;

  await new Promise((r) => setTimeout(r, 2000));

  // 7. Manual Deposit Notification Email
  console.log('\n--- 7. Rendering Manual Swago Money Deposit ---');
  const manualDepositHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #eaeaea;">
        <h2 style="color: #1e3a8a; text-align: center;">Congratulations, ${TARGET_NAME}! 🎉</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">
            Great news! Your Swago Jr. account has just been credited with <strong>₹250 Swago Money</strong>.
        </p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #4b5563; font-size: 14px;"><strong>Reason:</strong> Early Adopter & Loyalty Bonus</p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">
            You can use this money directly towards your next purchase of our premium products!
        </p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://swagojr.com" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Shop Now
            </a>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
            If you have any questions, please reply to this email.<br/>
            © ${new Date().getFullYear()} Swago Jr. All rights reserved.
        </p>
    </div>
  `;

  const res7 = await sendViaMSG91('7. Manual Wallet Deposit Notification', manualDepositHtml);
  results['7_Manual_Deposit_Notification'] = res7.success;

  console.log('\n======================================================');
  console.log('🏁 SUMMARY OF EMAIL TRANSMISSIONS:');
  console.log(JSON.stringify(results, null, 2));
  console.log('======================================================');
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
