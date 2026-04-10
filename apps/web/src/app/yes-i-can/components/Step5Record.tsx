import { Video } from "lucide-react";

interface StepProps {
    onComplete: () => void;
}

export default function Step5Record({ onComplete }: StepProps) {
    return (
        <div className="flex-1 flex flex-col w-full h-full relative">
            {/* Step Header */}
            <div className="w-full flex justify-center pt-12 pb-0 md:pt-20 md:-mb-16 z-10 relative pointer-events-none">
                <h2 className="text-[14px] md:text-[16px] font-bold text-swago-purple tracking-widest uppercase opacity-60">Journey Progress</h2>
            </div>

            <div className="flex-1 flex flex-col md:flex-row w-full h-full">
                {/* LEFT: Media Plane */}
                <div className="md:w-1/2 flex items-center justify-center p-8 bg-pink-50/50 md:bg-transparent">
                    <div className="w-full max-w-xs md:max-w-md lg:max-w-lg aspect-square bg-swago-pink rounded-[3rem] p-8 overflow-hidden flex flex-col justify-end items-center shadow-xl shadow-pink-500/20 relative">
                        <div className="w-48 md:w-56 h-64 md:h-72 bg-white/20 rounded-t-[2.5rem] border-t border-x border-white/40 flex items-center justify-center backdrop-blur-sm shadow-inner overflow-hidden relative">
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/10 to-transparent"></div>
                            <span className="text-white font-black text-2xl whitespace-nowrap letter-pop opacity-90 relative z-10">Dancing Mascot</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Content Plane */}
                <div className="md:w-1/2 flex flex-col justify-center px-8 pt-6 pb-12 md:py-16 md:pr-16 lg:pr-24">
                    <h1 className="text-4xl md:text-5xl lg:text-[60px] font-black text-slate-800 tracking-tight leading-[1.1] mb-6 text-pop">
                        Now record your<br />best <span className="text-swago-pink">'Yes, I Can'</span><br />moves.
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 font-medium mb-12 max-w-md leading-relaxed text-zoom-in">
                        Show us your energy! Tap the button below to start your recording session.
                    </p>

                    <button onClick={onComplete} className="w-full md:w-fit px-10 py-5 lg:py-6 bg-purple-600 hover:bg-purple-700 text-white text-[16px] lg:text-[18px] font-black uppercase tracking-widest rounded-full transition-all shadow-xl shadow-purple-600/30 btn-shine btn-text-pop flex items-center justify-center gap-4">
                        <Video className="w-6 h-6 lg:w-7 lg:h-7 animate-pulse" fill="currentColor" /> <span>START RECORDING</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
