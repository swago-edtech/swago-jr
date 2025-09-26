"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation"; // 1. Import useSearchParams
import { products } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import FilterSidebar, { Filters } from "@/components/FilterSidebar";

export default function ProductsPage() {
  const searchParams = useSearchParams(); // 2. Get the search params object

  // 3. Set the initial state of the filters based on the URL
  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get("search") || "",
    age: searchParams.get("age") || "",
    elements: searchParams.get("elements")?.split(",") || [],
  });

  // This effect will update filters if the user navigates between filtered links
  useEffect(() => {
    setFilters({
      search: searchParams.get("search") || "",
      age: searchParams.get("age") || "",
      elements: searchParams.get("elements")?.split(",") || [],
    });
  }, [searchParams]);


  const filteredProducts = useMemo(() => {
    // ... filtering logic remains the same
    return products.filter(product => {
      const searchMatch = product.name.toLowerCase().includes(filters.search.toLowerCase());
      const ageMatch = filters.age ? product.age_category === filters.age : true;
      const elementsMatch = filters.elements.length > 0
        ? filters.elements.every(element => product.core_elements.includes(element))
        : true;
      return searchMatch && ageMatch && elementsMatch;
    });
  }, [filters]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page content remains the same... */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold">Kits by Age</h1>
        <p className="text-slate-600 mt-2">
          Filter kits by age group and the Swago Core elements you want to focus on.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <FilterSidebar filters={filters} onFilterChange={setFilters} />
        </div>
        <div className="md:col-span-3">
          <p className="text-sm text-slate-500 mb-4">
            Showing {filteredProducts.length} of {products.length} kits
          </p>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold">No Kits Found</h3>
              <p className="text-slate-500 mt-2">Try adjusting your filters to find what you're looking for.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}