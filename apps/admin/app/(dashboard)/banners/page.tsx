// apps/admin/app/(dashboard)/banners/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Edit2, Eye, EyeOff, MoveUp, MoveDown, Layout, Smartphone } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import React from "react"; // Added React import for React.useCallback

type Banner = {
    _id: string;
    title: string;
    imageUrl: string;
    link: string;
    order: number;
    isActive: boolean;
    device: "both" | "desktop" | "mobile";
};

function BannerPreview({ banners, device }: { banners: Banner[], device: 'desktop' | 'mobile' }) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 3000 })]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const onSelect = React.useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', onSelect);
        onSelect();
        return () => {
            emblaApi.off('select', onSelect);
        };
    }, [emblaApi, onSelect]);

    const filteredBanners = banners.filter(b => b.isActive && (b.device === 'both' || b.device === device));

    if (filteredBanners.length === 0) {
        return (
            <div className={`bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 ${device === 'mobile' ? 'aspect-[9/16] w-64 mx-auto' : 'aspect-[3/1] w-full'}`}>
                <p className="text-gray-400">No active {device} banners</p>
            </div>
        );
    }

    return (
        <div className={`relative group overflow-hidden rounded-xl shadow-lg border-4 border-gray-900 ${device === 'mobile' ? 'aspect-[9/16] w-64 mx-auto' : 'aspect-[3/1] w-full'}`}>
            <div className="overflow-hidden h-full" ref={emblaRef}>
                <div className="flex h-full">
                    {filteredBanners.map((banner, index) => (
                        <div key={banner._id} className="flex-shrink-0 flex-grow-0 w-full min-w-0 relative h-full">
                            <img
                                src={banner.imageUrl}
                                alt={banner.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                                Order: {banner.order}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {filteredBanners.map((_, index) => (
                    <div
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === selectedIndex
                            ? "bg-[hsl(259,81%,64%)] w-3"
                            : "bg-white/50"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}

export default function BannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/banners");
            const data = await res.json();
            if (data.success) {
                setBanners(data.banners);
            }
        } catch (error) {
            console.error("Error fetching banners:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this banner?")) return;
        try {
            const res = await fetch(`/api/banners/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setBanners(banners.filter((b) => b._id !== id));
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert("Failed to delete banner");
        }
    };

    const toggleStatus = async (banner: Banner) => {
        try {
            const res = await fetch(`/api/banners/${banner._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !banner.isActive }),
            });
            const data = await res.json();
            if (data.success) {
                setBanners(banners.map((b) => (b._id === banner._id ? data.banner : b)));
            }
        } catch (error) {
            alert("Failed to update status");
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Homepage Banners</h1>
                    <p className="text-gray-500">Manage the carousel banners on the website</p>
                </div>
                <Link
                    href="/banners/new"
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-semibold"
                >
                    <Plus className="w-5 h-5" /> Add New Banner
                </Link>
            </div>

            {/* Live Preview Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Live Preview</h2>
                    </div>
                    <div className="flex bg-gray-200 p-1 rounded-lg">
                        <button
                            onClick={() => setPreviewDevice('desktop')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${previewDevice === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Layout className="w-3.5 h-3.5" /> Desktop
                        </button>
                        <button
                            onClick={() => setPreviewDevice('mobile')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${previewDevice === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Smartphone className="w-3.5 h-3.5" /> Mobile
                        </button>
                    </div>
                </div>
                <div className="p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50">
                    <div className="max-w-5xl mx-auto">
                        <BannerPreview banners={banners} device={previewDevice} />
                        <p className="text-center text-gray-400 text-xs mt-6 font-medium">
                            * This is a live simulation of how your banners appear to customers on the {previewDevice} website.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">Banner List</h3>
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {banners.length} total banners
                    </span>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-4 font-medium uppercase tracking-widest text-xs">Syncing Banners...</p>
                        </div>
                    ) : banners.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Layout className="w-10 h-10 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">No banners found</p>
                            <Link href="/banners/new" className="text-blue-600 text-sm mt-2 inline-block hover:underline font-semibold">
                                Upload your first banner →
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {banners.map((banner) => (
                                <div key={banner._id} className="p-5 flex items-center gap-8 hover:bg-gray-50/80 transition-colors group">
                                    {/* Preview Thumbnail */}
                                    <div className="w-48 aspect-[3/1] bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 shadow-sm relative group-hover:shadow-md transition-shadow">
                                        <img
                                            src={banner.imageUrl}
                                            alt={banner.title}
                                            className="w-full h-full object-cover"
                                        />
                                        {!banner.isActive && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                                                <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Hidden</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-bold text-gray-900 truncate">
                                                {banner.title || "Untitled Banner"}
                                            </h4>
                                            <div className="flex gap-1.5 flex-wrap">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${banner.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                                                    {banner.isActive ? "Active" : "Inactive"}
                                                </span>
                                                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">
                                                    {banner.device}
                                                </span>
                                                <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">
                                                    Sort: {banner.order}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-400 truncate flex items-center gap-1.5">
                                            <span className="text-gray-300">Link:</span> {banner.link || "None"}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => toggleStatus(banner)}
                                            className={`p-2.5 rounded-xl transition-all ${banner.isActive
                                                ? "bg-green-50 text-green-600 hover:bg-green-100"
                                                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                                }`}
                                            title={banner.isActive ? "Hide from website" : "Show on website"}
                                        >
                                            {banner.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                        </button>
                                        <Link
                                            href={`/banners/${banner._id}`}
                                            className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                                            title="Edit settings"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(banner._id)}
                                            className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                                            title="Delete banner"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
