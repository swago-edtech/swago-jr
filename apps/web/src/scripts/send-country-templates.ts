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

async function main() {
  console.log(`Starting transmission of country-specific & conditional templates to ${TARGET_EMAIL}...`);
  const results: Record<string, boolean> = {};

  // --------------------------------------------------------------------------
  // 1. INDIA - CASH ON DELIVERY (COD) CUSTOMER & ADMIN
  // --------------------------------------------------------------------------
  console.log('\n--- 1. India Domestic - Cash on Delivery (COD) ---');
  const indiaCodProps: OrderConfirmationEmailProps = {
    name: TARGET_NAME,
    orderNumber: 'SW-COD-41092',
    orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    email: TARGET_EMAIL,
    items: [
      {
        name: 'Seek Rush - Focus Building Board Game for Kids',
        quantity: 1,
        price: 999.00,
        image: 'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq',
      },
    ],
    subtotal: '999.00',
    discount: '100.00',
    swagoMoneyRedeemed: '0.00',
    shipping: '50.00',
    totalAmount: '949.00',
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending',
    address: 'Flat 104, Sunrise Residency, Dugri Road',
    city: 'Ludhiana',
    state: 'Punjab',
    pincode: '141013',
    currencySymbol: '₹',
    shippingLabel: 'Standard COD Shipping',
  };

  const htmlIndiaCod = await render(React.createElement(OrderConfirmationEmail, indiaCodProps));
  const res1 = await sendViaMSG91('India COD Customer Confirmation (Amount to Pay on Delivery)', htmlIndiaCod, {
    name: indiaCodProps.name,
    orderNumber: indiaCodProps.orderNumber,
    orderDate: indiaCodProps.orderDate,
    email: indiaCodProps.email,
    subtotal: indiaCodProps.subtotal,
    discount: indiaCodProps.discount,
    shipping: indiaCodProps.shipping,
    totalAmount: indiaCodProps.totalAmount,
    paymentMethod: indiaCodProps.paymentMethod,
    paymentStatus: indiaCodProps.paymentStatus,
    address: `${indiaCodProps.address}, ${indiaCodProps.city}, ${indiaCodProps.state} - ${indiaCodProps.pincode}`,
  });
  results['1_India_COD_Customer'] = res1.success;
  await new Promise((r) => setTimeout(r, 2000));

  // --------------------------------------------------------------------------
  // 2. CANADA (CA - CAD CA$) CUSTOMER & ADMIN
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Canada (CAD CA$) Customer Confirmation ---');
  const canadaProps: OrderConfirmationEmailProps = {
    name: TARGET_NAME,
    orderNumber: 'SW-CA-88210',
    orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    email: TARGET_EMAIL,
    items: [
      {
        name: 'Seek Rush - Focus Building Board Game (Canadian Edition)',
        quantity: 1,
        price: 39.99,
        image: 'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq',
      },
      {
        name: 'Smart Learning Activity Mat - Explorer Edition',
        quantity: 1,
        price: 29.99,
        image: 'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq',
      },
    ],
    subtotal: '69.98',
    discount: '7.00',
    swagoMoneyRedeemed: '0.00',
    shipping: '12.00',
    totalAmount: '74.98',
    paymentMethod: 'Online (Stripe / Credit Card)',
    paymentStatus: 'Successful',
    address: '150 King Street West, Suite 300',
    city: 'Toronto',
    state: 'Ontario',
    pincode: 'M5H 1J9',
    currencySymbol: 'CA$',
    shippingLabel: 'Canada Post / DHL International Shipping',
  };

  const htmlCanada = await render(React.createElement(OrderConfirmationEmail, canadaProps));
  const res2 = await sendViaMSG91('Canada (CAD CA$) Customer Order Confirmation', htmlCanada, {
    name: canadaProps.name,
    orderNumber: canadaProps.orderNumber,
    orderDate: canadaProps.orderDate,
    email: canadaProps.email,
    subtotal: canadaProps.subtotal,
    discount: canadaProps.discount,
    shipping: canadaProps.shipping,
    totalAmount: canadaProps.totalAmount,
    paymentMethod: canadaProps.paymentMethod,
    paymentStatus: canadaProps.paymentStatus,
    address: `${canadaProps.address}, ${canadaProps.city}, ${canadaProps.state} - ${canadaProps.pincode}`,
  });
  results['2_Canada_CAD_Customer'] = res2.success;
  await new Promise((r) => setTimeout(r, 2000));

  console.log('\n--- 2b. Canada (CAD) Store Admin Order Notification ---');
  const canadaAdminProps: AdminOrderEmailProps = {
    orderNumber: 'SW-CA-88210',
    orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    customerName: TARGET_NAME,
    customerEmail: TARGET_EMAIL,
    customerPhone: '+1 (416) 555-0199',
    shippingMethod: 'International Shipping (Canada Post)',
    paymentMethod: 'Online (Stripe CAD)',
    subtotal: '4373.75',
    discount: '437.50',
    couponCode: 'CANADA10',
    swagoMoneyRedeemed: '0.00',
    shippingFee: '500.00',
    totalAmount: '4436.25',
    adminUrl: 'https://admin.swagojr.com/orders/SW-CA-88210',
    items: [
      { name: 'Seek Rush - Focus Building Board Game (Canadian Edition)', quantity: 1, price: '2499.38' },
      { name: 'Smart Learning Activity Mat - Explorer Edition', quantity: 1, price: '1874.38' },
    ],
    internationalLines: [
      'Country: Canada (CA)',
      'Charged: CA$74.98 (items CA$62.98, shipping CA$12.00)',
      'Exchange rate used: 1 INR = 0.016 CAD',
      'Ledger Currency: INR (₹4,436.25)',
    ],
  };

  const htmlCanadaAdmin = await render(React.createElement(OrderAdminNotificationEmail, canadaAdminProps));
  const res2b = await sendViaMSG91('Canada (CAD) Store Admin Order Notification', htmlCanadaAdmin);
  results['2b_Canada_CAD_Admin'] = res2b.success;
  await new Promise((r) => setTimeout(r, 2000));

  // --------------------------------------------------------------------------
  // 3. UNITED ARAB EMIRATES (AE - AED د.إ) CUSTOMER & ADMIN
  // --------------------------------------------------------------------------
  console.log('\n--- 3. United Arab Emirates (AED د.إ) Customer Confirmation ---');
  const uaeProps: OrderConfirmationEmailProps = {
    name: TARGET_NAME,
    orderNumber: 'SW-AE-55104',
    orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    email: TARGET_EMAIL,
    items: [
      {
        name: 'Seek Rush - Focus Building Board Game for Kids',
        quantity: 2,
        price: 88.00,
        image: 'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq',
      },
    ],
    subtotal: '176.00',
    discount: '18.00',
    swagoMoneyRedeemed: '0.00',
    shipping: '25.00',
    totalAmount: '183.00',
    paymentMethod: 'Online (Credit Card / Apple Pay)',
    paymentStatus: 'Successful',
    address: 'Apartment 1208, Business Bay Tower, Marasi Drive',
    city: 'Dubai',
    state: 'Dubai',
    pincode: '00000',
    currencySymbol: 'د.إ',
    shippingLabel: 'Aramex / DHL Express Gulf Delivery',
  };

  const htmlUae = await render(React.createElement(OrderConfirmationEmail, uaeProps));
  const res3 = await sendViaMSG91('UAE (AED د.إ) Customer Order Confirmation', htmlUae, {
    name: uaeProps.name,
    orderNumber: uaeProps.orderNumber,
    orderDate: uaeProps.orderDate,
    email: uaeProps.email,
    subtotal: uaeProps.subtotal,
    discount: uaeProps.discount,
    shipping: uaeProps.shipping,
    totalAmount: uaeProps.totalAmount,
    paymentMethod: uaeProps.paymentMethod,
    paymentStatus: uaeProps.paymentStatus,
    address: `${uaeProps.address}, ${uaeProps.city}, ${uaeProps.state} - ${uaeProps.pincode}`,
  });
  results['3_UAE_AED_Customer'] = res3.success;
  await new Promise((r) => setTimeout(r, 2000));

  console.log('\n--- 3b. UAE (AED) Store Admin Order Notification ---');
  const uaeAdminProps: AdminOrderEmailProps = {
    orderNumber: 'SW-AE-55104',
    orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    customerName: TARGET_NAME,
    customerEmail: TARGET_EMAIL,
    customerPhone: '+971 50 123 4567',
    shippingMethod: 'International Shipping (Aramex)',
    paymentMethod: 'Online (Stripe AED)',
    subtotal: '4000.00',
    discount: '409.00',
    couponCode: 'DUBAI10',
    swagoMoneyRedeemed: '0.00',
    shippingFee: '200.00',
    totalAmount: '3791.00',
    adminUrl: 'https://admin.swagojr.com/orders/SW-AE-55104',
    items: [
      { name: 'Seek Rush - Focus Building Board Game for Kids', quantity: 2, price: '2000.00' },
    ],
    internationalLines: [
      'Country: United Arab Emirates (AE)',
      'Charged: AED 183.00 (items AED 158.00, shipping AED 25.00)',
      'Exchange rate used: 1 INR = 0.044 AED',
      'Ledger Currency: INR (₹3,791.00)',
    ],
  };

  const htmlUaeAdmin = await render(React.createElement(OrderAdminNotificationEmail, uaeAdminProps));
  const res3b = await sendViaMSG91('UAE (AED) Store Admin Order Notification', htmlUaeAdmin);
  results['3b_UAE_AED_Admin'] = res3b.success;
  await new Promise((r) => setTimeout(r, 2000));

  // --------------------------------------------------------------------------
  // 4. UNITED KINGDOM (GB - GBP £) CUSTOMER & ADMIN
  // --------------------------------------------------------------------------
  console.log('\n--- 4. United Kingdom (GBP £) Customer Confirmation ---');
  const ukProps: OrderConfirmationEmailProps = {
    name: TARGET_NAME,
    orderNumber: 'SW-UK-39108',
    orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    email: TARGET_EMAIL,
    items: [
      {
        name: 'Seek Rush - Focus Building Board Game for Kids',
        quantity: 1,
        price: 24.50,
        image: 'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq',
      },
      {
        name: 'Math Explorer & Logic Puzzle Kit',
        quantity: 1,
        price: 18.00,
        image: 'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq',
      },
    ],
    subtotal: '42.50',
    discount: '4.25',
    swagoMoneyRedeemed: '0.00',
    shipping: '9.50',
    totalAmount: '47.75',
    paymentMethod: 'Online (Credit Card / Google Pay)',
    paymentStatus: 'Successful',
    address: '10 Downing Street, Westminster',
    city: 'London',
    state: 'Greater London',
    pincode: 'SW1A 2AA',
    currencySymbol: '£',
    shippingLabel: 'Royal Mail International Tracked',
  };

  const htmlUk = await render(React.createElement(OrderConfirmationEmail, ukProps));
  const res4 = await sendViaMSG91('United Kingdom (GBP £) Customer Order Confirmation', htmlUk, {
    name: ukProps.name,
    orderNumber: ukProps.orderNumber,
    orderDate: ukProps.orderDate,
    email: ukProps.email,
    subtotal: ukProps.subtotal,
    discount: ukProps.discount,
    shipping: ukProps.shipping,
    totalAmount: ukProps.totalAmount,
    paymentMethod: ukProps.paymentMethod,
    paymentStatus: ukProps.paymentStatus,
    address: `${ukProps.address}, ${ukProps.city}, ${ukProps.state} - ${ukProps.pincode}`,
  });
  results['4_UK_GBP_Customer'] = res4.success;
  await new Promise((r) => setTimeout(r, 2000));

  console.log('\n--- 4b. United Kingdom (GBP £) Store Admin Order Notification ---');
  const ukAdminProps: AdminOrderEmailProps = {
    orderNumber: 'SW-UK-39108',
    orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    customerName: TARGET_NAME,
    customerEmail: TARGET_EMAIL,
    customerPhone: '+44 20 7946 0912',
    shippingMethod: 'International Shipping (Royal Mail)',
    paymentMethod: 'Online (Stripe GBP)',
    subtotal: '4521.28',
    discount: '452.13',
    couponCode: 'UK10',
    swagoMoneyRedeemed: '0.00',
    shippingFee: '500.00',
    totalAmount: '4569.15',
    adminUrl: 'https://admin.swagojr.com/orders/SW-UK-39108',
    items: [
      { name: 'Seek Rush - Focus Building Board Game for Kids', quantity: 1, price: '2606.38' },
      { name: 'Math Explorer & Logic Puzzle Kit', quantity: 1, price: '1914.89' },
    ],
    internationalLines: [
      'Country: United Kingdom (GB)',
      'Charged: £47.75 (items £38.25, shipping £9.50)',
      'Exchange rate used: 1 INR = 0.0094 GBP',
      'Ledger Currency: INR (₹4,569.15)',
    ],
  };

  const htmlUkAdmin = await render(React.createElement(OrderAdminNotificationEmail, ukAdminProps));
  const res4b = await sendViaMSG91('United Kingdom (GBP £) Store Admin Order Notification', htmlUkAdmin);
  results['4b_UK_GBP_Admin'] = res4b.success;
  await new Promise((r) => setTimeout(r, 2000));

  // --------------------------------------------------------------------------
  // 5. EUROPEAN UNION (DE - EUR €) CUSTOMER & ADMIN
  // --------------------------------------------------------------------------
  console.log('\n--- 5. European Union (EUR €) Customer Confirmation ---');
  const euProps: OrderConfirmationEmailProps = {
    name: TARGET_NAME,
    orderNumber: 'SW-EU-77291',
    orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    email: TARGET_EMAIL,
    items: [
      {
        name: 'Seek Rush - Focus Building Board Game for Kids',
        quantity: 1,
        price: 28.50,
        image: 'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq',
      },
      {
        name: 'Smart Learning Activity Mat - Explorer Edition',
        quantity: 1,
        price: 21.00,
        image: 'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq',
      },
    ],
    subtotal: '49.50',
    discount: '5.00',
    swagoMoneyRedeemed: '0.00',
    shipping: '11.00',
    totalAmount: '55.50',
    paymentMethod: 'Online (Klarna / Credit Card)',
    paymentStatus: 'Successful',
    address: 'Friedrichstraße 43',
    city: 'Berlin',
    state: 'Berlin',
    pincode: '10117',
    currencySymbol: '€',
    shippingLabel: 'DHL Express International Priority',
  };

  const htmlEu = await render(React.createElement(OrderConfirmationEmail, euProps));
  const res5 = await sendViaMSG91('European Union (EUR €) Customer Order Confirmation', htmlEu, {
    name: euProps.name,
    orderNumber: euProps.orderNumber,
    orderDate: euProps.orderDate,
    email: euProps.email,
    subtotal: euProps.subtotal,
    discount: euProps.discount,
    shipping: euProps.shipping,
    totalAmount: euProps.totalAmount,
    paymentMethod: euProps.paymentMethod,
    paymentStatus: euProps.paymentStatus,
    address: `${euProps.address}, ${euProps.city}, ${euProps.state} - ${euProps.pincode}`,
  });
  results['5_EU_EUR_Customer'] = res5.success;
  await new Promise((r) => setTimeout(r, 2000));

  // --------------------------------------------------------------------------
  // 6. AUSTRALIA (AU - AUD A$) CUSTOMER & ADMIN
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Australia (AUD A$) Customer Confirmation ---');
  const ausProps: OrderConfirmationEmailProps = {
    name: TARGET_NAME,
    orderNumber: 'SW-AU-62914',
    orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    email: TARGET_EMAIL,
    items: [
      {
        name: 'Seek Rush - Focus Building Board Game for Kids',
        quantity: 1,
        price: 45.00,
        image: 'https://gateway.pinata.cloud/ipfs/bafybeihlhw37q43gmnxgpdynjymvkxgtga4acaqa7df2va2gx7rkpd3dcq',
      },
    ],
    subtotal: '45.00',
    discount: '4.50',
    swagoMoneyRedeemed: '0.00',
    shipping: '15.00',
    totalAmount: '55.50',
    paymentMethod: 'Online (Stripe AUD)',
    paymentStatus: 'Successful',
    address: '42 George Street, The Rocks',
    city: 'Sydney',
    state: 'New South Wales',
    pincode: '2000',
    currencySymbol: 'A$',
    shippingLabel: 'Australia Post International Express',
  };

  const htmlAus = await render(React.createElement(OrderConfirmationEmail, ausProps));
  const res6 = await sendViaMSG91('Australia (AUD A$) Customer Order Confirmation', htmlAus, {
    name: ausProps.name,
    orderNumber: ausProps.orderNumber,
    orderDate: ausProps.orderDate,
    email: ausProps.email,
    subtotal: ausProps.subtotal,
    discount: ausProps.discount,
    shipping: ausProps.shipping,
    totalAmount: ausProps.totalAmount,
    paymentMethod: ausProps.paymentMethod,
    paymentStatus: ausProps.paymentStatus,
    address: `${ausProps.address}, ${ausProps.city}, ${ausProps.state} - ${ausProps.pincode}`,
  });
  results['6_Australia_AUD_Customer'] = res6.success;

  console.log('\n======================================================');
  console.log('🏁 SUMMARY OF COUNTRY-SPECIFIC TRANSMISSIONS:');
  console.log(JSON.stringify(results, null, 2));
  console.log('======================================================');
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
