import { CheckCircle2 } from "lucide-react";

interface StepProps {
    onComplete: () => void;
}

export default function Step6MissionComplete({ onComplete }: StepProps) {
    return (
        <div className="flex-1 flex flex-col w-full h-full relative">
            {/* Step Header */}
            <div className="w-full flex justify-center pt-12 pb-0 md:pt-20 md:-mb-16 z-10 relative pointer-events-none">
                <h2 className="text-[14px] md:text-[16px] font-bold text-swago-purple tracking-widest uppercase opacity-60">Journey Progress</h2>
            </div>

            <div className="flex-1 flex flex-col md:flex-row-reverse w-full h-full bg-white">
                {/* RIGHT: Media Plane */}
                <div className="md:w-1/2 flex items-center justify-center md:justify-start p-8 md:pl-12 lg:pl-24 bg-indigo-50/50 md:bg-transparent">
                    <div className="relative w-full max-w-sm lg:max-w-md aspect-square bg-white rounded-[2.5rem] p-8 flex flex-col items-center justify-center shadow-sm border border-indigo-100 overflow-hidden group">
                        <div className="w-20 h-20 bg-purple-600 rounded-2xl rotate-12 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                            <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>
                        <span className="text-indigo-400 font-bold tracking-widest uppercase text-xs md:text-sm">Final Mascot</span>
                    </div>
                </div>

                {/* LEFT: Content Plane */}
                <div className="md:w-1/2 flex flex-col justify-center px-8 pt-8 pb-12 md:py-16 md:pr-12 md:pl-24 lg:pl-48 xl:pl-64 bg-white">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-tight leading-[1.1] mb-6 text-pop">
                        Mission Complete!<br /><span className="text-swago-purple">Ready to create<br />your ID?</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 font-medium mb-12 max-w-md leading-relaxed text-zoom-in">
                        You've successfully finished all challenges. Let's make it official and build your digital passport.
                    </p>

                    <button onClick={onComplete} className="w-full md:w-fit px-12 py-5 lg:py-6 bg-purple-600 hover:bg-purple-700 text-white text-[16px] lg:text-[18px] font-black uppercase tracking-widest rounded-full transition-all shadow-xl shadow-purple-600/30 btn-shine btn-text-pop">
                        <span>Yes, I Recorded It</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
