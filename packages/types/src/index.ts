// Main Product interface (matches database)
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  ageCategory: "5-7" | "8-10" | "11-13";
  coreElements: Array<"S" | "W" | "A" | "G" | "O">;
  boxContents: string;
  benefits: string;
  stock: number;
  lowStockThreshold: number;
  totalSold: number;
  isActive: boolean;
  isFeatured: boolean;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

// For admin create/update forms
export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  ageCategory: "5-7" | "8-10" | "11-13";
  coreElements: Array<"S" | "W" | "A" | "G" | "O">;
  boxContents: string;
  benefits: string;
  stock: number;
  lowStockThreshold?: number;
  isFeatured?: boolean;
  isActive?: boolean;
}

// For public-facing product displays (customer side)
export interface PublicProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  ageCategory: string;
  coreElements: string[];
  boxContents: string;
  benefits: string;
  stock: number; // Customer needs to see stock
  slug: string;
}

// For product list filters (admin & frontend)
export interface ProductFilters {
  search?: string;
  ageCategory?: string;
  coreElements?: string[];
  stockStatus?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  isActive?: boolean;
  isFeatured?: boolean;
}



// User Types  
export interface User {
  _id: string;
  phone: string;
  name?: string;
  email?: string;
  orders: string[];
  wishlist: string[];
  createdAt: Date;
}

// Order Types
export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  shippingAddress: Address;
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

// ✅ NEW: Review Types
export interface Review {
  _id: string;
  productId: number;
  userId: string;
  orderId: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
  helpfulCount: number;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// For populated review responses (with user info)
export interface PopulatedReview extends Omit<Review, 'userId'> {
  user: {
    name?: string;
    phone: string;
  };
}

// For review summary stats
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}


// ✅ NEW: Razorpay Webhook Types
export interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  email?: string;
  contact?: string;
  error_code?: string;
  error_description?: string;
  error_reason?: string;
  notes?: {
    phone?: string;
    email?: string;
    name?: string;
    age?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    items?: string;
    subtotal?: string;
    discount?: string;
    couponDetails?: string;
  };
}

export interface RazorpayWebhookPayload {
  payment: {
    entity: RazorpayPaymentEntity;
  };
}

export interface RazorpayWebhookEvent {
  event: 'payment.captured' | 'payment.failed' | string;
  payload: RazorpayWebhookPayload;
}




// MSG91 Widget Types
export interface MSG91WidgetConfig {
  widgetId: string;
  tokenAuth: string;
  identifier?: string;
  exposeMethods: boolean;
  captchaRenderId?: string;
  success?: (data: MSG91WidgetSuccessData) => void;
  failure?: (error: MSG91WidgetError) => void;
}

export interface MSG91WidgetSuccessData {
  message: string;
  token?: string; // JWT access token after OTP verification
  [key: string]: any;
}

export interface MSG91WidgetError {
  message: string;
  code?: string;
  [key: string]: any;
}

// Global window extensions for MSG91 widget methods
declare global {
  interface Window {
    sendOtp?: (
      identifier: string,
      onSuccess?: (data: MSG91WidgetSuccessData) => void,
      onError?: (error: MSG91WidgetError) => void
    ) => void;
    verifyOtp?: (
      otp: string,
      onSuccess?: (data: MSG91WidgetSuccessData) => void,
      onError?: (error: MSG91WidgetError) => void
    ) => void;
    retryOtp?: (
      channel: string | null,
      onSuccess?: (data: MSG91WidgetSuccessData) => void,
      onError?: (error: MSG91WidgetError) => void,
      reqId?: string
    ) => void;
    getWidgetData?: () => any;
    isCaptchaVerified?: () => boolean;
    initSendOTP?: (config: MSG91WidgetConfig) => void;
  }
}

export {};
