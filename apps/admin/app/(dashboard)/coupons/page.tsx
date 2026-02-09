// apps/admin/app/(dashboard)/coupons/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Coupon = {
    _id: string;
    code: string;
    type: "percentage" | "fixed";
    value: number;
    description: string;
    minAmount: number;
    maxDiscount: number | null;
    active: boolean;
    expiryDate: string | null;
    usageLimit: number | null;
    usageCount: number;
    createdAt: string;
};

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/coupons");
            const data = await res.json();
            if (data.success) {
                setCoupons(data.coupons);
            }
        } catch (error) {
            console.error("Error fetching coupons:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`Are you sure you want to delete coupon "${code}"?`)) return;

        try {
            setDeleting(id);
            const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setCoupons(coupons.filter(c => c._id !== id));
            } else {
                alert(data.error || "Failed to delete coupon");
            }
        } catch (error) {
            console.error("Error deleting coupon:", error);
        } finally {
            setDeleting(null);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/coupons/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ active: !currentStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setCoupons(coupons.map(c => c._id === id ? { ...c, active: !currentStatus } : c));
            }
        } catch (error) {
            console.error("Error updating coupon status:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Coupon Codes</h1>
                    <p className="text-gray-600 mt-1">Manage discount coupons for customers</p>
                </div>
                <Link
                    href="/coupons/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    + Create New Coupon
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Loading coupons...</p>
                </div>
            ) : coupons.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-500 mb-4">No coupons found</p>
                    <Link href="/coupons/new" className="text-blue-600 hover:underline">
                        Create your first coupon
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {coupons.map((coupon) => (
                                <tr key={coupon._id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded truncate block max-w-[150px]" title={coupon.code}>
                                            {coupon.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 font-medium">
                                            {coupon.type === "percentage" ? `${coupon.value}% Off` : `₹${coupon.value} Flat Off`}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">{coupon.description}</div>
                                        <div className="text-[10px] text-gray-400 mt-1">Min: ₹{coupon.minAmount}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{coupon.usageCount} used</div>
                                        {coupon.usageLimit && (
                                            <div className="text-xs text-gray-500">Limit: {coupon.usageLimit}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleStatus(coupon._id, coupon.active)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${coupon.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {coupon.active ? "Active" : "Inactive"}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleDelete(coupon._id, coupon.code)}
                                                disabled={deleting === coupon._id}
                                                className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                                            >
                                                {deleting === coupon._id ? "Deleting..." : "Delete"}
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
