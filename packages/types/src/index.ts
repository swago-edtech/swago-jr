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

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}