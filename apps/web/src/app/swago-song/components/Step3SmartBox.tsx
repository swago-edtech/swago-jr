"use client";

import { motion } from "framer-motion";

interface StepProps {
    onNext: () => void;
}

export default function Step3SmartBox({ onNext }: StepProps) {
    return (
        /* Consistent pt-2 and bg-white to match Step 1 and Step 2 */
        <div className="flex-1 flex flex-col w-full min-h-screen md:min-h-full relative overflow-x-hidden bg-white px-4 pt-2 md:pt-0">

            <div className="flex-1 flex flex-col md:flex-row w-full h-full max-w-7xl mx-auto items-center justify-center">
                
                {/* TOP: Image Section */}
                <div className="w-full md:w-1/2 flex flex-col items-center justify-center z-20 pt-4 md:pt-0">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        /* Sized to 180px on mobile to keep the layout tight and professional */
                        className="relative w-full max-w-[180px] sm:max-w-[220px] md:max-w-[480px] lg:max-w-[550px]"
                    >
                        <img 
                            src="/images/smart-box.jpeg" 
                            alt="Swago Smart Box" 
                            className="w-full h-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)] animate-float" 
                        />
                    </motion.div>
                </div>

                {/* BOTTOM: Text & Button Section */}
                <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left py-8 md:py-0 md:pl-12 lg:pl-16">
                    
                    <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[1] mb-6">
                        Go get your <br />
                        <span className="text-[hsl(var(--swago-purple))]">SWAGO Smart Box.</span>
                    </h1>

                    <div className="w-full px-2 md:px-0">
                        <button 
                            onClick={onNext} 
                            className="w-full md:w-fit px-12 py-5 bg-[hsl(var(--swago-purple))] text-white font-black tracking-widest rounded-2xl shadow-xl shadow-purple-900/20 hover:brightness-110 active:scale-95 transition-all btn-shine"
                        >
                            <span>Yes, I Got It</span>
                        </button>
                        
                    
                    </div>
                </div>
            </div>
        </div>
    );
}
