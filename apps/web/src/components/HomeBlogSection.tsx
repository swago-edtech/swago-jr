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
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);

    const defaultBlogs: Blog[] = [
        {
            _id: "1",
            title: "Recycled Craft Ideas For Kids To Enjoy Indoors",
            slug: "recycled-craft-ideas",
            metaDescription: "Teaching children to recycle through crafts is teaching them to see solutions, not just problems...",
            coverImage: "https://picsum.photos/seed/craft/600/400",
            createdAt: "2026-01-20T00:00:00Z"
        },
        {
            _id: "2",
            title: "Benefits Of Storytelling And How It Impacts Children",
            slug: "benefits-of-storytelling",
            metaDescription: "Your little one is nestled beside you, eyes wide with wonder, as you tell them a tale of...",
            coverImage: "https://picsum.photos/seed/story/600/400",
            createdAt: "2026-01-17T00:00:00Z"
        },
        {
            _id: "3",
            title: "Fun Science Experiments For Kids To Try at Home",
            slug: "fun-science-experiments",
            metaDescription: "Remember when you were little, everything around you felt like a science experiment...",
            coverImage: "https://picsum.photos/seed/science/600/400",
            createdAt: "2026-01-16T00:00:00Z"
        },
        {
            _id: "4",
            title: "Unique and Thoughtful Baby Shower Gifts for 2026",
            slug: "baby-shower-gifts-2026",
            metaDescription: "There is something so beautiful about celebrating a life that's about to begin...",
            coverImage: "https://picsum.photos/seed/baby/600/400",
            createdAt: "2026-01-15T00:00:00Z"
        }
    ];

    useEffect(() => {
        async function fetchBlogs() {
            try {
                const res = await fetch("/api/blogs");
                const data = await res.json();
                if (data.success && data.blogs.length > 0) {
                    setBlogs(data.blogs.slice(0, 4));
                } else {
                    setBlogs(defaultBlogs);
                }
            } catch (err) {
                setBlogs(defaultBlogs);
            } finally {
                setLoading(false);
            }
        }
        fetchBlogs();
    }, []);

    if (loading || blogs.length === 0) return null;

    return (
        <section className="py-8 md:py-12 bg-white overflow-hidden">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-5xl font-bold text-[#2D2D2D] tracking-tight">
                        Blogs
                    </h2>
                </div>

                {/* Desktop Grid / Mobile Horizontal Scroll */}
                <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-6 md:gap-8 pb-10 no-scrollbar snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
                    {blogs.map((blog) => (
                        <div key={blog._id} className="flex-none w-[80vw] md:w-full snap-start flex flex-col group">
                            <Link href={`/blog/${blog.slug}`} className="block mb-6 overflow-hidden rounded-xl aspect-[1.3/1] relative">
                                <img
                                    src={blog.coverImage}
                                    alt={blog.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </Link>

                            <div className="flex flex-col flex-grow">
                                <span className="text-xs md:text-sm font-semibold text-gray-400 mb-3">
                                    {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>

                                <Link href={`/blog/${blog.slug}`}>
                                    <h3 className="text-lg md:text-xl font-bold text-[#2D2D2D] mb-3 leading-[1.3] transition-colors group-hover:text-[#7C5DFA] line-clamp-2">
                                        {blog.title}
                                    </h3>
                                </Link>

                                <p className="text-gray-500 text-sm md:text-base mb-6 line-clamp-3 leading-relaxed">
                                    {blog.metaDescription}
                                </p>

                                <Link
                                    href={`/blog/${blog.slug}`}
                                    className="mt-auto inline-flex items-center gap-1 text-[#7C5DFA] font-black text-sm md:text-base border-b-2 border-transparent hover:border-[#7C5DFA] pb-0.5 transition-all w-fit"
                                >
                                    Read More
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-6">
                    <Link
                        href="/blog"
                        className="inline-block font-bold text-gray-400 hover:text-[#7C5DFA] border-b-2 border-gray-400 hover:border-[#7C5DFA] transition-all pb-1 tracking-tight"
                    >
                        View All
                    </Link>
                </div>
            </div>
        </section>
    );
}
