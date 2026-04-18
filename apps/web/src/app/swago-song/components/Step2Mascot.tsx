"use client";

import { motion } from "framer-motion";

interface StepProps {
    onNext: () => void;
}

export default function Step2Mascot({ onNext }: StepProps) {
    return (
        /* Matched pt-2 and bg-white for a seamless transition from Step 1 */
        <div className="flex-1 flex flex-col w-full min-h-screen md:min-h-full relative overflow-x-hidden bg-white px-4  md:pt-0">

            <div className="flex-1 flex flex-col md:flex-row w-full h-full max-w-7xl mx-auto items-center justify-center">
                
                {/* TOP: Media Plane (The Squad) */}
                <div className="w-full md:w-1/2 flex flex-col items-center justify-center z-20  md:pt-0">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-[240px] sm:max-w-[280px] md:max-w-[480px] lg:max-w-[550px]"
                    >
                        <img 
                            src="/images/home/five-mascots.png" 
                            alt="Swago Squad" 
                            className="w-full h-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)] animate-float" 
                        />
                    </motion.div>
                </div>

                {/* BOTTOM: Content Plane */}
                <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left py-2 md:py-0 md:pl-12 lg:pl-16">
                    
                    <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[1] mb-2">
                        Alright! We will<br />
                        guide <span className="text-[hsl(var(--swago-purple))]">you!</span>
                    </h1>

                    <p className="text-slate-500 font-medium text-sm md:text-lg lg:text-xl mb-4 max-w-sm leading-relaxed px-2 md:px-0">
                        Meet the rest of your Swago Guides: <span className="text-slate-900 font-bold">Aga, Skoo, Op, and Woo.</span> You're officially on the SWAGO Squad! 🌟
                    </p>

                    <div className="w-full px-2 md:px-0">
                        <button 
                            onClick={onNext} 
                            className="w-full md:w-fit px-12 py-5 bg-[hsl(var(--swago-purple))] text-white font-black  tracking-widest rounded-2xl shadow-xl shadow-purple-900/20 hover:brightness-110 active:scale-95 transition-all btn-shine"
                        >
                            <span>Tell me the mission</span>
                        </button>
                        
                        
                    </div>
                </div>
            </div>
        </div>
    );
}