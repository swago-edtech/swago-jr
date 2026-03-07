"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HiPlus, HiPencil, HiTrash, HiEye } from "react-icons/hi";

interface Blog {
    _id: string;
    title: string;
    slug: string;
    isPublished: boolean;
    createdAt: string;
}

export default function BlogsPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const res = await fetch("/api/blogs");
            const data = await res.json();
            if (data.success) {
                setBlogs(data.blogs);
            }
        } catch (err) {
            console.error("Failed to fetch blogs", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this blog?")) return;
        try {
            const res = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
            if (res.ok) {
                setBlogs(blogs.filter(b => b._id !== id));
            }
        } catch (err) {
            alert("Failed to delete blog");
        }
    };

    const seedDefaultBlog = async () => {
        const defaultBlog = {
            title: "How Does Your Child's Brain Really Work?",
            slug: "child-brain-quiz",
            metaDescription: "Take this free 2-minute child personality quiz to understand your child's brain type—and learn how to build their focus, confidence, and emotional strength.",
            isPublished: true,
            content: [
                { type: "paragraph", data: { text: "Every parent has had a moment like this. You’re standing in the grocery store line. Your child sees a candy bar. You gently say 'no' … and suddenly it feels like the whole world has ended right there." } },
                { type: "paragraph", data: { text: "Or sometimes it’s the opposite. You say no, and your child just shrugs and moves on like it’s no big deal. Same situation. Completely different reactions." } },
                { type: "heading", data: { text: "Why Understanding Your Child’s Brain Style Matters", level: 2 } },
                { type: "list", data: { type: "unordered", items: ["Support confidence development", "Improve focus and self-control", "Encourage healthy emotional regulation", "Guide learning more effectively"] } },
                { type: "heading", data: { text: "The 3 Key Abilities This Quiz Explores", level: 2 } },
                { type: "paragraph", data: { text: "This quiz focuses on three important areas of childhood development: Executive Function, Emotional Regulation, and Confidence & Mindset." } },
                {
                    type: "quiz", data: {
                        title: "Child Personality Quiz",
                        questions: [
                            { question: "You need 20 minutes to finish dinner. Their reaction?", options: [{ text: "Finds a toy and waits patiently", points: 3 }, { text: "Ask every 2 minutes if it’s ready", points: 2 }, { text: "Has an emotional collapse", points: 1 }] },
                            { question: "You are on an important phone call.", options: [{ text: "They play quietly until you are done", points: 3 }, { text: "They wait a few minutes, then tap you", points: 2 }, { text: "They shout or stand in front of you", points: 1 }] },
                            { question: "You say: 'Socks on, brush teeth, get your bag.'", options: [{ text: "They complete all three independently", points: 3 }, { text: "They do one task, then get distracted", points: 2 }, { text: "They forget and start playing", points: 1 }] },
                            { question: "You say, 'Stay right next to me' in a busy store.", options: [{ text: "They stay right beside you", points: 3 }, { text: "They drift away but return when called", points: 2 }, { text: "They run toward interest immediately", points: 1 }] },
                            { question: "You give a 5-minute warning to stop playing.", options: [{ text: "They begin wrapping up their game", points: 3 }, { text: "They ignore the warning until time is up", points: 2 }, { text: "They refuse to stop and say it’s unfair", points: 1 }] },
                            { question: "You say no to a treat at the checkout.", options: [{ text: "They accept it and move on", points: 3 }, { text: "They try to negotiate", points: 2 }, { text: "It leads to a meltdown", points: 1 }] },
                            { question: "They cannot snap a toy together.", options: [{ text: "They take a breath and try again", points: 3 }, { text: "They ask you to fix it", points: 2 }, { text: "They throw the toy or scream", points: 1 }] },
                            { question: "The park is closed so you must go home.", options: [{ text: "They accept the change", points: 3 }, { text: "They stay moody for a while", points: 2 }, { text: "The whole day feels ruined", points: 1 }] },
                            { question: "You are in a busy and noisy environment.", options: [{ text: "They stay calm and follow you", points: 3 }, { text: "They become overly energetic", points: 2 }, { text: "They shut down or cry", points: 1 }] },
                            { question: "They lose a simple race or game.", options: [{ text: "They laugh and ask for another try", points: 3 }, { text: "They pout briefly", points: 2 }, { text: "They refuse to play again", points: 1 }] },
                            { question: "You suggest trying a new hobby.", options: [{ text: "They want to try immediately", points: 3 }, { text: "They watch first before joining", points: 2 }, { text: "They say they are bad at it", points: 1 }] },
                            { question: "They receive a puzzle.", options: [{ text: "They enjoy solving it", points: 3 }, { text: "They only work if you help", points: 2 }, { text: "They say it’s boring", points: 1 }] },
                            { question: "You ask them to show a drawing to a relative.", options: [{ text: "They proudly explain it", points: 3 }, { text: "They show it shyly", points: 2 }, { text: "They hide it", points: 1 }] },
                            { question: "They are stuck on a difficult task.", options: [{ text: "They try different solutions first", points: 3 }, { text: "They ask for help immediately", points: 2 }, { text: "They wait silently for help", points: 1 }] },
                            { question: "You show them a better way to hold a pencil.", options: [{ text: "They adjust and continue", points: 3 }, { text: "They try but feel annoyed", points: 2 }, { text: "They stop the activity", points: 1 }] }
                        ]
                    }
                },
                { type: "heading", data: { text: "How to Build Your Child's Focus and Confidence", level: 2 } },
                { type: "paragraph", data: { text: "SWAGO is a gamified skill-building system for kids that turns everyday play into real growth — developing focus, confidence, emotional resilience, leadership, and problem-solving through hands-on activities, missions, and challenges." } }
            ]
        };

        setLoading(true);
        try {
            const res = await fetch("/api/blogs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(defaultBlog)
            });
            if (res.ok) {
                fetchBlogs();
            }
        } catch (err) {
            alert("Failed to seed default blog");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manage Blogs</h1>
                    <p className="text-gray-500 mt-1">Create and edit articles for your website.</p>
                </div>
                <Link
                    href="/blogs/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <HiPlus /> New Blog
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b text-gray-700 font-medium">
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Created At</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {blogs.map((blog) => (
                            <tr key={blog._id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{blog.title}</div>
                                    <div className="text-xs text-gray-500">/{blog.slug}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${blog.isPublished ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                        }`}>
                                        {blog.isPublished ? "Published" : "Draft"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(blog.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <Link
                                        href={`/blogs/edit/${blog._id}`}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                                    >
                                        <HiPencil className="w-5 h-5" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(blog._id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                                    >
                                        <HiTrash className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {blogs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center">
                                    <p className="text-gray-500 mb-4">No blogs found. Get started by seeding the default quiz blog!</p>
                                    <button
                                        onClick={seedDefaultBlog}
                                        className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-100"
                                    >
                                        Seed Default Quiz Blog
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
