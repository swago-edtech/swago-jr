// Product Types
export interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  images: string[];
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
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