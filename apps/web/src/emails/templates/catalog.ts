import * as React from "react";
import OrderConfirmation from "./OrderConfirmation";
import OrderAdminNotification from "./OrderAdminNotification";
import LowStockAlert from "./LowStockAlert";
import LotteryWinner from "./LotteryWinner";
import SwagoMoneyDeposit from "./SwagoMoneyDeposit";
import { MSG91_EMAIL, getMsg91TemplateId } from "./msg91";
import {
  orderConfirmationPreview,
  orderConfirmationCodPreview,
  orderConfirmationIntlPreview,
  orderAdminPreview,
  orderAdminIntlPreview,
  lowStockPreview,
  lotteryWinnerPreview,
  swagoMoneyDepositPreview,
} from "./preview-data";

export type EmailTemplateEntry = {
  slug: string;
  title: string;
  status: "active" | "disabled" | "manual";
  purpose: string;
  msg91TemplateId: string;
  element: React.ReactElement;
};

function tpl(
  kind: Parameters<typeof getMsg91TemplateId>[0]
): string {
  return getMsg91TemplateId(kind) || MSG91_EMAIL.templateId;
}

/**
 * Single registry of every outbound email template used (or formerly used) by Swago.
 * Preview UI and react-email both read from here.
 * Dedicated MSG91 HTML lives in /templates/msg91/ — paste those when creating MSG91 templates.
 */
export const EMAIL_TEMPLATES: EmailTemplateEntry[] = [
  {
    slug: "order-confirmation",
    title: "Order confirmation (prepaid)",
    status: "active",
    purpose: "Customer receipt after Razorpay / paid order finalize",
    msg91TemplateId: tpl("order_confirmation"),
    element: React.createElement(OrderConfirmation, orderConfirmationPreview),
  },
  {
    slug: "order-confirmation-cod",
    title: "Order confirmation (COD)",
    status: "active",
    purpose: "Customer receipt for Cash on Delivery orders",
    msg91TemplateId: tpl("order_confirmation"),
    element: React.createElement(OrderConfirmation, orderConfirmationCodPreview),
  },
  {
    slug: "order-confirmation-intl",
    title: "Order confirmation (international)",
    status: "active",
    purpose: "Customer receipt with local currency + international shipping label (no FX rate)",
    msg91TemplateId: tpl("order_confirmation"),
    element: React.createElement(OrderConfirmation, orderConfirmationIntlPreview),
  },
  {
    slug: "order-admin-notification",
    title: "Admin new-order alert",
    status: "active",
    purpose: "Ops alert when a website order is placed",
    msg91TemplateId: tpl("admin_order"),
    element: React.createElement(OrderAdminNotification, orderAdminPreview),
  },
  {
    slug: "order-admin-notification-intl",
    title: "Admin new-order alert (international)",
    status: "active",
    purpose: "Ops alert with local charged amounts + country code (no FX rate)",
    msg91TemplateId: tpl("admin_order"),
    element: React.createElement(OrderAdminNotification, orderAdminIntlPreview),
  },
  {
    slug: "low-stock-alert",
    title: "Low stock alert",
    status: "active",
    purpose: "Admin inventory below-threshold consolidated alert",
    msg91TemplateId: tpl("low_stock"),
    element: React.createElement(LowStockAlert, lowStockPreview),
  },
  {
    slug: "lottery-winner",
    title: "Lottery winner",
    status: "disabled",
    purpose: "Notify lottery winner of Swago Money credit (currently commented out)",
    msg91TemplateId: tpl("lottery_winner"),
    element: React.createElement(LotteryWinner, lotteryWinnerPreview),
  },
  {
    slug: "swago-money-deposit",
    title: "Swago Money deposit",
    status: "disabled",
    purpose: "Notify user of manual Swago Money credit (currently commented out)",
    msg91TemplateId: tpl("swago_money"),
    element: React.createElement(SwagoMoneyDeposit, swagoMoneyDepositPreview),
  },
];

export function getEmailTemplate(slug: string): EmailTemplateEntry | undefined {
  return EMAIL_TEMPLATES.find((t) => t.slug === slug);
}

export { MSG91_EMAIL };
