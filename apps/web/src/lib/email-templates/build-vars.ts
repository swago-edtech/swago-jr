/**
 * Builds MSG91 template variables for the HTML templates under /templates/msg91/.
 * Repeating / optional blocks are pre-rendered HTML strings (MSG91 has no loops).
 */

export function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatAmount(value: string | number): string {
  const n = Number(value) || 0;
  return n.toFixed(2);
}

function money(symbol: string, value: string | number): string {
  return `${symbol}${formatAmount(value)}`;
}

export type OrderItemForEmail = {
  name?: string;
  quantity?: number;
  price?: number | string;
  image?: string;
};

export type OrderConfirmationVarsInput = {
  name: string;
  orderNumber: string;
  orderDate: string;
  items: OrderItemForEmail[];
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

export function buildCustomerItemRows(
  items: OrderItemForEmail[],
  currencySymbol: string
): string {
  if (!items?.length) {
    return `<p style="margin:0;font-size:13px;color:#696e79;">Your order items could not be displayed.</p>`;
  }

  return items
    .map((item, index) => {
      const qty = Number(item.quantity) || 0;
      const unit = Number(item.price) || 0;
      const lineTotal = money(currencySymbol, unit * qty);
      const isLast = index === items.length - 1;
      const border = isLast ? "" : "border-bottom:1px solid #f5f5f7;padding-bottom:12px;margin-bottom:12px;";
      const img = item.image
        ? `<img src="${escapeHtml(item.image)}" width="56" height="56" alt="${escapeHtml(item.name || "")}" style="display:block;width:56px;height:56px;object-fit:cover;" />`
        : "";
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${border}">
  <tr>
    <td width="64" valign="top" style="padding-right:12px;">
      <div style="width:56px;height:56px;border:1px solid #e5e7eb;border-radius:4px;background:#fafafa;overflow:hidden;">${img}</div>
    </td>
    <td valign="top">
      <div style="font-size:14px;font-weight:700;color:#282c3f;">${escapeHtml(item.name || "Item")}</div>
      <div style="font-size:12px;color:#696e79;margin-top:2px;">Qty <strong style="color:#1f2937;">${qty}</strong></div>
      <div style="font-size:12px;color:#03a685;margin-top:2px;">Dispatched from Swago Studio</div>
    </td>
    <td width="90" align="right" valign="top" style="font-size:14px;font-weight:700;color:#282c3f;">${lineTotal}</td>
  </tr>
</table>`;
    })
    .join("\n");
}

export function buildAdminItemRows(
  items: Array<OrderItemForEmail & { price: string | number }>,
  currencySymbol: string
): string {
  if (!items?.length) return "";

  return items
    .map((item, index) => {
      const qty = Number(item.quantity) || 0;
      const unit = Number(item.price) || 0;
      // Admin payload stores unit price (matches mock + previous admin email).
      const unitDisplay = money(currencySymbol, unit);
      const border =
        index === items.length - 1
          ? "padding:12px 0 0;"
          : "border-bottom:1px solid #f1f5f9;padding:12px 0;";
      const img = item.image
        ? `<img src="${escapeHtml(item.image)}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;object-fit:cover;" />`
        : "";
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${border}">
  <tr>
    <td width="64" valign="middle" style="padding-right:12px;">
      <div style="width:56px;height:56px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;overflow:hidden;">${img}</div>
    </td>
    <td valign="middle">
      <div style="font-size:14px;font-weight:600;color:#0f172a;">${escapeHtml(item.name || "Item")}</div>
      <div style="font-size:12px;color:#64748b;margin-top:2px;">Qty: <strong style="color:#0f172a;">${qty}</strong></div>
    </td>
    <td width="90" align="right" valign="middle" style="font-size:14px;font-weight:700;color:#0f172a;">${unitDisplay}</td>
  </tr>
</table>`;
    })
    .join("\n");
}

export function buildOrderConfirmationVariables(
  data: OrderConfirmationVarsInput
): Record<string, string> {
  const symbol = data.currencySymbol || "₹";
  const discount = Number(data.discount) || 0;
  const swago = Number(data.swagoMoneyRedeemed) || 0;
  const shipping = Number(data.shipping) || 0;
  const subtotal = Number(data.subtotal) || 0;
  const isCOD =
    data.paymentMethod?.toLowerCase().includes("cod") ||
    data.paymentMethod?.toLowerCase().includes("cash");

  const couponLabel = data.couponCode
    ? `Discount (${escapeHtml(data.couponCode)})`
    : "Discount";

  const discountRow =
    discount > 0
      ? `<tr>
  <td style="padding:4px 0;color:#535766;">${couponLabel}</td>
  <td align="right" style="padding:4px 0;color:#03a685;font-weight:600;">- ${money(symbol, discount)}</td>
</tr>`
      : "";

  const discountedPriceRow =
    discount > 0
      ? `<tr>
  <td style="padding:4px 0;color:#535766;">Discounted Price</td>
  <td align="right" style="padding:4px 0;color:#282c3f;font-weight:500;">${money(symbol, Math.max(0, subtotal - discount))}</td>
</tr>`
      : "";

  const swagoRow =
    swago > 0
      ? `<tr>
  <td style="padding:4px 0;color:#535766;">Swago Money Redeemed</td>
  <td align="right" style="padding:4px 0;color:#03a685;font-weight:600;">- ${money(symbol, swago)}</td>
</tr>`
      : "";

  const totalSaved = discount + swago;
  const youSavedLine =
    totalSaved > 0
      ? `<p style="margin:0 0 10px;font-size:12px;color:#535766;">You saved <strong style="color:#03a685;">${money(symbol, totalSaved)}</strong> on this order.</p>`
      : "";

  const shippingDisplay =
    shipping === 0 ? "Free" : money(symbol, shipping);

  const statusLower = (data.paymentStatus || "").toLowerCase();
  const isPaid =
    statusLower === "successful" || statusLower === "paid";
  const paymentStatusBadge = isPaid
    ? `<div style="display:inline-block;font-size:12px;font-weight:600;color:#03a685;background:#e6f7f3;padding:4px 8px;border-radius:4px;">${escapeHtml(data.paymentStatus)}</div>`
    : `<div style="display:inline-block;font-size:12px;font-weight:600;color:#b45309;background:#fffbeb;padding:4px 8px;border-radius:4px;">${escapeHtml(data.paymentStatus)}</div>`;

  return {
    customer_name: data.name,
    order_number: data.orderNumber,
    order_date: data.orderDate,
    payment_status: data.paymentStatus,
    payment_status_badge: paymentStatusBadge,
    payment_method: data.paymentMethod,
    item_count: String(data.items?.length || 0),
    items_html: buildCustomerItemRows(data.items || [], symbol),
    currency_symbol: symbol,
    subtotal: formatAmount(subtotal),
    discount_row: discountRow,
    discounted_price_row: discountedPriceRow,
    shipping_label: data.shippingLabel || "Shipping Fee",
    shipping_display: shippingDisplay,
    swago_money_row: swagoRow,
    total_amount: formatAmount(data.totalAmount),
    amount_label: isCOD ? "Amount to Pay on Delivery" : "Net Paid",
    you_saved_line: youSavedLine,
    address_block: `<strong style="color:#282c3f;">${escapeHtml(data.name)}</strong><br />${escapeHtml(data.address)}<br />${escapeHtml(data.city)}, ${escapeHtml(data.state)} - ${escapeHtml(data.pincode)}`,
  };
}

export type AdminOrderVarsInput = {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: string;
  totalAmount: string;
  subtotal: string;
  discount: string;
  swagoMoneyRedeemed: string;
  shippingFee: string;
  couponCode?: string;
  items: Array<{ name: string; quantity: number; price: string; image?: string }>;
  adminUrl: string;
  currencySymbol?: string;
  countryCode?: string;
};

export function buildAdminOrderVariables(
  data: AdminOrderVarsInput
): Record<string, string> {
  const symbol = data.currencySymbol || "₹";
  const discount = Number(data.discount) || 0;
  const swago = Number(data.swagoMoneyRedeemed) || 0;
  const shipping = Number(data.shippingFee) || 0;

  const couponLabel = data.couponCode
    ? `Discount (${escapeHtml(data.couponCode)})`
    : "Discount";

  const discountRow =
    discount > 0
      ? `<tr>
  <td style="padding:4px 8px;color:#059669;">${couponLabel}</td>
  <td align="right" style="padding:4px 8px;font-weight:500;color:#059669;">- ${money(symbol, discount)}</td>
</tr>`
      : "";

  const swagoRow =
    swago > 0
      ? `<tr>
  <td style="padding:4px 8px;color:#059669;">Swago Money Redeemed</td>
  <td align="right" style="padding:4px 8px;font-weight:500;color:#059669;">- ${money(symbol, swago)}</td>
</tr>`
      : "";

  const countryLine = data.countryCode
    ? `<tr>
  <td style="padding:4px 0;color:#64748b;font-size:12px;">Country</td>
  <td align="right" style="padding:4px 0;font-weight:600;color:#0f172a;">${escapeHtml(data.countryCode)}</td>
</tr>`
    : "";

  // Admin historically stores unit price in `price`; multiply by qty for display.
  const itemsForRows = (data.items || []).map((item) => ({
    ...item,
    price: item.price,
  }));

  return {
    admin_url: data.adminUrl,
    customer_name: data.customerName,
    customer_email: data.customerEmail,
    customer_phone: data.customerPhone || "N/A",
    item_count: String(data.items?.length || 0),
    items_html: buildAdminItemRows(itemsForRows, symbol),
    order_number: data.orderNumber,
    order_date: data.orderDate,
    payment_method: data.paymentMethod,
    country_line: countryLine,
    currency_symbol: symbol,
    subtotal: formatAmount(data.subtotal),
    discount_row: discountRow,
    swago_money_row: swagoRow,
    shipping_display: shipping === 0 ? "Free" : money(symbol, shipping),
    total_amount: formatAmount(data.totalAmount),
  };
}

export type LowStockItem = {
  name: string;
  sku?: string;
  currentStock: number;
  lowStockThreshold: number;
  unit?: string;
};

export function buildLowStockVariables(items: LowStockItem[]): Record<string, string> {
  const rows = items
    .map((item) => {
      const out = Number(item.currentStock) <= 0;
      const stockBadge = out
        ? `<span style="display:inline-block;background:#dc2626;color:#ffffff;font-size:12px;font-weight:700;padding:2px 10px;border-radius:999px;">0 · Out of stock</span>`
        : `<span style="display:inline-block;background:#fee2e2;color:#b91c1c;font-size:12px;font-weight:700;padding:2px 10px;border-radius:999px;border:1px solid #fecaca;">${item.currentStock}</span>`;
      return `<tr>
  <td style="padding:12px;font-size:13px;font-weight:600;color:#111827;border-top:1px solid #f3f4f6;">${escapeHtml(item.name)}</td>
  <td style="padding:12px;font-size:12px;font-family:ui-monospace,monospace;color:#4b5563;border-top:1px solid #f3f4f6;">${escapeHtml(item.sku || "—")}</td>
  <td align="center" style="padding:12px;border-top:1px solid #f3f4f6;">${stockBadge}</td>
  <td align="center" style="padding:12px;font-size:13px;color:#4b5563;border-top:1px solid #f3f4f6;">${item.lowStockThreshold}</td>
  <td align="right" style="padding:12px;font-size:13px;color:#6b7280;border-top:1px solid #f3f4f6;">${escapeHtml(item.unit || "pcs")}</td>
</tr>`;
    })
    .join("\n");

  return {
    item_count: String(items.length),
    stock_rows_html: rows,
  };
}

export function buildLotteryWinnerVariables(input: {
  name: string;
  amount: number | string;
  ticketCode: string;
}): Record<string, string> {
  return {
    customer_name: input.name || "Swago Fam",
    prize_amount: String(input.amount),
    ticket_code: input.ticketCode,
  };
}

export function buildSwagoMoneyDepositVariables(input: {
  name: string;
  amount: number | string;
  reason: string;
}): Record<string, string> {
  return {
    customer_name: input.name || "Swago Fam",
    deposit_amount: String(input.amount),
    deposit_reason: input.reason,
  };
}
