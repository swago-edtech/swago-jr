"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function AboutSwagoSection() {
    return (
        <section className="w-full relative overflow-hidden bg-white pt-8 md:pt-12">
            <div className="w-full relative flex flex-col-reverse lg:flex-row items-stretch">
                {/* Left Side - Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.7 }}
                    className="w-full lg:w-[60%] flex items-center justify-center p-3 md:p-6 lg:p-8 xl:p-10"
                >
                    <div className="max-w-xl text-slate-600 leading-relaxed text-lg lg:text-[19px] space-y-3 md:space-y-4">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-2">
                            What is <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#b251a2] to-[#7464a9]">SWAGO</span>
                        </h2>

                        <div className="space-y-2">
                            <p className="text-xl md:text-2xl font-bold text-slate-800 leading-snug">
                                SWAGO is a <span className="text-[#b251a2]">gamified, screen-free</span> learning system of physical smart boxes that help kids build <span className="text-[#7bc4c3]">real-world skills</span> through play.
                            </p>

                            <p>
                                Each box is designed as a mission filled with challenges that build <strong className="text-slate-800 font-bold">focus, confidence, and expression.</strong>
                            </p>

                            <p className="text-xl font-bold italic text-[#7464a9]">
                                It moves children from passive consumption to active growth
                            </p>

                            <div className="flex items-center gap-4 py-2">
                                <div className="flex flex-col items-center">
                                    <span className="text-slate-400 line-through text-sm uppercase tracking-widest font-bold">From</span>
                                    <span className="text-2xl md:text-3xl font-black text-slate-300 italic uppercase">I can&apos;t</span>
                                </div>
                                <div className="h-12 w-px bg-slate-200 rotate-[20deg]" />
                                <div className="flex flex-col items-center">
                                    <span className="text-[#b251a2] text-sm uppercase tracking-widest font-black">To</span>
                                    <span className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#b251a2] to-[#7464a9] italic uppercase transform -rotate-1">
                                        Yes, I can
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Buttons Section */}
                        <div className="pt-6">
                            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                                <Link
                                    href="/products"
                                    className="w-full sm:w-[calc(50%-0.5rem)] px-8 py-3.5 md:py-4 bg-swago-purple hover:bg-swago-purple/90 text-white text-center font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center lg:text-sm xl:text-base shadow-lg shadow-swago-purple/20"
                                >
                                    Buy Swago smart boxes
                                </Link>
                                <Link
                                    href="https://chat.whatsapp.com/CwGGxSas1NVIRXOkBqe9XD?mode=gi_t"
                                    target="_blank"
                                    className="w-full sm:w-[calc(50%-0.5rem)] px-8 py-3.5 md:py-4 bg-swago-teal hover:bg-swago-teal/90 text-white text-center font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center lg:text-sm xl:text-base shadow-lg shadow-swago-teal/20"
                                >
                                    Join our whatsapp community
                                </Link>
                                <Link
                                    href="/onboarding"
                                    className="w-full px-8 py-3.5 md:py-4 border-2 border-swago-purple text-swago-purple hover:bg-swago-purple hover:text-white text-center font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center"
                                >
                                    Create your kid&apos;s Swagoverse profile
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side - Image */}
                <div className="w-full lg:w-[40%] flex p-0 m-0">
                    <div className="relative w-full min-h-[300px] md:min-h-[400px] max-h-[640px] overflow-hidden">
                        <Image
                            src="/images/home/what-is-swago-img.jpeg"
                            alt="Swago Smart Box"
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 40vw"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
