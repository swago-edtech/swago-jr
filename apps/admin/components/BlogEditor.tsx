"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    HiSave, HiEye, HiPlus, HiTrash, HiArrowUp, HiArrowDown,
    HiChatAlt2, HiPhotograph, HiQuestionMarkCircle, HiCode, HiViewList
} from "react-icons/hi";

interface Block {
    type: "paragraph" | "heading" | "image" | "quiz" | "html" | "list" | "spacer";
    data: any;
}

interface BlogData {
    title: string;
    slug: string;
    metaDescription: string;
    coverImage: string;
    isPublished: boolean;
    author?: string;
    content: Block[];
}

export default function BlogEditor({ initialData, id }: { initialData?: BlogData; id?: string }) {
    const router = useRouter();
    const [blog, setBlog] = useState<BlogData>(initialData || {
        title: "",
        slug: "",
        metaDescription: "",
        coverImage: "",
        isPublished: false,
        content: []
    });
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const addBlock = (type: Block["type"]) => {
        let data = {};
        switch (type) {
            case "heading": data = { text: "New Heading", level: 2 }; break;
            case "paragraph": data = { text: "Start typing...", boldness: "normal", color: "#000000" }; break;
            case "image": data = { url: "", caption: "" }; break;
            case "list": data = { items: ["Item 1"], type: "unordered" }; break;
            case "quiz": data = {
                title: "New Quiz",
                questions: [{
                    question: "Question 1",
                    options: [{ text: "Option A", points: 3 }, { text: "Option B", points: 2 }, { text: "Option C", points: 1 }]
                }]
            }; break;
            case "html": data = { code: "<div>Raw HTML</div>" }; break;
            case "spacer": data = { height: 20 }; break;
        }
        setBlog({ ...blog, content: [...blog.content, { type, data }] });
    };

    const updateBlock = (index: number, newData: any) => {
        const updatedContent = [...blog.content];
        updatedContent[index].data = { ...updatedContent[index].data, ...newData };
        setBlog({ ...blog, content: updatedContent });
    };

    const removeBlock = (index: number) => {
        setBlog({ ...blog, content: blog.content.filter((_, i) => i !== index) });
    };

    const moveBlock = (index: number, direction: "up" | "down") => {
        const newContent = [...blog.content];
        if (direction === "up" && index > 0) {
            [newContent[index], newContent[index - 1]] = [newContent[index - 1], newContent[index]];
        } else if (direction === "down" && index < newContent.length - 1) {
            [newContent[index], newContent[index + 1]] = [newContent[index + 1], newContent[index]];
        }
        setBlog({ ...blog, content: newContent });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const url = id ? `/api/blogs/${id}` : "/api/blogs";
            const method = id ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(blog)
            });
            if (res.ok) {
                router.push("/blogs");
            }
        } catch (err) {
            alert("Error saving blog");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Top Bar */}
            <div className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4 flex-1">
                    <input
                        type="text"
                        value={blog.title}
                        onChange={(e) => setBlog({ ...blog, title: e.target.value })}
                        placeholder="Blog Title"
                        className="text-2xl font-bold border-none bg-transparent focus:ring-0 w-full text-slate-900"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                        <HiEye /> {showPreview ? "Edit Mode" : "Preview"}
                    </button>
                    <div className="flex items-center gap-2 border-l pl-4 mr-4">
                        <span className="text-sm text-gray-500">Published</span>
                        <input
                            type="checkbox"
                            checked={blog.isPublished}
                            onChange={(e) => setBlog({ ...blog, isPublished: e.target.checked })}
                            className="w-5 h-5 rounded text-blue-600"
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition font-medium"
                    >
                        <HiSave /> {saving ? "Saving..." : "Save Blog"}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Editor Content Area */}
                <div className={`flex-1 overflow-y-auto p-8 ${showPreview ? "hidden" : "block"}`}>
                    <div className="max-w-4xl mx-auto space-y-8 bg-white p-12 rounded-2xl shadow-sm border border-gray-100 min-h-screen">
                        {/* Meta Info */}
                        <div className="space-y-4 border-b pb-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Slug</label>
                                    <input
                                        type="text"
                                        value={blog.slug}
                                        onChange={(e) => setBlog({ ...blog, slug: e.target.value })}
                                        placeholder="child-brain-works"
                                        className="w-full border rounded-lg px-3 py-2 text-sm text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cover Image URL</label>
                                    <input
                                        type="text"
                                        value={blog.coverImage}
                                        onChange={(e) => setBlog({ ...blog, coverImage: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full border rounded-lg px-3 py-2 text-sm text-slate-900"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Meta Description</label>
                                <textarea
                                    value={blog.metaDescription}
                                    onChange={(e) => setBlog({ ...blog, metaDescription: e.target.value })}
                                    placeholder="Enter a brief summary for SEO..."
                                    className="w-full border rounded-lg px-3 py-2 text-sm h-20 resize-none text-slate-900"
                                />
                            </div>
                        </div>

                        {/* Blocks */}
                        <div className="space-y-6">
                            {blog.content.map((block, index) => (
                                <div key={index} className="group relative border-2 border-transparent hover:border-blue-100 rounded-xl p-4 transition">
                                    {/* Block Controls */}
                                    <div className="absolute -left-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => moveBlock(index, "up")} className="p-1 hover:bg-gray-200 rounded text-gray-400"><HiArrowUp /></button>
                                        <button onClick={() => moveBlock(index, "down")} className="p-1 hover:bg-gray-200 rounded text-gray-400"><HiArrowDown /></button>
                                        <button onClick={() => removeBlock(index)} className="p-1 hover:bg-red-50 rounded text-red-400 mt-2"><HiTrash /></button>
                                    </div>

                                    {/* Block Header */}
                                    <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                        <span>{block.type}</span>
                                    </div>

                                    {/* Block Editors */}
                                    {block.type === "heading" && (
                                        <div className="flex gap-4 items-center">
                                            <select
                                                value={block.data.level}
                                                onChange={(e) => updateBlock(index, { level: Number(e.target.value) })}
                                                className="bg-gray-50 border-none text-xs rounded"
                                            >
                                                <option value={1}>H1</option>
                                                <option value={2}>H2</option>
                                                <option value={3}>H3</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={block.data.text}
                                                onChange={(e) => updateBlock(index, { text: e.target.value })}
                                                className={`w-full border-none focus:ring-0 font-bold text-slate-900 ${block.data.level === 1 ? 'text-4xl' : block.data.level === 2 ? 'text-2xl' : 'text-xl'}`}
                                            />
                                        </div>
                                    )}

                                    {block.type === "paragraph" && (
                                        <div className="space-y-3">
                                            <div className="flex gap-4 items-center mb-2 bg-gray-50 p-2 rounded text-xs">
                                                <select
                                                    value={block.data.boldness}
                                                    onChange={(e) => updateBlock(index, { boldness: e.target.value })}
                                                    className="bg-transparent border-none text-[10px]"
                                                >
                                                    <option value="normal">Regular</option>
                                                    <option value="bold">Bold</option>
                                                    <option value="black">Black</option>
                                                </select>
                                                <input
                                                    type="color"
                                                    value={block.data.color || "#000000"}
                                                    onChange={(e) => updateBlock(index, { color: e.target.value })}
                                                    className="w-6 h-6 border-none bg-transparent"
                                                />
                                            </div>
                                            <textarea
                                                value={block.data.text}
                                                onChange={(e) => updateBlock(index, { text: e.target.value })}
                                                className={`w-full border-none focus:ring-0 resize-none min-h-[100px] leading-relaxed ${block.data.boldness === 'bold' ? 'font-bold' : block.data.boldness === 'black' ? 'font-black' : ''}`}
                                                style={{ color: block.data.color }}
                                            />
                                        </div>
                                    )}

                                    {block.type === "image" && (
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                value={block.data.url}
                                                onChange={(e) => updateBlock(index, { url: e.target.value })}
                                                placeholder="Image URL"
                                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                            />
                                            <input
                                                type="text"
                                                value={block.data.caption}
                                                onChange={(e) => updateBlock(index, { caption: e.target.value })}
                                                placeholder="Image Caption"
                                                className="w-full border-none focus:ring-0 italic text-sm text-gray-500"
                                            />
                                            {block.data.url && (
                                                <img src={block.data.url} alt="" className="max-h-64 object-contain rounded-lg border bg-gray-50" />
                                            )}
                                        </div>
                                    )}

                                    {block.type === "list" && (
                                        <div className="space-y-3">
                                            <div className="flex gap-2 mb-2">
                                                <button onClick={() => updateBlock(index, { type: 'unordered' })} className={`text-[10px] px-2 py-1 rounded ${block.data.type === 'unordered' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}>Bullet</button>
                                                <button onClick={() => updateBlock(index, { type: 'ordered' })} className={`text-[10px] px-2 py-1 rounded ${block.data.type === 'ordered' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}>Numbered</button>
                                            </div>
                                            {block.data.items.map((item: string, i: number) => (
                                                <div key={i} className="flex gap-2">
                                                    <span className="text-gray-300">•</span>
                                                    <input
                                                        value={item}
                                                        onChange={(e) => {
                                                            const newItems = [...block.data.items];
                                                            newItems[i] = e.target.value;
                                                            updateBlock(index, { items: newItems });
                                                        }}
                                                        className="flex-1 border-none focus:ring-0 p-0 text-sm text-slate-900"
                                                    />
                                                    <button onClick={() => {
                                                        const newItems = block.data.items.filter((_: any, idx: number) => idx !== i);
                                                        updateBlock(index, { items: newItems });
                                                    }} className="text-gray-300 hover:text-red-400">×</button>
                                                </div>
                                            ))}
                                            <button onClick={() => updateBlock(index, { items: [...block.data.items, "New item"] })} className="text-xs text-blue-500 flex items-center gap-1 mt-2">
                                                <HiPlus className="w-3 h-3" /> Add Item
                                            </button>
                                        </div>
                                    )}

                                    {block.type === "quiz" && (
                                        <div className="space-y-6 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                            <input
                                                value={block.data.title}
                                                onChange={(e) => updateBlock(index, { title: e.target.value })}
                                                className="bg-transparent border-none focus:ring-0 text-lg font-black text-blue-800 w-full"
                                            />
                                            {block.data.questions.map((q: any, qi: number) => (
                                                <div key={qi} className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-[10px] font-bold text-gray-400">QUESTION {qi + 1}</span>
                                                        <button onClick={() => {
                                                            const newQs = block.data.questions.filter((_: any, idx: number) => idx !== qi);
                                                            updateBlock(index, { questions: newQs });
                                                        }} className="text-red-300 hover:text-red-500">Delete</button>
                                                    </div>
                                                    <input
                                                        value={q.question}
                                                        onChange={(e) => {
                                                            const newQs = [...block.data.questions];
                                                            newQs[qi].question = e.target.value;
                                                            updateBlock(index, { questions: newQs });
                                                        }}
                                                        className="w-full font-bold text-slate-900 border-none focus:ring-0"
                                                    />
                                                    <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                                                        {q.options.map((opt: any, oi: number) => (
                                                            <div key={oi} className="flex gap-3 items-center">
                                                                <input
                                                                    value={opt.text}
                                                                    onChange={(e) => {
                                                                        const newQs = [...block.data.questions];
                                                                        newQs[qi].options[oi].text = e.target.value;
                                                                        updateBlock(index, { questions: newQs });
                                                                    }}
                                                                    className="flex-1 text-sm border-none bg-gray-50 rounded px-2 py-1"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    value={opt.points}
                                                                    onChange={(e) => {
                                                                        const newQs = [...block.data.questions];
                                                                        newQs[qi].options[oi].points = Number(e.target.value);
                                                                        updateBlock(index, { questions: newQs });
                                                                    }}
                                                                    className="w-12 text-sm border-none bg-blue-50 rounded px-2 py-1 text-center font-bold text-blue-600"
                                                                />
                                                                <button onClick={() => {
                                                                    const newQs = [...block.data.questions];
                                                                    newQs[qi].options = newQs[qi].options.filter((_: any, idx: number) => idx !== oi);
                                                                    updateBlock(index, { questions: newQs });
                                                                }} className="text-gray-300">×</button>
                                                            </div>
                                                        ))}
                                                        <button onClick={() => {
                                                            const newQs = [...block.data.questions];
                                                            newQs[qi].options.push({ text: "New Option", points: 0 });
                                                            updateBlock(index, { questions: newQs });
                                                        }} className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mt-2">+ Add Option</button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => {
                                                const newQs = [...block.data.questions, { question: "New Question", options: [{ text: "Option A", points: 3 }] }];
                                                updateBlock(index, { questions: newQs });
                                            }} className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-400 rounded-xl hover:bg-blue-100/50 transition font-bold text-sm">+ Add Question</button>
                                        </div>
                                    )}

                                    {block.type === "html" && (
                                        <textarea
                                            value={block.data.code}
                                            onChange={(e) => updateBlock(index, { code: e.target.value })}
                                            className="w-full bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-lg h-32"
                                        />
                                    )}

                                    {block.type === "spacer" && (
                                        <div className="flex items-center gap-4 border-2 border-dashed border-gray-100 rounded p-2">
                                            <span className="text-[10px] text-gray-300">Height:</span>
                                            <input
                                                type="range"
                                                min="10"
                                                max="200"
                                                value={block.data.height}
                                                onChange={(e) => updateBlock(index, { height: Number(e.target.value) })}
                                            />
                                            <span className="text-[10px] text-gray-400">{block.data.height}px</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Block Adder */}
                        <div className="flex flex-wrap gap-3 pt-12 border-t justify-center">
                            <button onClick={() => addBlock("paragraph")} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-black transition text-gray-600 uppercase tracking-widest"><HiChatAlt2 /> Paragraph</button>
                            <button onClick={() => addBlock("heading")} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-black transition text-gray-600 uppercase tracking-widest"><HiChatAlt2 className="rotate-90" /> Heading</button>
                            <button onClick={() => addBlock("image")} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-black transition text-gray-600 uppercase tracking-widest"><HiPhotograph /> Image</button>
                            <button onClick={() => addBlock("list")} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-black transition text-gray-600 uppercase tracking-widest"><HiViewList /> List</button>
                            <button onClick={() => addBlock("quiz")} className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-full text-xs font-black transition text-blue-600 uppercase tracking-widest"><HiQuestionMarkCircle /> Quiz Builder</button>
                            <button onClick={() => addBlock("html")} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-black transition text-gray-600 uppercase tracking-widest"><HiCode /> HTML</button>
                        </div>
                    </div>
                </div>

                {/* Sidebar / Tools */}
                <div className={`w-96 bg-white border-l overflow-y-auto p-8 shadow-2xl ${showPreview ? "hidden" : "block"}`}>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Article Settings</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Social Sharing Image</label>
                            <div className="aspect-video w-full bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden relative group">
                                {blog.coverImage ? (
                                    <img src={blog.coverImage} alt="" className="object-cover w-full h-full" />
                                ) : (
                                    <HiPhotograph className="w-8 h-8 text-gray-300" />
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <span className="text-white text-[10px] font-bold uppercase">Change Image</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Author</label>
                            <input type="text" value={blog.author || "Swago Team"} onChange={(e) => setBlog({ ...blog, author: e.target.value })} placeholder="Swago Team" className="w-full border rounded-lg px-3 py-2 text-sm text-slate-900" />
                        </div>

                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-xs text-blue-800 leading-relaxed font-medium">
                                <b>Pro Tip:</b> Use the <b>Quiz Builder</b> to create interactive content that helps parents understand their child better.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Full Screen Preview */}
                {showPreview && (
                    <div className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-12">
                        <div className="max-w-3xl mx-auto bg-white min-h-screen rounded-3xl shadow-2xl overflow-hidden">
                            {/* Blog Post Preview Styling */}
                            {blog.coverImage && (
                                <div className="w-full aspect-video relative overflow-hidden">
                                    <img src={blog.coverImage} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-8 md:p-16">
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-tight">{blog.title}</h1>

                                <div className="space-y-8">
                                    {blog.content.map((block, i) => (
                                        <div key={i}>
                                            {block.type === "heading" && (
                                                <h2 className={`font-black text-slate-900 ${block.data.level === 1 ? 'text-4xl' : block.data.level === 2 ? 'text-3xl' : 'text-2xl'}`}>
                                                    {block.data.text}
                                                </h2>
                                            )}
                                            {block.type === "paragraph" && (
                                                <p
                                                    className={`leading-relaxed text-slate-700 text-lg ${block.data.boldness === 'bold' ? 'font-bold' : block.data.boldness === 'black' ? 'font-black' : ''}`}
                                                    style={{ color: block.data.color }}
                                                >
                                                    {block.data.text}
                                                </p>
                                            )}
                                            {block.type === "image" && (
                                                <figure>
                                                    <img src={block.data.url} alt="" className="rounded-2xl shadow-xl w-full" />
                                                    {block.data.caption && <figcaption className="text-center text-sm text-slate-400 mt-4 italic">{block.data.caption}</figcaption>}
                                                </figure>
                                            )}
                                            {block.type === "list" && (
                                                <ul className={`space-y-3 ${block.data.type === 'ordered' ? 'list-decimal pl-6' : 'list-none pl-6'}`}>
                                                    {block.data.items.map((item: string, ii: number) => (
                                                        <li key={ii} className="text-lg text-slate-700 relative">
                                                            {block.data.type === 'unordered' && <span className="absolute -left-6 text-[hsl(var(--swago-purple))]">•</span>}
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {block.type === "quiz" && (
                                                <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-12 border border-slate-100">
                                                    <h3 className="text-2xl font-black text-slate-900 mb-8 border-b border-slate-200 pb-4">{block.data.title}</h3>
                                                    <p className="text-slate-500 mb-8 italic">Mockup of interactive quiz component...</p>
                                                    <div className="space-y-12">
                                                        {block.data.questions.map((q: any, qi: number) => (
                                                            <div key={qi} className="space-y-6">
                                                                <h4 className="text-xl font-black text-slate-800 flex items-start gap-4">
                                                                    <span className="w-8 h-8 rounded-full bg-[hsl(var(--swago-purple))] text-white flex-none flex items-center justify-center text-sm">{qi + 1}</span>
                                                                    {q.question}
                                                                </h4>
                                                                <div className="grid gap-3 pl-12">
                                                                    {q.options.map((opt: any, oi: number) => (
                                                                        <div key={oi} className="p-4 rounded-2xl border-2 border-slate-200 hover:border-[hsl(var(--swago-purple))] transition font-bold text-slate-600 bg-white">
                                                                            {opt.text}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {block.type === "html" && (
                                                <div dangerouslySetInnerHTML={{ __html: block.data.code }} />
                                            )}
                                            {block.type === "spacer" && <div style={{ height: `${block.data.height}px` }} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
