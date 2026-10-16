import type { Metadata } from 'next';
import ShippingContent from './ShippingContent';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | Swago ',
  description: 'Learn about our shipping options, delivery times, and policies for Swago educational smart box',
};

export default function ShippingPage() {
  return <ShippingContent />;
}
