import * as React from 'react';
import { render } from '@react-email/render';
import OrderConfirmationEmail from '../emails/templates/OrderConfirmation';
import OrderAdminNotificationEmail, {
  type AdminOrderEmailProps,
} from '../emails/templates/OrderAdminNotification';
import { MSG91_EMAIL, getMsg91TemplateId } from '../emails/templates/msg91';
import {
  buildOrderConfirmationVariables,
  buildAdminOrderVariables,
  buildLotteryWinnerVariables,
  buildSwagoMoneyDepositVariables,
} from './email-templates/build-vars';

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_EMAIL_API = MSG91_EMAIL.apiUrl;

if (!MSG91_AUTH_KEY) {
  console.warn('⚠️ MSG91_AUTH_KEY not found in environment variables');
}

export type OrderEmailData = {
  name: string;
  orderNumber: string;
  orderDate: string;
  email: string;
  items: any[];
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
  couponCode?: string;
  currencySymbol?: string;
  shippingLabel?: string;
};

interface MSG91Response {
  message?: string;
  [key: string]: unknown;
}

async function postMsg91(payload: Record<string, unknown>): Promise<{
  success: boolean;
  error?: string;
  response?: MSG91Response;
}> {
  if (!MSG91_AUTH_KEY) {
    return { success: false, error: 'MSG91_AUTH_KEY not configured' };
  }

  const response = await fetch(MSG91_EMAIL_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: MSG91_AUTH_KEY,
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as MSG91Response;

  if (response.ok) {
    return { success: true, response: result };
  }
  return {
    success: false,
    error: result.message || 'Failed to send email',
    response: result,
  };
}

function legacyHtmlPayload(
  toEmail: string,
  toName: string,
  htmlContent: string,
  extraVars: Record<string, string> = {}
) {
  return {
    recipients: [
      {
        to: [{ email: toEmail, name: toName }],
        variables: {
          ...extraVars,
          items: htmlContent,
          html_body: htmlContent,
        },
      },
    ],
    from: MSG91_EMAIL.from,
    domain: MSG91_EMAIL.domain,
    template_id: MSG91_EMAIL.templateId,
  };
}

export async function sendOrderConfirmationEmail(
  data: OrderEmailData
): Promise<{ success: boolean; error?: string; response?: MSG91Response }> {
  if (!MSG91_AUTH_KEY) {
    return { success: false, error: 'MSG91_AUTH_KEY not configured' };
  }

  try {
    const templateId = getMsg91TemplateId('order_confirmation');
    const vars = buildOrderConfirmationVariables(data);

    if (templateId) {
      console.log('📧 Sending order confirmation via MSG91 template', templateId, 'to:', data.email);
      const result = await postMsg91({
        recipients: [
          {
            to: [{ email: data.email, name: data.name }],
            variables: vars,
          },
        ],
        from: MSG91_EMAIL.from,
        domain: MSG91_EMAIL.domain,
        template_id: templateId,
      });
      if (result.success) console.log('✅ Order confirmation email sent via MSG91');
      else console.error('❌ MSG91 email failed:', result.response);
      return result;
    }

    // Legacy fallback: render React Email into html_body
    const emailElement = React.createElement(OrderConfirmationEmail, data as any);
    const htmlContent = await render(emailElement);
    console.log('📧 Sending order confirmation via legacy html_body to:', data.email);
    const result = await postMsg91(
      legacyHtmlPayload(data.email, data.name, htmlContent, {
        name: data.name,
        orderNumber: data.orderNumber,
        orderDate: data.orderDate,
        email: data.email,
        subtotal: data.subtotal,
        discount: data.discount,
        shipping: data.shipping,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        address: `${data.address}, ${data.city}, ${data.state} - ${data.pincode}`,
      })
    );
    if (result.success) console.log('✅ Custom order confirmation email sent via MSG91');
    else console.error('❌ MSG91 email failed:', result.response);
    return result;
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
    console.log('📧 Sending notification email via MSG91 to:', toEmail);
    const result = await postMsg91(legacyHtmlPayload(toEmail, toName || 'Swago Fam', htmlContent));
    if (result.success) console.log('✅ Notification email sent via MSG91');
    else console.error('❌ MSG91 notification email failed:', result.response);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ MSG91 notification email error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function sendAdminOrderNotificationEmail(
  data: AdminOrderEmailProps
): Promise<{ success: boolean; error?: string; response?: MSG91Response }> {
  if (!MSG91_AUTH_KEY) {
    return { success: false, error: 'MSG91_AUTH_KEY not configured' };
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'shipping.swago@gmail.com';

  try {
    const templateId = getMsg91TemplateId('admin_order');
    const vars = buildAdminOrderVariables({
      orderNumber: data.orderNumber,
      orderDate: data.orderDate,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      paymentMethod: data.paymentMethod,
      totalAmount: data.totalAmount,
      subtotal: data.subtotal,
      discount: data.discount,
      swagoMoneyRedeemed: data.swagoMoneyRedeemed,
      shippingFee: data.shippingFee,
      couponCode: data.couponCode,
      items: data.items,
      adminUrl: data.adminUrl,
      currencySymbol: data.currencySymbol,
      countryCode: data.countryCode,
    });

    if (templateId) {
      console.log('📧 Sending admin order via MSG91 template', templateId, 'to:', ADMIN_EMAIL);
      const result = await postMsg91({
        recipients: [
          {
            to: [{ email: ADMIN_EMAIL, name: 'Swago Admin' }],
            variables: vars,
          },
        ],
        from: MSG91_EMAIL.from,
        domain: MSG91_EMAIL.domain,
        template_id: templateId,
      });
      if (result.success) console.log('✅ Admin order notification email sent via MSG91');
      else console.error('❌ MSG91 admin email failed:', result.response);
      return result;
    }

    const emailElement = React.createElement(OrderAdminNotificationEmail, data as any);
    const htmlContent = await render(emailElement);
    console.log('📧 Sending admin order via legacy html_body to:', ADMIN_EMAIL);
    const result = await postMsg91(legacyHtmlPayload(ADMIN_EMAIL, 'Swago Admin', htmlContent));
    if (result.success) console.log('✅ Admin order notification email sent via MSG91');
    else console.error('❌ MSG91 admin email failed:', result.response);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ MSG91 Admin Email API error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/** Ready for lottery-draws route when re-enabled. Uses MSG91_TPL_LOTTERY_WINNER when set. */
export async function sendLotteryWinnerEmail(input: {
  email: string;
  name: string;
  amount: number;
  ticketCode: string;
}): Promise<{ success: boolean; error?: string; response?: MSG91Response }> {
  if (!MSG91_AUTH_KEY) {
    return { success: false, error: 'MSG91_AUTH_KEY not configured' };
  }

  const templateId = getMsg91TemplateId('lottery_winner');
  const vars = buildLotteryWinnerVariables(input);

  if (!templateId) {
    return {
      success: false,
      error: 'MSG91_TPL_LOTTERY_WINNER not configured (and lottery send is disabled)',
    };
  }

  return postMsg91({
    recipients: [
      {
        to: [{ email: input.email, name: input.name || 'Swago Fam' }],
        variables: vars,
      },
    ],
    from: MSG91_EMAIL.from,
    domain: MSG91_EMAIL.domain,
    template_id: templateId,
  });
}

/** Ready for manual-deposit route when re-enabled. Uses MSG91_TPL_SWAGO_MONEY when set. */
export async function sendSwagoMoneyDepositEmail(input: {
  email: string;
  name: string;
  amount: number;
  reason: string;
}): Promise<{ success: boolean; error?: string; response?: MSG91Response }> {
  if (!MSG91_AUTH_KEY) {
    return { success: false, error: 'MSG91_AUTH_KEY not configured' };
  }

  const templateId = getMsg91TemplateId('swago_money');
  const vars = buildSwagoMoneyDepositVariables(input);

  if (!templateId) {
    return {
      success: false,
      error: 'MSG91_TPL_SWAGO_MONEY not configured (and deposit send is disabled)',
    };
  }

  return postMsg91({
    recipients: [
      {
        to: [{ email: input.email, name: input.name || 'Swago Fam' }],
        variables: vars,
      },
    ],
    from: MSG91_EMAIL.from,
    domain: MSG91_EMAIL.domain,
    template_id: templateId,
  });
}
