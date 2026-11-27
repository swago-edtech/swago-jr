import { getInternationalOrderDisplay, type InternationalOrderLike } from "@swago/utils";

type OrderWithItems = InternationalOrderLike & {
  items?: Array<{ name?: string; quantity?: number; price?: number; localPrice?: number; image?: string }>;
};

/**
 * Overrides for the customer confirmation email. Returns {} for domestic orders, so spreading it
 * into the existing (INR) payload leaves India emails byte-identical.
 */
export function intlConfirmationEmailOverrides(order: OrderWithItems) {
  const intl = getInternationalOrderDisplay(order);
  if (!intl) return {};
  return {
    items: (order.items || []).map((item, i) => ({ ...item, price: intl.items[i]?.localPrice ?? 0 })),
    subtotal: intl.subtotalLocal.toFixed(2),
    discount: intl.discountLocal.toFixed(2),
    swagoMoneyRedeemed: intl.swagoLocal.toFixed(2),
    shipping: intl.shippingLocal.toFixed(2),
    totalAmount: intl.totalLocal.toFixed(2),
    currencySymbol: intl.symbol,
    shippingLabel: "International Shipping",
  };
}

/**
 * Overrides for the admin notification email (ledger stays INR). Returns {} for domestic orders.
 */
export function intlAdminEmailOverrides(order: OrderWithItems) {
  const intl = getInternationalOrderDisplay(order);
  if (!intl) return {};
  return {
    shippingMethod: "International Shipping",
    shippingFee: intl.shippingINR.toFixed(2),
    internationalLines: [
      `Country: ${intl.country}`,
      `Charged: ${intl.formatCode(intl.totalLocal)} (items ${intl.formatCode(intl.subtotalLocal)}, shipping ${intl.formatCode(intl.shippingLocal)})`,
      `Exchange rate used: 1 INR = ${intl.rate} ${intl.currency}`,
    ],
  };
}

type OrderAddressLike = OrderWithItems & {
  city?: string | null;
  state?: string | null;
  stateCode?: string | null;
  pincode?: string | null;
  addressFlags?: string[] | null;
};

/**
 * Charged-first summary + validated ship-to for the admin email (all orders).
 * The charged amount is in the currency the customer actually paid/pays.
 */
export function adminChargedAndShipTo(order: OrderAddressLike) {
  const intl = getInternationalOrderDisplay(order);
  const total = Number(order.total) || 0;
  const country = String(order.country || "IN").toUpperCase();
  const statePart = [order.state, order.stateCode ? `(${order.stateCode})` : ""].filter(Boolean).join(" ");
  const shipTo = [order.city, statePart, order.pincode].filter((x) => x && String(x).trim()).join(", ") + `, ${country}`;
  return {
    chargedAmount: intl ? intl.formatCode(intl.totalLocal) : `INR ${total.toFixed(2)}`,
    shipTo,
    ...(order.addressFlags && order.addressFlags.length ? { addressFlags: [...order.addressFlags] } : {}),
  };
}
