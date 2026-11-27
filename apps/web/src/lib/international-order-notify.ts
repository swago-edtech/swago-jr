import { getInternationalOrderDisplay, type InternationalOrderLike } from "@swago/utils";

type OrderItemLike = {
  name?: string;
  quantity?: number | null;
  price?: number | null;
  localPrice?: number | null;
  image?: string;
};

type OrderWithItems = Omit<InternationalOrderLike, "items"> & {
  items?: OrderItemLike[] | null;
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
 * Overrides for the admin notification email.
 * International: charged local amounts + currency symbol; country code only (no FX rate).
 * Returns {} for domestic orders.
 */
export function intlAdminEmailOverrides(order: OrderWithItems) {
  const intl = getInternationalOrderDisplay(order);
  if (!intl) return {};
  return {
    shippingMethod: "International Shipping",
    shippingFee: intl.shippingLocal.toFixed(2),
    subtotal: intl.subtotalLocal.toFixed(2),
    discount: intl.discountLocal.toFixed(2),
    swagoMoneyRedeemed: intl.swagoLocal.toFixed(2),
    totalAmount: intl.totalLocal.toFixed(2),
    currencySymbol: intl.symbol,
    countryCode: intl.country,
    items: (order.items || []).map((item, i) => ({
      name: item.name || "Item",
      quantity: item.quantity || 0,
      price: (intl.items[i]?.localPrice ?? 0).toFixed(2),
      image: item.image,
    })),
  };
}
