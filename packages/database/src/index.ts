// packages/database/src/index.ts

// Import and re-export models (can't use export * with default exports)
export { default as User } from './models/User';
export { default as Order } from './models/Order';
export { default as Review } from './models/Review';
export { default as ProductCode } from './models/ProductCode';
export { default as Product } from "./models/Product";
export { default as FAQ } from './models/FAQ';
export { default as AmbassadorApplication } from './models/AmbassadorApplication';
export { default as ContactSubmission } from './models/ContactSubmission';
export { default as LotteryCode } from './models/LotteryCode';
export { default as LotteryCodeBatch } from './models/LotteryCodeBatch';
export { default as LotteryDraw } from './models/LotteryDraw';
export { default as Announcement } from './models/Announcement';
export { default as Coupon } from './models/Coupon';
export { default as OrderCounter } from './models/OrderCounter';
export { default as Banner } from './models/Banner';
export { default as Promotion } from './models/Promotion';
export { default as Quest } from './models/Quest';
export { default as PriceRange } from './models/PriceRange';
export { default as Blog } from './models/Blog';
export { default as Masterclass } from './models/Masterclass';
export { default as MasterclassBooking } from './models/MasterclassBooking';
export { default as PopupConfig } from './models/PopupConfig';
export { default as ExpressConfig } from './models/ExpressConfig';
export { default as InvoiceCounter } from './models/InvoiceCounter';
export { default as InventoryItem } from './models/InventoryItem';
export { default as ProductConfig } from './models/ProductConfig';
export { default as InventoryTransaction } from './models/InventoryTransaction';
export { default as ChannelEmailConfig } from './models/ChannelEmailConfig';
export { default as ChannelOrderEvent } from './models/ChannelOrderEvent';

// Export database connection
export { default as connectDB } from './connection';
export * from './services/inventory-sync';
export * from './services/inventory-order';
export * from './services/channel-inventory';
export * from './services/channel-email-sync';
export * from './services/google-signin';
