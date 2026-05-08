import { Suspense } from 'react';
import ProductGrid from './ProductGrid';

export const revalidate = 0;

// A simple loading component to show while the client component loads
function Loading() {
  return <p className="text-center p-8">Loading products...</p>;
}

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
     

      <Suspense fallback={<Loading />}>
        <ProductGrid />
      </Suspense>
    </div>
  );
}