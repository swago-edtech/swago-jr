import { Suspense } from 'react';
import ProductGrid from './ProductGrid';

// A simple loading component to show while the client component loads
function Loading() {
  return <p className="text-center p-8">Loading products...</p>;
}

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold">Kits by Age</h1>
        <p className="text-slate-600 mt-2">
          Filter kits by age group and the Swago Core elements you want to focus on.
        </p>
      </div>

      <Suspense fallback={<Loading />}>
        <ProductGrid />
      </Suspense>
    </div>
  );
}