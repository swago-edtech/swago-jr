"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { HiArrowLeft, HiShare, HiChevronRight } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";
import Image from "next/image";
import { FaWhatsapp, FaLightbulb, FaLock, FaCheckCircle } from "react-icons/fa";

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
            points: "36–45 Points",
            description: "Your child may naturally show strong patience and self-control in everyday situations.",
            bullets: [
                "Stay calm when plans change.",
                "try again after small mistakes",
                "follow instructions more easily",
                "approach new experiences with curiosity"
            ],
            extra: "These children often enjoy exploring challenges and figuring things out. Even with these strengths, they still benefit from encouragement and opportunities to try new things, because confidence grows through experience."
        };
        if (totalScore >= 26) return {
            title: "The Curious Explorer",
            points: "26–35 Points",
            description: "Your child may have a natural curiosity about the world and enjoy discovering new things. At the same time, they might sometimes feel frustrated or distracted when tasks become difficult.",
            bullets: [
                "asks many questions",
                "enjoys exploring ideas or activities",
                "sometimes loses patience when things don’t work"
            ],
            extra: "With supportive guidance and playful learning experiences, these children can develop strong problem-solving and creative thinking skills."
        };
        return {
            title: "The Growing Adventurer",
            points: "15–25 Points",
            description: "Your child is still developing some important skills, like emotional recovery, patience, or confidence when trying new things.",
            bullets: [
                "Frustration feels overwhelming.",
                "new challenges feel intimidating",
                "waiting or following instructions feels difficult"
            ],
            extra: "In fact, these are exactly the kinds of moments where children learn and grow the most. With gentle encouragement, practice, and positive experiences, these abilities often strengthen over time."
        };
    };

    if (step === 0) {
        return (
            <div className="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-2xl border-4 border-[hsl(var(--swago-purple))] text-center space-y-8 relative overflow-hidden max-w-2xl mx-auto">
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
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100 flex flex-col min-h-[500px] max-w-2xl mx-auto">
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

    const result = getResult();
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="w-full max-w-2xl mx-auto py-12 px-4 md:px-8 bg-[#fdfaff] rounded-[3rem] relative overflow-hidden"
        >
            {/* Background Texture/Soft Blur */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100/50 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-50/50 rounded-full blur-[100px] -ml-48 -mb-48" />

            <div className="relative z-10 flex flex-col items-center">
                {/* 1. Logo */}
                <div className="mb-0 transform scale-90">
                    <div className="bg-white/80 backdrop-blur-sm px-6 py-2 rounded-2xl shadow-sm border border-purple-50">
                        <Logo />
                    </div>
                </div>

                {/* 2. Completion Message */}
                <div className="text-center mt-10 mb-8 max-w-md">
                    <p className="text-[#3a2d5e] text-xl md:text-2xl font-black mb-1 leading-tight tracking-tight">
                        Congratulations! You’ve completed the quiz.
                    </p>
                    <p className="text-slate-400 text-sm md:text-base font-bold">
                        Your child’s brain style is
                    </p>
                </div>

                {/* 3. Mascot Image (Behind the card) */}
                <div className="w-56 h-48 md:w-64 md:h-56 relative z-0 -mb-32">
                    <Image
                        src="/images/blog/quiz_assets.jpg"
                        alt="Swago Mascots"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                {/* 4. The Result Card */}
                <div className="w-full bg-white rounded-[3rem] shadow-[0_30px_100px_-20px_rgba(58,45,94,0.12)] border border-purple-50/50 pt-28 pb-10 px-6 md:px-12 relative z-10">
                    
                    {/* Points Badge (Absolute) */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#efebff] px-6 py-2.5 rounded-full border-2 border-white shadow-lg z-30">
                        <span className="text-[#5e43aa] text-sm font-black tracking-widest">{result.points}</span>
                    </div>

                    <div className="text-center mb-10">
                        <h3 className="text-[#5e43aa] text-3xl md:text-[2.75rem] font-black uppercase tracking-tight leading-[1.1]">
                            {result.title}
                        </h3>
                    </div>

                    {/* Description Box */}
                    <div className="bg-slate-50/40 rounded-[2rem] p-6 md:p-8 space-y-6 border border-slate-100/50 text-left">
                        <p className="text-slate-600 text-base md:text-lg font-bold leading-relaxed">
                            {result.description}
                        </p>

                        <div className="space-y-4">
                            <h4 className="text-[#5e43aa] text-[10px] font-black uppercase tracking-[0.2em] opacity-80 pl-1">
                                KEY CHARACTERISTICS:
                            </h4>
                            <ul className="space-y-3 pl-1">
                                {result.bullets.map((b, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <FaCheckCircle className="flex-shrink-0 w-4 h-4 text-[#bdb2ff] mt-1" />
                                        <span className="text-slate-500 text-sm md:text-base font-bold opacity-90 leading-snug">
                                            {b}{!b.endsWith('.') ? '.' : ''}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Tip Box */}
                        <div className="bg-[#f3f0ff] rounded-2xl p-4 flex items-start gap-3 border border-purple-100/50">
                            <div className="bg-yellow-400 p-1.5 rounded-lg shadow-sm mt-0.5">
                                <FaLightbulb className="w-3 h-3 text-white" />
                            </div>
                            <p className="text-[#5e43aa] text-xs md:text-sm font-bold leading-relaxed">
                                {result.extra.includes('With gentle encouragement') 
                                    ? result.extra.split('strength')[0] // Truncating if extra long for visual match
                                    : "With gentle encouragement, practice & positive experiences, these abilities strengthen over time."}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-10 space-y-4">
                        <Link
                            href="https://chat.whatsapp.com/CwGGxSas1NVIRXOkBqe9XD?mode=gi_t"
                            target="_blank"
                            className="w-full bg-[#7c5dfa] text-white py-5 rounded-full font-black uppercase tracking-widest text-sm md:text-base flex items-center justify-center gap-3 shadow-[0_15px_30px_-5px_rgba(124,93,250,0.3)] hover:scale-[1.02] transition-all active:scale-95"
                        >
                            <FaWhatsapp className="w-6 h-6 text-green-400" />
                            <span>Join SWAGO Parent Circle</span>
                        </Link>

                        <button
                            onClick={() => { setStep(0); setCurrentQuestionIndex(0); setTotalScore(0); }}
                            className="w-full bg-white text-[#5e43aa] py-5 rounded-full font-black uppercase tracking-widest text-[10px] md:text-xs shadow-sm border border-purple-50 hover:bg-slate-50 transition-all flex items-center justify-center"
                        >
                            Retake Quiz
                        </button>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="mt-6 flex items-center gap-2 opacity-30 text-slate-900">
                    <FaLock className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        Be part of a community trusted by 10,000+ parents
                    </span>
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
