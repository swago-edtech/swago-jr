"use client";

import { useState, useEffect, use } from "react";
import BlogEditor from "@/components/BlogEditor";

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBlog() {
            try {
                const res = await fetch(`/api/blogs/${id}`);
                const data = await res.json();
                if (data.success) {
                    setBlog(data.blog);
                }
            } catch (err) {
                console.error("Failed to fetch blog", err);
            } finally {
                setLoading(false);
            }
        }
        fetchBlog();
    }, [id]);

    if (loading) return <div className="p-8">Loading blog...</div>;
    if (!blog) return <div className="p-8 text-red-500">Blog not found.</div>;

    return <BlogEditor initialData={blog} id={id} />;
}
