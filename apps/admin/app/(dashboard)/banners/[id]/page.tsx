// apps/admin/app/(dashboard)/banners/[id]/page.tsx

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        imageUrl: "",
        link: "",
        order: 0,
        isActive: true,
        device: "both",
    });

    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const res = await fetch(`/api/banners/${id}`);
                const data = await res.json();
                if (data.success) {
                    setFormData(data.banner);
                } else {
                    alert("Banner not found");
                    router.push("/banners");
                }
            } catch (error) {
                alert("Error fetching banner");
            } finally {
                setFetching(false);
            }
        };
        fetchBanner();
    }, [id]);

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
        setLoading(true);
        try {
            const res = await fetch(`/api/banners/${id}`, {
                method: "PATCH",
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
            alert("Failed to update banner");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/banners" className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Edit Banner</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-8 space-y-6">
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Banner Image</label>
                    <div className="relative w-full aspect-[3/1] bg-gray-100 rounded-xl overflow-hidden group">
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                            {uploading ? "Uploading..." : "Change Image"}
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Banner Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Target Link</label>
                        <input
                            type="text"
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold bg-white"
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
                            <option value="both">Both</option>
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
                        {loading ? "Saving..." : "Update Banner"}
                    </button>
                </div>
            </form>
        </div>
    );
}
