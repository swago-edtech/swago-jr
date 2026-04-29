import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Instagram } from "lucide-react";

interface StepProps {
    onComplete: () => void;
}

export default function Step3Reward({ onComplete }: StepProps) {
    return (
        <div className="flex-1 flex flex-col w-full min-h-screen md:min-h-full relative overflow-x-hidden bg-white px-4 pt-6 md:pt-0">
            <div className="flex-1 flex flex-col md:flex-row w-full h-full max-w-7xl mx-auto items-center">

                {/* 1) TOP SECTION: Mascot & Headline */}
                <div className="w-full md:w-1/2 flex flex-col items-center justify-center z-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative w-full max-w-[160px] sm:max-w-[200px] md:max-w-[320px]"
                    >
                        <img
                            src="/images/home/image_ks4hbvks4hbvks4h.png"
                            alt="Op Mascot"
                            className="w-full h-auto object-contain animate-float"
                        />
                    </motion.div>

                    <div className="text-center px-2 mt-4">
                        <h1 className="text-3xl md:text-5xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-[1.1]">
                            The <span className="text-[hsl(var(--swago-purple))]">Checklist:</span>
                        </h1>
                    </div>
                </div>

                {/* 2) BOTTOM SECTION: Instructions & Form */}
                <div className="w-full md:w-1/2 flex flex-col items-center justify-center py-6 md:p-12">
                    <div className="w-full max-w-md text-left bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                                <span className="text-slate-700 font-medium">Upload your video as a Reel on <span className="font-bold flex inline-flex items-center gap-1"><Instagram className="w-4 h-4" /> Instagram.</span></span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                                <span className="text-slate-700 font-medium">Tag <span className="font-bold text-[hsl(var(--swago-purple))]">@Swago.co</span> in your caption so we can see your progress!</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                                <span className="text-slate-700 font-medium">Share your reel link with us below to claim your rewards.</span>
                            </li>
                        </ul>

                        <div className="w-full space-y-4">
                            <input
                                type="url"
                                placeholder="🔗 share your reel link with us..."
                                className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-[hsl(var(--swago-purple))] focus:ring-4 focus:ring-purple-500/10 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                            />

                            <button
                                onClick={onComplete}
                                className="w-full py-5 bg-[hsl(var(--swago-purple))] text-white font-black tracking-widest rounded-2xl shadow-xl shadow-purple-900/20 hover:brightness-110 active:scale-95 transition-all btn-shine flex items-center justify-center gap-3"
                            >
                                <span>Claim your 15 Swago Dollars!</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
