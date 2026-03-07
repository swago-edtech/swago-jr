"use client";

import { useState, useEffect } from "react";
import { HiPlus, HiTrash, HiSave } from "react-icons/hi";

interface PriceRange {
    _id: string;
    label: string;
    value: number;
    type: 'under' | 'above';
    isActive: boolean;
    order: number;
}

export default function PriceRangesPage() {
    const [ranges, setRanges] = useState<PriceRange[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchRanges();
    }, []);

    const fetchRanges = async () => {
        try {
            const res = await fetch("/api/price-ranges");
            const data = await res.json();
            if (data.success) {
                setRanges(data.priceRanges);
            }
        } catch (err) {
            setError("Failed to fetch price ranges");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        const newRange: any = {
            _id: `temp-${Date.now()}`,
            label: "Under \u20B9499",
            value: 499,
            type: "under",
            order: ranges.length,
            isActive: true,
            isNew: true,
        };
        setRanges([...ranges, newRange]);
    };

    const handleChange = (id: string, field: string, value: any) => {
        setRanges(ranges.map(r => r._id === id ? { ...r, [field]: value } : r));
    };

    const handleDelete = async (id: string, isNew?: boolean) => {
        if (isNew) {
            setRanges(ranges.filter(r => r._id !== id));
            return;
        }

        if (!confirm("Are you sure you want to delete this range?")) return;

        try {
            const res = await fetch(`/api/price-ranges/${id}`, { method: "DELETE" });
            if (res.ok) {
                setRanges(ranges.filter(r => r._id !== id));
                setSuccess("Deleted successfully");
            }
        } catch (err) {
            setError("Failed to delete");
        }
    };

    const handleSave = async (range: any) => {
        try {
            setError("");
            setSuccess("");
            const isNew = range._id.startsWith("temp-");
            const method = isNew ? "POST" : "PUT";
            const url = isNew ? "/api/price-ranges" : `/api/price-ranges/${range._id}`;

            const { _id, ...body } = range;
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (data.success) {
                setSuccess("Saved successfully");
                fetchRanges();
            } else {
                setError(data.error || "Failed to save");
            }
        } catch (err) {
            setError("Failed to save");
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 lowercase first-letter:uppercase">Shop by price settings</h1>
                    <p className="text-gray-500 mt-1">Manage the price ranges shown on the home page.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <HiPlus /> Add Range
                </button>
            </div>

            {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}
            {success && <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-lg">{success}</div>}

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-700">
                    <div className="col-span-4">Label</div>
                    <div className="col-span-2">Value (\u20B9)</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-1">Order</div>
                    <div className="col-span-1">Active</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                <div className="divide-y">
                    {ranges.map((range) => (
                        <div key={range._id} className="grid grid-cols-12 gap-4 p-4 items-center">
                            <div className="col-span-4">
                                <input
                                    type="text"
                                    value={range.label}
                                    onChange={(e) => handleChange(range._id, "label", e.target.value)}
                                    className="w-full border rounded px-2 py-1"
                                />
                            </div>
                            <div className="col-span-2">
                                <input
                                    type="number"
                                    value={range.value}
                                    onChange={(e) => handleChange(range._id, "value", Number(e.target.value))}
                                    className="w-full border rounded px-2 py-1"
                                />
                            </div>
                            <div className="col-span-2">
                                <select
                                    value={range.type}
                                    onChange={(e) => handleChange(range._id, "type", e.target.value)}
                                    className="w-full border rounded px-2 py-1"
                                >
                                    <option value="under">Under</option>
                                    <option value="above">Above</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <input
                                    type="number"
                                    value={range.order}
                                    onChange={(e) => handleChange(range._id, "order", Number(e.target.value))}
                                    className="w-full border rounded px-2 py-1"
                                />
                            </div>
                            <div className="col-span-1 text-center">
                                <input
                                    type="checkbox"
                                    checked={range.isActive}
                                    onChange={(e) => handleChange(range._id, "isActive", e.target.checked)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                />
                            </div>
                            <div className="col-span-2 flex justify-end gap-2 text-right">
                                <button
                                    onClick={() => handleSave(range)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                                    title="Save"
                                >
                                    <HiSave className="w-5 h-5" />
                                </button>
                                <button
                                    // @ts-ignore
                                    onClick={() => handleDelete(range._id, range.isNew)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                                    title="Delete"
                                >
                                    <HiTrash className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {ranges.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No price ranges defined. Click the button above to add one.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
