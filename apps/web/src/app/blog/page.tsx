"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HiArrowRight } from "react-icons/hi";

interface Blog {
    _id: string;
    title: string;
    slug: string;
    metaDescription: string;
    coverImage: string;
    createdAt: string;
    author: string;
}

export default function BlogListingPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBlogs() {
            try {
                const res = await fetch(`/api/blogs?t=${Date.now()}`, {
                    cache: 'no-store'
                });
                const data = await res.json();
                if (data.success) {
                    setBlogs(data.blogs);
                }
            } catch (err) {
                console.error("Failed to fetch blogs", err);
            } finally {
                setLoading(false);
            }
        }
        fetchBlogs();
    }, []);

    if (loading) {
        return <div className="min-h-screen py-20 text-center text-slate-500">Loading our latest insights...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 py-20">
            <div className="container mx-auto px-4 max-w-6xl">
                <header className="mb-16 text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">
                        Swago <span className="text-[hsl(var(--swago-purple))]">Insights</span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
                        Deep dives into child development, skill-building, and the science of play.
                    </p>
                </header>

                {blogs.length === 0 ? (
                    <div className="text-center bg-white p-20 rounded-[2.5rem] shadow-sm border">
                        <p className="text-slate-400 font-bold tracking-widest">Coming Soon!</p>
                        <p className="text-slate-500 mt-2">We are currently crafting some amazing articles for you.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogs.map((blog) => (
                            <Link
                                key={blog._id}
                                href={`/blog/${blog.slug}`}
                                className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-100 flex flex-col"
                            >
                                {blog.coverImage ? (
                                    <div className="aspect-[16/10] relative overflow-hidden">
                                        <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    </div>
                                ) : (
                                    <div className="aspect-[16/10] bg-slate-100 flex items-center justify-center">
                                        <span className="text-slate-200 font-black text-4xl">INSIGHT</span>
                                    </div>
                                )}
                                <div className="p-8 flex flex-col flex-1">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-[10px] font-black tracking-widest text-[hsl(var(--swago-purple))] bg-purple-50 px-3 py-1 rounded-full">Article</span>
                                        <span className="text-[10px] font-bold text-slate-400 tracking-widest">{new Date(blog.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-4 line-clamp-2 leading-tight group-hover:text-[hsl(var(--swago-purple))] transition-colors">{blog.title}</h2>
                                    <p className="text-slate-500 text-sm line-clamp-3 mb-6 flex-1 italic">{blog.metaDescription}</p>
                                    <div className="flex items-center gap-2 font-black text-xs text-slate-900 tracking-widest group-hover:gap-4 transition-all mt-auto">
                                        Read Article <HiArrowRight className="text-[hsl(var(--swago-purple))] w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
