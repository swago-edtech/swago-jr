"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Product = {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  stock: number;
  lowStockThreshold: number;
  hasConfig?: boolean;
  images: string[];
  ageCategory: string;
  coreElements: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [ageFilter, setAgeFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (ageFilter !== "all") params.set("ageCategory", ageFilter);
      if (stockFilter !== "all") params.set("stockStatus", stockFilter);
      if (activeFilter !== "all") params.set("isActive", activeFilter);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.products);
      } else {
        console.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, ageFilter, stockFilter, activeFilter]);

  // Delete product (soft delete)
  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;

    try {
      setDeleting(productId);
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        alert("Product deleted successfully");
        fetchProducts();
      } else {
        alert("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product");
    } finally {
      setDeleting(null);
    }
  };

  // Toggle active status
  const toggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await res.json();

      if (data.success) {
        fetchProducts();
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Stock badge color
  const getStockBadge = (stock: number, threshold: number, hasConfig?: boolean) => {
    if (!hasConfig) {
      return <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-gray-100 text-gray-600 border border-gray-200">Not Configured</span>;
    }
    if (stock === 0) {
      return <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-red-100 text-red-800 border border-red-200">Out of Stock</span>;
    } else if (stock <= threshold) {
      return <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Low Stock ({stock})</span>;
    } else {
      return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 border border-green-200 font-bold px-2.5 rounded-full">In Stock ({stock})</span>;
    }
  };

  return (
    <div className="p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Product Catalog</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <Link
          href="/products/new"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition font-medium inline-flex items-center shadow-sm"
        >
          Add New Product
        </Link>
      </div>

      {/* Filters */}
{/* Filters */}
<div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {/* Search */}
    <div>
      <label htmlFor="search-input" className="block text-sm font-semibold text-gray-700 mb-1.5">
        Search
      </label>
      <input
        id="search-input"
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name..."
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    {/* Age Category */}
    <div>
      <label htmlFor="age-filter" className="block text-sm font-semibold text-gray-700 mb-1.5">
        Age Category
      </label>
      <select
        id="age-filter"
        value={ageFilter}
        onChange={(e) => setAgeFilter(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm bg-white"
      >
        <option value="all">All Ages</option>
        <option value="6-7">6-7 years</option>
        <option value="8-10">8-10 years</option>
        <option value="11-13">11-13 years</option>
      </select>
    </div>

    {/* Stock Status */}
    <div>
      <label htmlFor="stock-filter" className="block text-sm font-semibold text-gray-700 mb-1.5">
        Stock Status
      </label>
      <select
        id="stock-filter"
        value={stockFilter}
        onChange={(e) => setStockFilter(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm bg-white"
      >
        <option value="all">All Stock</option>
        <option value="in-stock">In Stock</option>
        <option value="low-stock">Low Stock</option>
        <option value="out-of-stock">Out of Stock</option>
      </select>
    </div>

    {/* Active Status */}
    <div>
      <label htmlFor="active-filter" className="block text-sm font-semibold text-gray-700 mb-1.5">
        Status
      </label>
      <select
        id="active-filter"
        value={activeFilter}
        onChange={(e) => setActiveFilter(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm bg-white"
      >
        <option value="all">All Products</option>
        <option value="true">Active Only</option>
        <option value="false">Inactive Only</option>
      </select>
    </div>
  </div>

  <div className="flex justify-between items-center text-sm text-gray-600">
    <span>Showing {products.length} products</span>
    <button
      onClick={() => {
        setSearch("");
        setAgeFilter("all");
        setStockFilter("all");
        setActiveFilter("all");
      }}
      className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-md transition-colors"
    >
      Clear Filters
    </button>
  </div>
</div>


      {/* Products Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-4"></div><p className="text-gray-500 font-medium">Loading catalog...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <p className="text-gray-500 mb-4">No products found</p>
          <Link
            href="/products/new"
            className="text-blue-600 hover:underline"
          >
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50/80 transition-colors">
                  {/* Product Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-200">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-gray-900 max-w-[200px] sm:max-w-xs md:max-w-sm truncate" title={product.name}>{product.name}</div>
                        <div className="flex gap-1 mt-1">
                          {product.coreElements.map((element, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 text-[10px] uppercase tracking-wider bg-gray-100 text-gray-600 rounded-full font-bold border border-gray-200"
                            >
                              {element}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        ₹{product.price}
                      </p>
                      {product.originalPrice && (
                        <p className="text-xs text-gray-500 line-through">
                          ₹{product.originalPrice}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Stock */}
                  <td className="px-6 py-4">
                    {getStockBadge(product.stock, product.lowStockThreshold, product.hasConfig)}
                  </td>

                  {/* Age */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {product.ageCategory}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                          product.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600 border border-gray-200 font-bold px-2.5 rounded-full"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                      {product.isFeatured && (
                        <span className="inline-flex items-center px-2.5 py-1 text-[10px] uppercase font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/products/${product._id}/edit`}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-200 text-xs font-medium rounded-lg text-indigo-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => toggleActive(product._id, product.isActive)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-200 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                      >
                        {product.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(product._id, product.name)}
                        disabled={deleting === product._id}
                        className="inline-flex items-center px-2.5 py-1.5 border border-red-200 text-xs font-medium rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {deleting === product._id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
