"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HiArrowRight } from "react-icons/hi";
import { motion } from "framer-motion";

interface Blog {
    _id: string;
    title: string;
    slug: string;
    metaDescription: string;
    coverImage: string;
    createdAt: string;
}

export default function HomeBlogSection() {
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBlog() {
            try {
                const res = await fetch("/api/blogs");
                const data = await res.json();
                if (data.success && data.blogs.length > 0) {
                    setBlog(data.blogs[0]); // Take the latest blog
                }
            } catch (err) {
                console.error("Failed to fetch blog for home page", err);
            } finally {
                setLoading(false);
            }
        }
        fetchBlog();
    }, []);

    if (loading || !blog) return null;

    return (
        <section className="py-16 md:py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                    <div className="text-left">
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                            Swago <span className="text-[hsl(var(--swago-purple))]">Insights</span>
                        </h2>
                        <p className="text-slate-500 font-bold mt-2 text-lg md:text-xl">
                            Parenting tips, science, and more.
                        </p>
                    </div>
                    <Link
                        href="/blog"
                        className="flex items-center gap-2 group text-slate-900 font-black text-sm uppercase tracking-widest border-b-2 border-slate-900 pb-1 hover:text-[hsl(var(--swago-purple))] hover:border-purple-600 transition-all"
                    >
                        Explore More Blogs <HiArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <Link
                    href={`/blog/${blog.slug}`}
                    className="group flex flex-col lg:flex-row bg-[#F8F9FF] rounded-[3rem] overflow-hidden border border-slate-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_100px_-25px_rgba(0,0,0,0.1)] transition-all duration-700"
                >
                    <div className="w-full lg:w-1/2 aspect-[16/10] lg:aspect-auto relative overflow-hidden">
                        {blog.coverImage ? (
                            <img
                                src={blog.coverImage}
                                alt={blog.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                <span className="text-slate-200 font-black text-6xl">INSIGHT</span>
                            </div>
                        )}
                        <div className="absolute top-8 left-8">
                            <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                                Feature Story
                            </span>
                        </div>
                    </div>
                    
                    <div className="w-full lg:w-1/2 p-10 md:p-16 flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-[10px] font-black text-[hsl(var(--swago-purple))] uppercase tracking-widest">
                                Swago Academy
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        
                        <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-[1.1] transition-colors group-hover:text-[hsl(var(--swago-purple))]">
                            {blog.title}
                        </h3>
                        
                        <p className="text-slate-500 text-lg md:text-xl font-medium italic mb-10 line-clamp-3">
                            {blog.metaDescription}
                        </p>
                        
                        <div className="flex items-center gap-3 text-[hsl(var(--swago-purple))] font-black text-xs uppercase tracking-[0.2em] group-hover:gap-5 transition-all">
                            Read Full Story <HiArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </Link>
            </div>
        </section>
    );
}
