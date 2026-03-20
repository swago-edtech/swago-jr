"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ChevronRight } from 'lucide-react';

interface PriceRange {
    _id: string;
    label: string;
    value: number;
    type: 'under' | 'above';
    isPopular?: boolean;
}

export default function ShopByPrice() {
    const [priceRanges, setPriceRanges] = useState<PriceRange[]>([]);
    const [loading, setLoading] = useState(true);

    const defaultRanges: PriceRange[] = [
        { _id: '1', label: 'Under ₹499', value: 499, type: 'under' },
        { _id: '2', label: 'Under ₹999', value: 999, type: 'under' },
        { _id: '3', label: 'Under ₹1500', value: 1500, type: 'under' },
        { _id: '4', label: 'Under ₹2000', value: 2000, type: 'under', isPopular: true },
    ];

    useEffect(() => {
        async function fetchRanges() {
            try {
                const res = await fetch('/api/price-ranges');
                const data = await res.json();
                if (data.success && data.priceRanges.length > 0) {
                    // Enrich with popular status for demonstration if needed
                    const enriched = data.priceRanges.map((r: PriceRange, i: number) => ({
                        ...r,
                        isPopular: i === 3 // Make the last one popular as in the image (or similar)
                    }));
                    setPriceRanges(enriched);
                } else {
                    setPriceRanges(defaultRanges);
                }
            } catch (e) {
                setPriceRanges(defaultRanges);
            } finally {
                setLoading(false);
            }
        }
        fetchRanges();
    }, []);

    if (loading) return null;

    return (
        <section className="py-12 md:py-20 bg-[#F9F9F9]">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="mb-10 md:mb-14 ">
                    <h2 className="text-3xl md:text-4xl font-bold text-black text-center tracking-tight">
                        Shop By <span className="text-[#5C33CF]">Price</span>
                    </h2>
                </div>

                {/* Pricing Grid - 4x1 Desktop, 2x2 Mobile */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
                    {priceRanges.map((range) => {
                        const amountMatch = range.label.match(/₹?(\d+)/);
                        const amount = amountMatch ? amountMatch[1] : `${range.value}`;
                        
                        return (
                            <Link
                                key={range._id}
                                href={`/products?minPrice=${range.type === 'above' ? range.value : 0}&maxPrice=${range.type === 'under' ? range.value : 10000}`}
                                className="group block h-full"
                            >
                                <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-12 flex flex-col items-center justify-between shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-all duration-300 min-h-[180px] md:min-h-[160px] relative border-2 border-[#5C33CF] overflow-hidden">
                                    
                                    {/* Top Purple Decorative Line - Subtle accent */}
                                    <div className="absolute top-0 left-1/4 right-1/4 h-[3px] md:h-[4px] bg-[#5C33CF] rounded-full mt-2 opacity-100" />

                                    {/* Most Popular Badge */}
                                    {range.isPopular && (
                                        <div className="absolute top-4 md:top-6 right-4 md:right-6 bg-white border border-[#FBEBE5] rounded-lg md:rounded-xl px-2 md:px-4 py-1 flex items-center gap-1 shadow-sm">
                                            <Star className="w-2.5 md:w-3.5 h-2.5 md:h-3.5 fill-[#F37321] text-[#F37321]" />
                                            <span className="text-[9px] md:text-[11px] font-bold text-gray-400 tracking-wider">Most Popular</span>
                                        </div>
                                    )}

                                    {/* Content Wrapper for spacing */}
                                    <div className="flex flex-col items-center justify-center flex-grow py-4 md:py-8">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[1.2rem] md:text-[2.6rem] font-semibold text-[#F37321] leading-[0.8] tracking-tight mb-1 md:mb-2">
                                                Under
                                            </span>
                                            <span className="text-[2.2rem] md:text-[5.5rem] font-bold text-[#F37321] leading-none tracking-tighter">
                                                ₹{amount}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Button */}
                                    <div className="w-full mt-auto">
                                        <div className="bg-[#5C33CF] text-white font-bold text-xs md:text-lg px-4 md:px-8 py-2 md:py-4 rounded-full flex items-center justify-center gap-1.5 group-hover:bg-[#4B29A8] transition-all duration-300 shadow-lg shadow-purple-100">
                                            Shop Now <ChevronRight className="w-4 md:w-6 h-4 md:h-6 flex-shrink-0" strokeWidth={3} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

