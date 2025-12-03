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
  const getStockBadge = (stock: number, threshold: number) => {
    if (stock === 0) {
      return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Out of Stock</span>;
    } else if (stock <= threshold) {
      return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">Low Stock ({stock})</span>;
    } else {
      return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">In Stock ({stock})</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <Link
          href="/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add New Product
        </Link>
      </div>

      {/* Filters */}
{/* Filters */}
<div className="bg-white p-4 rounded-lg shadow space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {/* Search */}
    <div>
      <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-1">
        Search
      </label>
      <input
        id="search-input"
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name..."
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    {/* Age Category */}
    <div>
      <label htmlFor="age-filter" className="block text-sm font-medium text-gray-700 mb-1">
        Age Category
      </label>
      <select
        id="age-filter"
        value={ageFilter}
        onChange={(e) => setAgeFilter(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">All Ages</option>
        <option value="5-7">5-7 years</option>
        <option value="8-10">8-10 years</option>
        <option value="11-13">11-13 years</option>
      </select>
    </div>

    {/* Stock Status */}
    <div>
      <label htmlFor="stock-filter" className="block text-sm font-medium text-gray-700 mb-1">
        Stock Status
      </label>
      <select
        id="stock-filter"
        value={stockFilter}
        onChange={(e) => setStockFilter(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">All Stock</option>
        <option value="in-stock">In Stock</option>
        <option value="low-stock">Low Stock</option>
        <option value="out-of-stock">Out of Stock</option>
      </select>
    </div>

    {/* Active Status */}
    <div>
      <label htmlFor="active-filter" className="block text-sm font-medium text-gray-700 mb-1">
        Status
      </label>
      <select
        id="active-filter"
        value={activeFilter}
        onChange={(e) => setActiveFilter(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      className="text-blue-600 hover:underline"
    >
      Clear Filters
    </button>
  </div>
</div>


      {/* Products Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">No products found</p>
          <Link
            href="/products/new"
            className="text-blue-600 hover:underline"
          >
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Age
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  {/* Product Info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate" title={product.name}>
                          {product.name.split(' ').slice(0, 8).join(' ')}
                          {product.name.split(' ').length > 8 && '...'}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {product.coreElements.map((element, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-1.5 py-0.5 text-xs bg-gray-100 text-gray-800 rounded font-medium"
                            >
                              {element}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3">
                    {getStockBadge(product.stock, product.lowStockThreshold)}
                  </td>

                  {/* Age */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">
                      {product.ageCategory}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                          product.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                      {product.isFeatured && (
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-purple-100 text-purple-700">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/products/${product._id}/edit`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => toggleActive(product._id, product.isActive)}
                        className="text-sm text-gray-600 hover:underline"
                      >
                        {product.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(product._id, product.name)}
                        disabled={deleting === product._id}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
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
