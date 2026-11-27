/**
 * MSG91 delivery envelope used by every transactional email.
 * Prefer per-template ids from env; fall back to the legacy wrapper that injects html_body.
 */
export const MSG91_EMAIL = {
  apiUrl: "https://control.msg91.com/api/v5/email/send",
  /** Legacy wrapper used when a dedicated template id is not configured. */
  templateId: "swagojr_order_confirmation2",
  domain: "support.swagojr.com",
  from: {
    email: "no-reply@support.swagojr.com",
    name: "Swago",
  },
} as const;

export type Msg91TemplateKind =
  | "order_confirmation"
  | "admin_order"
  | "low_stock"
  | "lottery_winner"
  | "swago_money";

const ENV_KEYS: Record<Msg91TemplateKind, string> = {
  order_confirmation: "MSG91_TPL_ORDER_CONFIRMATION",
  admin_order: "MSG91_TPL_ADMIN_ORDER",
  low_stock: "MSG91_TPL_LOW_STOCK",
  lottery_winner: "MSG91_TPL_LOTTERY_WINNER",
  swago_money: "MSG91_TPL_SWAGO_MONEY",
};

/** Returns the dedicated MSG91 template id when set, otherwise null (use legacy html_body path). */
export function getMsg91TemplateId(kind: Msg91TemplateKind): string | null {
  const key = ENV_KEYS[kind];
  const value = process.env[key]?.trim();
  return value || null;
}
