"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PriceRange {
    _id: string;
    label: string;
    value: number;
    type: 'under' | 'above';
    isActive: boolean;
}

export default function ShopByPrice() {
    const [priceRanges, setPriceRanges] = useState<PriceRange[]>([]);
    const [loading, setLoading] = useState(true);

    const defaultRanges = [
        { _id: '1', label: 'Under ₹499', value: 499, type: 'under' },
        { _id: '2', label: 'Under ₹999', value: 999, type: 'under' },
        { _id: '3', label: 'Under ₹1500', value: 1500, type: 'under' },
        { _id: '4', label: 'Above ₹1500', value: 1500, type: 'above' },
    ];

    useEffect(() => {
        async function fetchRanges() {
            try {
                const res = await fetch('/api/price-ranges');
                const data = await res.json();
                if (data.success && data.priceRanges.length > 0) {
                    setPriceRanges(data.priceRanges);
                } else {
                    // @ts-ignore
                    setPriceRanges(defaultRanges);
                }
            } catch (e) {
                // @ts-ignore
                setPriceRanges(defaultRanges);
            } finally {
                setLoading(false);
            }
        }
        fetchRanges();
    }, []);

    if (loading) return null;

    return (
        <section className="py-10 md:py-14 bg-white overflow-hidden">
            <div className="container mx-auto px-4">


                <div className="text-center">
                    <h2 className="text-4xl md:text-6xl font-black mb-3 uppercase tracking-tight text-slate-900">
                        SHOP BY <span className="text-[hsl(var(--swago-purple))]">PRICE</span>
                    </h2>
                    <p className="text-slate-500 font-bold mb-12 text-base md:text-xl">
                        There&apos;s a toy for every child
                    </p>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-6xl mx-auto">
                    {priceRanges.map((range) => {
                        // Split label to extract amount and prefix
                        const isUnder = range.label.toLowerCase().includes('under');
                        const amountMatch = range.label.match(/₹?\d+/);
                        const amount = amountMatch ? amountMatch[0] : `₹${range.value}`;
                        const prefix = isUnder ? 'UNDER' : 'ABOVE';

                        return (
                            <Link
                                key={range._id}
                                href={`/products?minPrice=${range.type === 'above' ? range.value : 0}&maxPrice=${range.type === 'under' ? range.value : 10000}`}
                                className="group relative"
                            >
                                <div className="bg-[#e0f1ff] rounded-[2.5rem] p-6 md:p-10 aspect-square flex flex-col items-center justify-center shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] transition-all duration-500 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] hover:-translate-y-2 overflow-hidden border-4 border-white">



                                    <span className="text-[#d81b60] font-black text-lg md:text-2xl mb-1 tracking-tighter">
                                        {prefix}
                                    </span>
                                    <div className="flex items-start text-[#d81b60] font-black leading-none mb-6">
                                        <span className="text-4xl md:text-7xl font-black drop-shadow-sm select-none">
                                            {amount}
                                        </span>
                                    </div>

                                    <div className="bg-[hsl(var(--swago-purple))] text-white font-black text-xs md:text-sm px-6 md:px-8 py-3 rounded-xl shadow-lg shadow-purple-200 uppercase tracking-widest transition-transform group-hover:scale-105">
                                        SHOP NOW
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
