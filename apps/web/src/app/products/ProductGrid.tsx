"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { HiChevronRight } from "react-icons/hi";
import ProductCard from "@/components/ProductCard";
import { Filters } from "@/components/FilterSidebar";
import FilterDrawer from "@/components/FilterDrawer";
import { Product } from "@/context/SharedContext";

export default function ProductGrid() {
  const searchParams = useSearchParams();

  const initialFilters: Filters = {
    search: searchParams?.get("search") || "",
    age: searchParams?.get("age") || "",
    elements: searchParams?.get("elements")?.split(",").filter(Boolean) || [],
    minPrice: searchParams?.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams?.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
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
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
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

      const priceMatch =
        (filters.minPrice === undefined || product.price >= filters.minPrice) &&
        (filters.maxPrice === undefined || product.price <= filters.maxPrice);

      return searchMatch && ageMatch && elementsMatch && priceMatch;
    });
  }, [dbProducts, filters]);

  // ========================================

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("age");
  const [sortBy, setSortBy] = useState("newest");
  const totalProducts = dbProducts.length;

  // Lock scroll when filter is open
  useEffect(() => {
    if (isFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isFilterOpen]);

  // Manual Sort Logic
  const sortedAndFilteredProducts = useMemo(() => {
    const products = [...filteredProducts];
    if (sortBy === "price-low") products.sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") products.sort((a, b) => b.price - a.price);
    if (sortBy === "newest") products.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return products;
  }, [filteredProducts, sortBy]);

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setIsFilterOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 py-8 md:py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-[10px] md:text-xs text-slate-400 mb-4 px-1">
        <Link href="/" className="hover:text-black transition-colors uppercase tracking-tighter font-bold">Home</Link>
        <HiChevronRight className="w-2.5 h-2.5 opacity-30" />
        <span className="text-slate-900 font-bold uppercase tracking-tighter">Products</span>
      </nav>

      {/* Filter and Sort Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900">
          All Smart Box
        </h2>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Desktop Sort Dropdown */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-[hsl(var(--swago-purple))] uppercase group"
            >
              Sort
              <svg className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </button>
            <AnimatePresence>
              {isSortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-40 overflow-hidden"
                >
                  <div className="flex flex-col p-2 ">
                    {[
                      { id: "newest", label: "Newest Arrivals" },
                      { id: "price-low", label: "Price: Low to High" },
                      { id: "price-high", label: "Price: High to Low" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { setSortBy(opt.id); setIsSortOpen(false); }}
                        className={`w-full py-3 px-4 text-left text-xs font-bold rounded-xl transition-all ${sortBy === opt.id ? 'bg-purple-50 text-[hsl(var(--swago-purple))]' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-[hsl(var(--swago-purple))] uppercase group"
          >
            Filter
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </div>

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
        totalResults={sortedAndFilteredProducts.length}
      />

      <div className="grid grid-cols-1 gap-8">
        {/* Product Grid Area */}
        <div className="w-full">
          {loading ? (
            <p className="text-sm text-slate-500 mb-4 px-1">Loading products...</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-wider">
                  Showing {sortedAndFilteredProducts.length} smart box
                </p>
              </div>

              {sortedAndFilteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-8 md:gap-6">
                  {sortedAndFilteredProducts.map((product) => (
                    <ProductCard key={getProductKey(product)} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-400">No Smart Box Found</h3>
                  <button onClick={() => setFilters(initialFilters)} className="mt-4 text-xs font-bold text-[hsl(var(--swago-purple))] uppercase tracking-widest border-b-2 border-purple-200 hover:border-purple-600 transition-all">Clear All Filters</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
