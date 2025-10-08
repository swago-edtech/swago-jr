import Link from 'next/link';
import { products } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

export default function FeaturedProducts() {
  // Take only the first 3 products from your data
  const featured = products.slice(0, 3);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-4 uppercase">
          Our Most <span className="text-[hsl(var(--swago-purple))]">Popular</span> Kits
        </h2>
        <p className="text-slate-600 mb-12 max-w-2xl mx-auto">
          A glimpse of our top-selling kits, loved by parents and kids for their fun and educational value.
        </p>
        
        {/* Re-use the ProductCard component in a grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* The "Show More" button that links to all products */}
        <Link 
          href="/products" 
          className="btn-shine inline-block bg-[hsl(var(--swago-pink))] text-white font-bold px-8 py-3 rounded-full shadow-lg"
        >
          Show More Kits
        </Link>
      </div>
    </section>
  );
}