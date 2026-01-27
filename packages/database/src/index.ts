// packages/database/src/index.ts

// Import and re-export models (can't use export * with default exports)
export { default as User } from './models/User';
export { default as Order } from './models/Order';
export { default as Review } from './models/Review';
export { default as KidProfile } from './models/KidProfile';
export { default as ProductCode } from './models/ProductCode';
export { default as Product } from "./models/Product";
export { default as FAQ } from './models/FAQ';
export { default as AmbassadorApplication } from './models/AmbassadorApplication';
export { default as ContactSubmission } from './models/ContactSubmission';
export { default as LotteryCode } from './models/LotteryCode';
export { default as LotteryCodeBatch } from './models/LotteryCodeBatch';
export { default as LotteryDraw } from './models/LotteryDraw';
export { default as Announcement } from './models/Announcement';
export { default as OrderCounter } from './models/OrderCounter'; // ✅ NEW: For order ID generation

// Export database connection
export { default as connectDB } from './connection';
