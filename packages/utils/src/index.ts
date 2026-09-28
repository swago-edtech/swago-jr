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

// Date utilities
export * from './date';

// Sentiment analysis
export { analyzeReviewSentiment } from './sentiment';

// International shipping resolution
export * from "./international-shipping";

// International order display helpers
export * from "./international-order";
