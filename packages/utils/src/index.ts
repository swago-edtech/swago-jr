// Basic utility functions only
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(price);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-IN').format(date);
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Date utilities
export * from './date';

// Sentiment analysis
export { analyzeReviewSentiment } from './sentiment';

// International shipping resolution
export * from "./international-shipping";

// International order display helpers
export * from "./international-order";

// Shipping eligibility (browse-only vs orderable geos)
export * from "./shipping-eligibility";

// YouTube helpers
export * from './youtube';

// How-to-play page helpers
export * from './how-to-play';
