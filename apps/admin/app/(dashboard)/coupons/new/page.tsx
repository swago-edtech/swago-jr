// apps/admin/app/(dashboard)/coupons/new/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewCouponPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        code: "",
        type: "percentage",
        value: "" as any,
        description: "",
        minAmount: "" as any,
        maxDiscount: null as number | null,
        active: true,
        expiryDate: "",
        usageLimit: null as number | null,
        applicableProducts: [] as string[],
        isPublic: true,
        targetGroup: "all",
    });

    const [products, setProducts] = useState<any[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/products");
            const data = await res.json();
            if (data.success) {
                setProducts(data.products);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setProductsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await fetch("/api/coupons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (data.success) {
                router.push("/coupons");
            } else {
                alert(data.error || "Failed to create coupon");
            }
        } catch (error) {
            console.error("Error creating coupon:", error);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/coupons" className="text-gray-500 hover:text-gray-700">
                    ← Back
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Create New Coupon</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Coupon Code (e.g. SAVE20)</label>
                        <input
                            required
                            type="text"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                            placeholder="Enter coupon code"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Coupon Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        >
                            <option value="percentage">Percentage Off (%)</option>
                            <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Discount Value ({formData.type === "percentage" ? "%" : "₹"})
                        </label>
                        <input
                            required
                            type="number"
                            min="0"
                            value={formData.value}
                            onChange={(e) => setFormData({ ...formData, value: e.target.value === "" ? "" : Number(e.target.value) })}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Minimum Order Amount (₹)</label>
                        <input
                            type="number"
                            min="0"
                            value={formData.minAmount}
                            onChange={(e) => setFormData({ ...formData, minAmount: e.target.value === "" ? "" : Number(e.target.value) })}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        />
                    </div>

                    {formData.type === "percentage" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Maximum Discount (₹) - Optional</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.maxDiscount || ""}
                                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value ? Number(e.target.value) : null })}
                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                placeholder="Leave blank for no limit"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Total Usage Limit - Optional</label>
                        <input
                            type="number"
                            min="1"
                            value={formData.usageLimit || ""}
                            onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? Number(e.target.value) : null })}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                            placeholder="Total times this can be used"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Expiry Date - Optional</label>
                        <input
                            type="date"
                            value={formData.expiryDate}
                            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-8">
                        <input
                            id="active"
                            type="checkbox"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="active" className="text-sm font-medium text-gray-700">Active Coupon</label>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        required
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        placeholder="e.g. 20% off for new customers on orders above ₹1000"
                    />
                </div>

                <div className="space-y-4 border-t pt-6">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <span>Restriction: Applicable Products</span>
                            <span className="text-[10px] font-normal text-gray-500">(Leave blank if applicable to all products)</span>
                        </label>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                        {productsLoading ? (
                            <p className="text-sm text-gray-500 italic">Loading products...</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                                {products.map(product => (
                                    <label key={product._id} className="flex items-center gap-3 p-2 bg-white rounded border hover:border-blue-400 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.applicableProducts.includes(product._id)}
                                            onChange={(e) => {
                                                const updated = e.target.checked
                                                    ? [...formData.applicableProducts, product._id]
                                                    : formData.applicableProducts.filter(id => id !== product._id);
                                                setFormData({ ...formData, applicableProducts: updated });
                                            }}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{product.name}</span>
                                            <span className="text-[10px] text-gray-500">₹{product.price}</span>
                                        </div>
                                    </label>
                                ))}
                                {products.length === 0 && (
                                    <p className="text-sm text-gray-500">No products found.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                    <label className="text-sm font-bold text-gray-700">Coupon Visibility & Targets</label>
                    <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2">
                            <input
                                id="isPublic"
                                type="checkbox"
                                checked={formData.isPublic}
                                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">Make Public (Visible on Cart Page)</label>
                        </div>

                        <div className="space-y-2 mt-4">
                            <label className="text-sm font-medium text-gray-700">Target User Group</label>
                            <select
                                value={formData.targetGroup}
                                onChange={(e) => setFormData({ ...formData, targetGroup: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                            >
                                <option value="all">All Users</option>
                                <option value="new_users">New Users</option>
                                <option value="no_orders">Users with No Past Orders (First Order)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Save Coupon"}
                    </button>
                </div>
            </form>
        </div>
    );
}
