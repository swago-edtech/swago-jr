// apps/admin/app/(dashboard)/banners/new/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NewBannerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        imageUrl: "",
        link: "",
        order: 0,
        isActive: true,
        device: "both",
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const body = new FormData();
        body.append("file", file);

        try {
            const res = await fetch("/api/products/upload", {
                method: "POST",
                body,
            });
            const data = await res.json();
            if (data.success) {
                setFormData({ ...formData, imageUrl: data.url });
            } else {
                alert(data.error || "Upload failed");
            }
        } catch (error) {
            alert("Error uploading file");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.imageUrl) {
            alert("Please upload a banner image");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/banners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                router.push("/banners");
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert("Failed to create banner");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/banners" className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Add New Banner</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-8 space-y-6">
                {/* Image Upload */}
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Banner Image (Recommended Ratio 3:1)</label>
                    {formData.imageUrl ? (
                        <div className="relative w-full aspect-[3/1] bg-gray-100 rounded-xl overflow-hidden group">
                            <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, imageUrl: "" })}
                                className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full aspect-[3/1] border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {uploading ? (
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 text-gray-400 mb-3" />
                                        <p className="mb-2 text-sm text-gray-500 font-semibold text-center px-4">
                                            Click to upload banner image
                                        </p>
                                        <p className="text-xs text-gray-400">PNG, JPG or WebP (Max 5MB)</p>
                                    </>
                                )}
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Banner Title (Internal / Alt text)</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold bg-white"
                            placeholder="e.g. Summer Sale 2024"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Target Link (URL)</label>
                        <input
                            type="text"
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold bg-white"
                            placeholder="/products or https://..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Display Order</label>
                        <input
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Device Visibility</label>
                        <select
                            value={formData.device}
                            onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold bg-white"
                        >
                            <option value="both">Both (All Devices)</option>
                            <option value="desktop">Desktop Only</option>
                            <option value="mobile">Mobile Only</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Visible on website</label>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="bg-blue-600 text-white px-10 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        {loading ? "Saving..." : "Create Banner"}
                    </button>
                </div>
            </form>
        </div>
    );
}
