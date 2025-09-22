import Link from "next/link";
import { products } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export default function Home() {
  // Get the first 3 products to feature on the home page
  const featuredProducts = products.slice(0, 3);

  return (
    <div className="text-center mt-10">
      <h1 className="text-3xl font-bold">Welcome to Swago Junior</h1>
      <p className="mt-4 text-lg">Explore fun learning kits for kids</p>

      {/* Featured Products Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-left">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Show More Button */}
      <div className="mt-10">
        <Link href="/products" className="bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
          Show More Products
        </Link>
      </div>
    </div>
  );
}