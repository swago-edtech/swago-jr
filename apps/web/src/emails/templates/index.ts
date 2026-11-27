export { default as OrderConfirmation } from "./OrderConfirmation";
export type {
  OrderConfirmationEmailProps,
  OrderItem,
} from "./OrderConfirmation";

export { default as OrderAdminNotification } from "./OrderAdminNotification";
export type {
  AdminOrderEmailProps,
  AdminOrderItem,
} from "./OrderAdminNotification";

export { default as LowStockAlert } from "./LowStockAlert";
export type { LowStockAlertProps, LowStockItem } from "./LowStockAlert";

export { default as LotteryWinner } from "./LotteryWinner";
export type { LotteryWinnerProps } from "./LotteryWinner";

export { default as SwagoMoneyDeposit } from "./SwagoMoneyDeposit";
export type { SwagoMoneyDepositProps } from "./SwagoMoneyDeposit";

export { MSG91_EMAIL } from "./msg91";
export { EMAIL_TEMPLATES, getEmailTemplate } from "./catalog";
