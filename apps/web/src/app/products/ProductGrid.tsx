"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
// ========================================
// 🔴 TEMPORARY: Remove this import after full migration
import { products as hardcodedProducts } from "@swago/utils";
// ========================================
import ProductCard from "@/components/ProductCard";
import FilterSidebar, { Filters } from "@/components/FilterSidebar";
import { Product } from "@/context/SharedContext";

export default function ProductGrid() {
  const searchParams = useSearchParams();
  
  // Initial filters from URL
  const initialFilters: Filters = {
    search: searchParams?.get("search") || "",
    age: searchParams?.get("age") || "",
    elements: searchParams?.get("elements")?.split(",").filter(Boolean) || [],
  };

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // ========================================
  // ✅ KEEP: Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        const data = await res.json();

        if (data.success) {
          setDbProducts(data.products);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);
  // ========================================

  // Sync filters when URL changes
  useEffect(() => {
    if (!searchParams) return;
    
    setFilters({
      search: searchParams.get("search") || "",
      age: searchParams.get("age") || "",
      elements: searchParams.get("elements")?.split(",").filter(Boolean) || [],
    });
  }, [searchParams]);

// ========================================
// ✅ Helper functions for accessing product properties
type ProductLike = Product | {
  id?: number;
  _id?: string;
  ageCategory?: string;
  age_category?: string;
  coreElements?: string[];
  core_elements?: string[];
  name: string;
  [key: string]: unknown;
};

const getAgeCategory = (product: ProductLike): string => {
  return ('ageCategory' in product ? product.ageCategory : product.age_category) || '';
};

const getCoreElements = (product: ProductLike): string[] => {
  return ('coreElements' in product ? product.coreElements : product.core_elements) || [];
};

const getProductKey = (product: ProductLike): string => {
  return product._id || product.id?.toString() || Math.random().toString();
};
// ========================================


  // ========================================
  // 🔴 TEMPORARY: Merge and filter both hardcoded + DB products
  // After migration, replace with filtering only dbProducts:
  /*
  const filteredProducts = useMemo(() => {
    return dbProducts.filter(product => {
      const searchMatch = product.name.toLowerCase().includes(filters.search.toLowerCase());
      const ageMatch = filters.age ? product.ageCategory === filters.age : true;
      const elementsMatch = filters.elements.length > 0
        ? filters.elements.every(element => product.coreElements.includes(element))
        : true;
      return searchMatch && ageMatch && elementsMatch;
    });
  }, [dbProducts, filters]);
  */
  const filteredProducts = useMemo(() => {
    // Combine hardcoded and DB products
    const allProducts = [...hardcodedProducts, ...dbProducts];

    return allProducts.filter(product => {
      const searchMatch = product.name.toLowerCase().includes(filters.search.toLowerCase());
      
      // Support both field naming conventions (old snake_case + new camelCase)
      const ageCategory = getAgeCategory(product);
      const ageMatch = filters.age ? ageCategory === filters.age : true;
      
      const coreElements = getCoreElements(product);
      const elementsMatch = filters.elements.length > 0
        ? filters.elements.every(element => coreElements.includes(element))
        : true;
        
      return searchMatch && ageMatch && elementsMatch;
    });
  },[dbProducts, filters, getAgeCategory, getCoreElements]); //}, [dbProducts, filters]);

  // ========================================

  // ========================================
  // 🔴 TEMPORARY: Total count includes hardcoded products
  // After migration, replace with: const totalProducts = dbProducts.length;
  const totalProducts = hardcodedProducts.length + dbProducts.length;
  // ========================================

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="md:col-span-1">
        <FilterSidebar filters={filters} onFilterChange={setFilters} />
      </div>
      
      <div className="md:col-span-3">
        {loading ? (
          <p className="text-sm text-slate-500 mb-4">Loading products...</p>
        ) : (
          <p className="text-sm text-slate-500 mb-4">
            Showing {filteredProducts.length} of {totalProducts} kits
          </p>
        )}
        
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={getProductKey(product)} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold">No Kits Found</h3>
            <p className="text-slate-500 mt-2">
              Try adjusting your filters to find what you&apos;re looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
