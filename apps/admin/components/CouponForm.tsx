"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Tag,
  Percent,
  IndianRupee,
  Calendar,
  Users,
  Globe,
  Zap,
  Check,
  Search,
  Layers,
  Sparkles,
} from "lucide-react";

type ProductItem = {
  _id: string;
  name: string;
  price: number;
  images?: string[];
};

type CouponFormData = {
  code: string;
  type: "percentage" | "fixed";
  value: number | string;
  description: string;
  minAmount: number | string;
  maxDiscount: number | null;
  active: boolean;
  expiryDate: string;
  usageLimit: number | null;
  applicableProducts: string[];
  isPublic: boolean;
  isExpressOnly: boolean;
  targetGroup: string;
};

type CouponFormProps = {
  mode: "create" | "edit";
  initialData?: CouponFormData;
  couponId?: string;
};

export default function CouponForm({ mode, initialData, couponId }: CouponFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const [formData, setFormData] = useState<CouponFormData>({
    code: initialData?.code ?? "",
    type: initialData?.type ?? "percentage",
    value: initialData?.value ?? "",
    description: initialData?.description ?? "",
    minAmount: initialData?.minAmount ?? "",
    maxDiscount: initialData?.maxDiscount ?? null,
    active: initialData?.active ?? true,
    expiryDate: initialData?.expiryDate ?? "",
    usageLimit: initialData?.usageLimit ?? null,
    applicableProducts: initialData?.applicableProducts ?? [],
    isPublic: initialData?.isPublic ?? true,
    isExpressOnly: initialData?.isExpressOnly ?? false,
    targetGroup: initialData?.targetGroup ?? "all",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success) {
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      alert("Coupon code is required");
      return;
    }
    if (formData.value === "" || Number(formData.value) < 0) {
      alert("Please provide a valid discount value");
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = mode === "create" ? "/api/coupons" : `/api/coupons/${couponId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/coupons");
      } else {
        alert(data.error || `Failed to ${mode === "create" ? "create" : "update"} coupon`);
      }
    } catch (error) {
      console.error("Error saving coupon:", error);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const toggleProduct = (id: string) => {
    const exists = formData.applicableProducts.includes(id);
    const updated = exists
      ? formData.applicableProducts.filter((item) => item !== id)
      : [...formData.applicableProducts, id];
    setFormData({ ...formData, applicableProducts: updated });
  };

  const selectAllProducts = () => {
    setFormData({ ...formData, applicableProducts: products.map((p) => p._id) });
  };

  const clearSelectedProducts = () => {
    setFormData({ ...formData, applicableProducts: [] });
  };

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all bg-white";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900">
                {mode === "create" ? "Create New Coupon" : "Edit Coupon"}
              </h1>
              {formData.code && (
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-mono font-bold uppercase tracking-wider border border-blue-100">
                  {formData.code}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {mode === "create"
                ? "Set up discount rules, eligibility constraints, and visibility"
                : "Update discount parameters and target criteria"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Basic Coupon Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coupon Code *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. SAVE20"
                    className={`${inputClass} font-mono font-semibold uppercase tracking-wide`}
                  />
                  <p className="text-xs text-gray-400 mt-1">Automatically converted to UPPERCASE</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coupon Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "percentage" })}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                        formData.type === "percentage"
                          ? "border-blue-600 bg-blue-50/60 text-blue-700 font-semibold shadow-xs"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <Percent className="w-4 h-4" />
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: "fixed" })}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                        formData.type === "fixed"
                          ? "border-blue-600 bg-blue-50/60 text-blue-700 font-semibold shadow-xs"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <IndianRupee className="w-4 h-4" />
                      Fixed (₹)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value ({formData.type === "percentage" ? "%" : "₹"}) *
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      min="0"
                      step="any"
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          value: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      placeholder={formData.type === "percentage" ? "20" : "200"}
                      className={inputClass}
                    />
                    <div className="absolute right-3.5 top-2.5 text-gray-400 text-sm font-medium pointer-events-none">
                      {formData.type === "percentage" ? "%" : "₹"}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Order Amount (₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.minAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minAmount: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      placeholder="e.g. 999"
                      className={inputClass}
                    />
                    <div className="absolute right-3.5 top-2.5 text-gray-400 text-sm font-medium pointer-events-none">
                      ₹
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Leave empty for no order minimum</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`${inputClass} resize-none`}
                  placeholder="e.g. Get 20% OFF on all orders above ₹999 for first time customers"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Applicable Products Restriction
                  </h2>
                  <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {formData.applicableProducts.length === 0
                      ? "All Products"
                      : `${formData.applicableProducts.length} selected`}
                  </span>
                </div>
                {products.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllProducts}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={clearSelectedProducts}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products by name..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900"
                />
              </div>

              {productsLoading ? (
                <div className="py-8 text-center text-sm text-gray-400">Loading products catalog...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {filteredProducts.map((p) => {
                    const isSelected = formData.applicableProducts.includes(p._id);
                    return (
                      <label
                        key={p._id}
                        onClick={() => toggleProduct(p._id)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/40 text-blue-900 shadow-2xs"
                            : "border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        {p.images && p.images[0] ? (
                          <div className="relative w-9 h-9 rounded-md overflow-hidden bg-gray-100 flex-none border border-gray-200">
                            <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs flex-none">
                            IMG
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                          <p className="text-[11px] text-gray-500 font-medium">₹{p.price}</p>
                        </div>
                      </label>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <div className="col-span-full py-6 text-center text-xs text-gray-400">
                      No matching products found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-4 lg:self-start">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Usage Rules & Caps</span>
              </div>

              {formData.type === "percentage" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Discount Limit (₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.maxDiscount || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxDiscount: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="e.g. 500 (No limit if blank)"
                      className={inputClass}
                    />
                    <div className="absolute right-3.5 top-2.5 text-gray-400 text-sm font-medium pointer-events-none">
                      ₹
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Cap maximum discount amount for percentage coupons</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Redemptions Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.usageLimit || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usageLimit: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="e.g. 100 (Unlimited if blank)"
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 mt-1">Global total usage limit across all customers</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 mt-1">Coupon will automatically expire after this date</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Status & Visibility</span>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50/80 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">Active Status</span>
                    <span className="text-xs text-gray-400 block">
                      Enable or disable coupon redemption immediately
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50/80 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">Make Public</span>
                    <span className="text-xs text-gray-400 block">
                      Visible on regular cart and checkout banners
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50/80 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isExpressOnly}
                    onChange={(e) => setFormData({ ...formData, isExpressOnly: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      Express Checkout Only
                    </span>
                    <span className="text-xs text-gray-400 block">
                      Exclusive to Express 1-click checkout flow
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-500" />
                  Target User Group
                </label>
                <select
                  value={formData.targetGroup}
                  onChange={(e) => setFormData({ ...formData, targetGroup: e.target.value })}
                  className={inputClass}
                >
                  <option value="all">All Registered Customers</option>
                  <option value="new_users font-medium">New Account Registrations Only</option>
                  <option value="no_orders">First-time Buyers (Zero Past Orders)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8 pt-5 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {submitting
              ? mode === "create"
                ? "Creating..."
                : "Updating..."
              : mode === "create"
              ? "Create Coupon"
              : "Update Coupon"}
          </button>
        </div>
      </form>
    </div>
  );
}
