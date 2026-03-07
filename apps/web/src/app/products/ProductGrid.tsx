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

  return (
    <div className="flex flex-col gap-4 py-8 md:py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-[10px] md:text-xs text-slate-400 mb-4 px-1">
        <Link href="/" className="hover:text-black transition-colors uppercase tracking-tighter font-bold">Home</Link>
        <HiChevronRight className="w-2.5 h-2.5 opacity-30" />
        <span className="text-slate-900 font-bold uppercase tracking-tighter">Products</span>
      </nav>

      {/* Mobile Filter & Sort Bar */}
      <div className="md:hidden grid grid-cols-2 border-y border-slate-200 bg-white mb-2 sticky top-[72px] z-30">
        <button
          onClick={() => setIsFilterOpen(true)}
          className="flex items-center justify-center gap-2.5 py-4 text-[11px] font-black tracking-[0.15em] text-slate-800"
        >
          FILTER
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
        <button
          onClick={() => setIsSortOpen(!isSortOpen)}
          className={`flex items-center justify-center gap-2.5 py-4 text-[11px] font-black tracking-[0.15em] border-l border-slate-200 transition-colors ${isSortOpen ? 'text-[hsl(var(--swago-purple))]' : 'text-slate-800'}`}
        >
          SORT
          <svg className={`w-3.5 h-3.5 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
        </button>
      </div>

      {/* Mobile Sort Dropdown (Inline) */}
      <AnimatePresence>
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

      {/* Mobile Side Drawer Filter */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[80%] bg-white z-[101] md:hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <h2 className="text-lg font-black tracking-wider uppercase">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">✕</button>
              </div>

              <div className="flex-grow overflow-y-auto">
                {/* Search */}
                <div className="p-6 border-b border-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Keyword</p>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Search kits..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Accordions */}
                <div className="flex flex-col">
                  {/* Age Accordion */}
                  <div className="border-b border-slate-100">
                    <button
                      onClick={() => toggleAccordion("age")}
                      className="w-full p-6 flex items-center justify-between group"
                    >
                      <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${activeAccordion === 'age' ? 'text-[hsl(var(--swago-purple))]' : 'text-slate-700'}`}>Age Group</span>
                      <HiChevronRight className={`w-5 h-5 transition-transform duration-300 ${activeAccordion === 'age' ? 'rotate-90 text-[hsl(var(--swago-purple))]' : 'text-slate-300'}`} />
                    </button>
                    <AnimatePresence>
                      {activeAccordion === "age" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden px-6 pb-6"
                        >
                          <div className="flex flex-wrap gap-2">
                            {["All", "5-7", "8-10"].map(age => (
                              <button
                                key={age}
                                onClick={() => setFilters({ ...filters, age: age === 'All' ? '' : age })}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${(filters.age === age || (filters.age === "" && age === "All"))
                                  ? "bg-[hsl(var(--swago-purple))] text-white shadow-lg shadow-purple-200"
                                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                  }`}
                              >
                                {age}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Categories Accordion */}
                  <div className="border-b border-slate-100">
                    <button
                      onClick={() => toggleAccordion("categories")}
                      className="w-full p-6 flex items-center justify-between group"
                    >
                      <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${activeAccordion === 'categories' ? 'text-[hsl(var(--swago-purple))]' : 'text-slate-700'}`}>Categories</span>
                      <HiChevronRight className={`w-5 h-5 transition-transform duration-300 ${activeAccordion === 'categories' ? 'rotate-90 text-[hsl(var(--swago-purple))]' : 'text-slate-300'}`} />
                    </button>
                    <AnimatePresence>
                      {activeAccordion === "categories" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden px-6 pb-6"
                        >
                          <div className="flex flex-col gap-3">
                            {[
                              { id: "S", name: "Smart Tech" },
                              { id: "W", name: "Willpower" },
                              { id: "A", name: "Ambition" },
                              { id: "G", name: "Growth" },
                              { id: "O", name: "Optimization" },
                            ].map(element => (
                              <button
                                key={element.id}
                                onClick={() => {
                                  const current = filters.elements;
                                  const next = current.includes(element.id)
                                    ? current.filter(id => id !== element.id)
                                    : [...current, element.id];
                                  setFilters({ ...filters, elements: next });
                                }}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${filters.elements.includes(element.id)
                                  ? "bg-purple-50 text-[hsl(var(--swago-purple))]"
                                  : "text-slate-600 hover:bg-slate-50"
                                  }`}
                              >
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${filters.elements.includes(element.id) ? "bg-[hsl(var(--swago-purple))] border-transparent" : "border-slate-200"
                                  }`}>
                                  {filters.elements.includes(element.id) && <span className="text-[10px] text-white">✓</span>}
                                </div>
                                <span className="text-sm font-bold">{element.name}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100">
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-colors shadow-xl"
                >
                  Show Results ({sortedAndFilteredProducts.length})
                </button>
              </div>
            </motion.div>
          </>
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
            <p className="text-sm text-slate-500 mb-4 px-1">Loading products...</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-wider">
                  Showing {sortedAndFilteredProducts.length} kits
                </p>
              </div>

              {sortedAndFilteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-12 md:gap-6">
                  {sortedAndFilteredProducts.map((product) => (
                    <ProductCard key={getProductKey(product)} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-400">No Kits Found</h3>
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
