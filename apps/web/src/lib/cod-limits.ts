/** Max total product units allowed for Cash on Delivery. */
export const COD_MAX_UNITS = 5;

export const SWAGO_CONTACT = {
  phoneDisplay: "+91 6283883397",
  phoneTel: "+916283883397",
  whatsappUrl: "https://wa.me/916283883397",
  email: "support@swagojr.com",
} as const;

export function cartUnitCount(items: Array<{ quantity?: number }> | null | undefined): number {
  if (!items?.length) return 0;
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

export function isCodOverUnitLimit(items: Array<{ quantity?: number }> | null | undefined): boolean {
  return cartUnitCount(items) > COD_MAX_UNITS;
}

export const COD_UNIT_LIMIT_MESSAGE =
  `COD is available for up to ${COD_MAX_UNITS} boxes. For larger orders, contact us.`;
