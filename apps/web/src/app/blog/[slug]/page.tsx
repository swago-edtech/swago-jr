"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { HiArrowLeft, HiShare, HiChevronRight } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";

// Quiz Component
function Quiz({ data }: { data: any }) {
    const [step, setStep] = useState(0); // 0: Start, 1: Questions, 2: Result
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [totalScore, setTotalScore] = useState(0);

    const questions = data.questions;

    const handleOptionSelect = (points: number) => {
        setTotalScore(prev => prev + points);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setStep(2);
        }
    };

    const getResult = () => {
        if (totalScore >= 36) return {
            title: "The Calm Captain",
            description: "Your child may naturally show strong patience and self-control in everyday situations. They often stay calm when plans change, try again after small mistakes, and follow instructions more easily."
        };
        if (totalScore >= 26) return {
            title: "The Curious Explorer",
            description: "Your child may have a natural curiosity about the world and enjoy discovering new things. They might sometimes feel frustrated or distracted when tasks become difficult, which is a common stage of development."
        };
        return {
            title: "The Growing Adventurer",
            description: "Your child is still developing some important skills like emotional recovery, patience, or confidence when trying new things. These are exactly the moments where children learn and grow the most."
        };
    };

    if (step === 0) {
        return (
            <div className="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-2xl border-4 border-[hsl(var(--swago-purple))] text-center space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--swago-purple))]/5 rounded-bl-full -mr-10 -mt-10" />
                <div className="flex justify-center mb-0 transform scale-125">
                    <Logo />
                </div>
                <div className="inline-block px-4 py-1.5 bg-yellow-400 text-slate-800 rounded-lg text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                    KIDS PERSONALITY QUIZ
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight uppercase tracking-tight">{data.title}</h3>
                <p className="text-xl text-slate-500 font-medium">Take this 2-minute quiz to understand your child's brain type—and learn how to build their focus, confidence, and emotional strength.</p>
                <button
                    onClick={() => setStep(1)}
                    className="bg-[hsl(var(--swago-purple))] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-200 hover:scale-105 transition-all"
                >
                    Start Personality Quiz
                </button>
            </div>
        );
    }

    if (step === 1) {
        const q = questions[currentQuestionIndex];
        return (
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100 flex flex-col min-h-[500px]">
                <div className="flex justify-between items-center mb-12">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[hsl(var(--swago-purple))] transition-all duration-500" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} />
                    </div>
                </div>

                <h4 className="text-2xl md:text-3xl font-black text-slate-900 mb-12 leading-tight">
                    {q.question}
                </h4>

                <div className="grid gap-4 mt-auto">
                    {q.options.map((opt: any, i: number) => (
                        <button
                            key={i}
                            onClick={() => handleOptionSelect(opt.points)}
                            className="w-full text-left p-6 md:p-8 rounded-[1.5rem] border-2 border-slate-100 hover:border-[hsl(var(--swago-purple))] hover:bg-purple-50 transition-all font-bold text-slate-700 flex justify-between items-center group"
                        >
                            <span>{opt.text}</span>
                            <HiChevronRight className="w-6 h-6 text-slate-300 group-hover:text-[hsl(var(--swago-purple))] transition-colors" />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    const { title, description } = getResult();
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="bg-[hsl(var(--swago-purple))] rounded-[2.5rem] p-10 md:p-16 shadow-2xl text-white text-center space-y-8 relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-br-full -ml-20 -mt-20 blur-3xl" />

            <div className="relative z-10">
                <div className="flex justify-center mb-8">
                    <div className="bg-white px-6 py-3 rounded-2xl shadow-xl transform -rotate-2">
                        <Logo />
                    </div>
                </div>
                <div className="inline-block px-6 py-2 bg-yellow-400 text-slate-900 rounded-full text-xs font-black uppercase tracking-[0.3em] mb-6 shadow-lg transform rotate-1">
                    YOUR PERSONALITY RESULT
                </div>
                <h3 className="text-5xl md:text-7xl font-black mb-8 uppercase tracking-tight leading-tight drop-shadow-md">{title}</h3>
                <p className="text-xl md:text-3xl opacity-95 leading-relaxed max-w-2xl mx-auto font-bold mb-12">{description}</p>

                <div className="pt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => { setStep(0); setCurrentQuestionIndex(0); setTotalScore(0); }}
                        className="bg-white text-[hsl(var(--swago-purple))] px-6 py-4 rounded-xl font-black uppercase tracking-widest text-xs"
                    >
                        Retake Quiz
                    </button>
                    {/* <Link
                        href="/products"
                        className="bg-slate-900 text-white px-6 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/20"
                    >
                        Explore Growth Kits
                    </Link> */}
                </div>
            </div>
        </motion.div>
    );
}

export default function SingleBlogPage() {
    const { slug } = useParams();
    const [blog, setBlog] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBlog() {
            try {
                const res = await fetch(`/api/blogs/${slug}?t=${Date.now()}`, {
                    cache: 'no-store'
                });
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
    }, [slug]);

    if (loading) return <div className="min-h-screen py-20 text-center text-slate-500">Retrieving article...</div>;
    if (!blog) return (
        <div className="min-h-screen py-20 text-center">
            <h1 className="text-4xl font-black text-slate-900">ARTICLE NOT FOUND</h1>
            <Link href="/blog" className="text-[hsl(var(--swago-purple))] font-black mt-4 inline-block underline">Return to Blog</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            {/* Blog Post Layout */}
            <article className="pb-32">
                {/* Cover Section */}
                {blog.coverImage ? (
                    <div className="w-full h-[50vh] min-h-[400px] relative">
                        <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 text-center">
                            <Link href="/blog" className="inline-flex items-center gap-2 text-white/80 font-black text-xs uppercase tracking-widest mb-6 hover:text-white transition-colors">
                                <HiArrowLeft /> Back to Insights
                            </Link>
                            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight uppercase tracking-tight">{blog.title}</h1>
                        </div>
                    </div>
                ) : (
                    <div className="pt-32 pb-16 bg-slate-50 text-center">
                        <div className="container mx-auto px-4 max-w-4xl">
                            <Link href="/blog" className="inline-flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest mb-8 hover:text-slate-900 transition-colors">
                                <HiArrowLeft /> Back to Insights
                            </Link>
                            <h1 className="text-4xl md:text-7xl font-black text-slate-900 leading-tight uppercase tracking-tight">{blog.title}</h1>
                        </div>
                    </div>
                )}

                {/* Content Section */}
                <div className="max-w-3xl mx-auto px-4 mt-20">
                    <div className="flex items-center justify-between mb-12 border-b border-slate-100 pb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[hsl(var(--swago-purple))] flex items-center justify-center font-black text-white">S</div>
                            <div>
                                <div className="text-sm font-black text-slate-900">{blog.author || "Swago Team"}</div>
                                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{new Date(blog.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({ title: blog.title, url: window.location.href });
                                }
                            }}
                            className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-[hsl(var(--swago-purple))] hover:bg-purple-50 transition-all"
                        >
                            <HiShare className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-10">
                        {blog.content.map((block: any, i: number) => {
                            switch (block.type) {
                                case "heading":
                                    const Tag = `h${block.data.level}` as any;
                                    return (
                                        <Tag key={i} className={`font-black text-slate-900 ${block.data.level === 1 ? 'text-4xl' : block.data.level === 2 ? 'text-3xl' : 'text-2xl'} leading-tight mt-16`}>
                                            {block.data.text}
                                        </Tag>
                                    );
                                case "paragraph":
                                    return (
                                        <p
                                            key={i}
                                            className={`text-lg md:text-xl leading-relaxed text-slate-700 ${block.data.boldness === 'bold' ? 'font-bold' : block.data.boldness === 'black' ? 'font-black' : ''}`}
                                            style={{ color: block.data.color }}
                                        >
                                            {block.data.text}
                                        </p>
                                    );
                                case "image":
                                    return (
                                        <figure key={i} className="my-12">
                                            <img src={block.data.url} alt="" className="rounded-[2.5rem] shadow-2xl w-full" />
                                            {block.data.caption && <figcaption className="text-center text-sm text-slate-400 mt-6 font-medium italic">{block.data.caption}</figcaption>}
                                        </figure>
                                    );
                                case "list":
                                    const ListTag = block.data.type === 'ordered' ? 'ol' : 'ul';
                                    return (
                                        <ListTag key={i} className={`space-y-4 my-8 pl-8 ${block.data.type === 'ordered' ? 'list-decimal' : 'list-none'} text-lg md:text-xl text-slate-700`}>
                                            {block.data.items.map((item: string, ii: number) => (
                                                <li key={ii} className="relative">
                                                    {block.data.type === 'unordered' && <span className="absolute -left-8 text-[hsl(var(--swago-purple))] font-black">•</span>}
                                                    {item.includes(':') ? (
                                                        <>
                                                            <span className="font-black text-slate-900 uppercase tracking-tight mr-1">
                                                                {item.split(':')[0]}:
                                                            </span>
                                                            {item.split(':').slice(1).join(':')}
                                                        </>
                                                    ) : item}
                                                </li>
                                            ))}
                                        </ListTag>
                                    );
                                case "quiz":
                                    return <Quiz key={i} data={block.data} />;
                                case "html":
                                    return <div key={i} className="my-12 prose max-w-none" dangerouslySetInnerHTML={{ __html: block.data.code }} />;
                                case "spacer":
                                    return <div key={i} style={{ height: `${block.data.height}px` }} />;
                                default:
                                    return null;
                            }
                        })}
                    </div>

                    {/* CTA Section */}
                    {/* <div className="mt-24 p-12 md:p-16 rounded-[3rem] bg-slate-900 relative overflow-hidden text-center text-white">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(var(--swago-purple))]/20 rounded-bl-full -mr-20 -mt-20 blur-3xl" />
                        <h2 className="text-3xl md:text-5xl font-black mb-8 relative z-10 uppercase tracking-tight leading-tight">Ready to nurture your child's <span className="text-[hsl(var(--swago-purple))]">Potential?</span></h2>
                        <p className="text-xl opacity-70 mb-12 max-w-2xl mx-auto leading-relaxed relative z-10 font-medium italic">Explore our specialized growth kits designed to strengthen focus, confidence, and emotional intelligence through play.</p>
                        <Link
                            href="/products"
                            className="inline-block bg-[hsl(var(--swago-purple))] text-white px-12 py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-purple-900/20 hover:scale-105 transition-all relative z-10"
                        >
                            Shop All Products
                        </Link>
                    </div> */}
                </div>
            </article>
        </div>
    );
}
