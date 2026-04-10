import { Play } from "lucide-react";

interface StepProps {
    onNext: () => void;
}

export default function Step4FaceAlign({ onNext }: StepProps) {
    return (
        <div className="flex-1 flex flex-col w-full h-full relative">
            {/* Step Header */}
            <div className="w-full flex justify-center pt-12 pb-0 md:pt-20 md:-mb-16 z-10 relative pointer-events-none">
                <h2 className="text-[14px] md:text-[16px] font-bold text-swago-purple tracking-widest uppercase opacity-60">Journey Progress</h2>
            </div>

            <div className="flex-1 flex flex-col md:flex-row-reverse w-full h-full">
                {/* RIGHT: Media Plane */}
                <div className="md:w-1/2 flex flex-col items-center justify-center p-8 bg-slate-50/50 md:bg-transparent">
                    <div className="w-full max-w-lg aspect-[4/3] lg:aspect-video bg-slate-200 rounded-[2.5rem] overflow-hidden flex items-center justify-center shadow-inner border-2 border-white relative group cursor-pointer hover:shadow-purple-500/20 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
                        <p className="absolute bottom-6 left-8 text-white font-medium opacity-90 z-20 transition-transform group-hover:translate-x-2 duration-300">Click to play tutorial</p>
                        <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center shadow-xl shadow-purple-600/50 text-white pl-2 cursor-pointer z-20 text-pop-bounce">
                            <Play className="w-10 h-10" fill="currentColor" />
                        </div>
                    </div>
                </div>

                {/* LEFT: Content Plane */}
                <div className="md:w-1/2 flex flex-col justify-center px-8 pt-4 pb-12 md:py-16 md:pl-16 lg:pl-24">
                    <div className="w-28 h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-[6px] border-white shadow-xl shadow-slate-200/50 mb-8 bg-slate-100 flex items-end justify-center">
                        <div className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-slate-300 rounded-t-full mt-4"></div>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-tight leading-[1.1] mb-6 letter-pop">
                        Pop your face<br />in the <span className="text-swago-orange">center</span>.
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 font-medium mb-12 max-w-md hidden md:block">
                        Check the video for reference to ensure your face is perfectly aligned in the frame.
                    </p>
                    <p className="text-lg text-slate-500 font-medium mb-10 max-w-sm md:hidden">
                        Check the video for reference.
                    </p>

                    <button onClick={onNext} className="w-full md:w-fit px-12 py-5 lg:py-6 bg-purple-600 hover:bg-purple-700 text-white text-[16px] lg:text-[18px] font-bold rounded-2xl transition-all shadow-xl shadow-purple-600/30 btn-shine btn-text-pop">
                        <span>I'm Ready</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
