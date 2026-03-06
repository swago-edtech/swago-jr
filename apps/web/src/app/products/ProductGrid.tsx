"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HiChevronRight } from "react-icons/hi";
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


  // Filter database products only
  const filteredProducts = useMemo(() => {
    return dbProducts.filter(product => {
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
  }, [dbProducts, filters]);

  // ========================================

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const totalProducts = dbProducts.length;

  // Manual Sort Logic
  const sortedAndFilteredProducts = useMemo(() => {
    const products = [...filteredProducts];
    if (sortBy === "price-low") products.sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") products.sort((a, b) => b.price - a.price);
    if (sortBy === "newest") products.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return products;
  }, [filteredProducts, sortBy]);

  return (
    <div className="flex flex-col gap-4 py-8 md:py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-[10px] md:text-xs text-slate-400 mb-4 px-1">
        <Link href="/" className="hover:text-black transition-colors uppercase tracking-tighter font-bold">Home</Link>
        <HiChevronRight className="w-2.5 h-2.5 opacity-30" />
        <span className="text-slate-900 font-bold uppercase tracking-tighter">Products</span>
      </nav>

      {/* Mobile Filter & Sort Bar */}
      <div className="md:hidden grid grid-cols-2 border-y border-slate-200 bg-white mb-2">
        <button
          onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
          className={`flex items-center justify-center gap-2.5 py-4 text-[11px] font-black tracking-[0.15em] transition-colors ${isFilterOpen ? 'text-[hsl(var(--swago-purple))]' : 'text-slate-800'}`}
        >
          FILTER
          <svg className={`w-3.5 h-3.5 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
        <button
          onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
          className={`flex items-center justify-center gap-2.5 py-4 text-[11px] font-black tracking-[0.15em] border-l border-slate-200 transition-colors ${isSortOpen ? 'text-[hsl(var(--swago-purple))]' : 'text-slate-800'}`}
        >
          SORT
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
        </button>
      </div>

      {/* Mobile Dropdowns */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-white border-b border-slate-200"
          >
            <div className="p-4 bg-slate-50 border-x border-slate-200">
              <FilterSidebar filters={filters} onFilterChange={(f) => { setFilters(f); }} />
            </div>
          </motion.div>
        )}

        {isSortOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-white border-b border-slate-200"
          >
            <div className="flex flex-col divide-y divide-slate-100">
              {[
                { id: "newest", label: "Newest Arrivals" },
                { id: "price-low", label: "Price: Low to High" },
                { id: "price-high", label: "Price: High to Low" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setSortBy(opt.id); setIsSortOpen(false); }}
                  className={`w-full py-4 px-6 text-left text-sm font-medium transition-colors ${sortBy === opt.id ? 'text-[hsl(var(--swago-purple))] bg-purple-50' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden md:block md:col-span-1">
          <FilterSidebar filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Product Grid Area */}
        <div className="md:col-span-3">
          {loading ? (
            <p className="text-sm text-slate-500 mb-4">Loading products...</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-xs md:text-sm text-slate-500">
                  Showing {sortedAndFilteredProducts.length} of {totalProducts} kits
                </p>
              </div>

              {sortedAndFilteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-12 md:gap-6">
                  {sortedAndFilteredProducts.map((product) => (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
