"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, Settings, Search } from "lucide-react";

export default function InventoryConfigList() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/inventory/config");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const filtered = products.filter((p: any) => p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Product Bill of Materials</h1>
        <p className="text-gray-500 mt-1">Map e-commerce products to their raw inventory components</p>
      </div>
      
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16"><div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-4"></div><p className="text-gray-500 font-medium">Loading products...</p></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Store Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Configuration Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.map((product: any) => (
                  <tr key={product._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {product.images && product.images[0] ? (
                          <div className="flex-shrink-0 h-14 w-14 relative rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="56px" />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shadow-sm">
                            <Package className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900 max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md truncate" title={product.name}>{product.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">₹{product.price}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {product.hasConfig ? (
                        <span>{product.stock} units</span>
                      ) : (
                        <span className="text-gray-400">0 units</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.hasConfig ? (
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                            Configured
                          </span>
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{product.componentCount} items</span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                          Unmapped
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <Link href={`/inventory/config/${product._id}`} className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-200 transition-colors shadow-sm">
                        <Settings className="w-4 h-4 mr-1.5" /> Configure
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
