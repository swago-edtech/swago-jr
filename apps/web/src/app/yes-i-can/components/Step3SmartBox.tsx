interface StepProps {
    onNext: () => void;
}

export default function Step3SmartBox({ onNext }: StepProps) {
    return (
        <div className="flex-1 flex flex-col w-full h-full relative">
            {/* Step Header */}
            <div className="w-full flex justify-center pt-12 pb-0 md:pt-20 md:-mb-16 z-10 relative pointer-events-none">
                <h2 className="text-[14px] md:text-[16px] font-bold text-swago-purple tracking-widest uppercase opacity-60">Journey Progress</h2>
            </div>

            <div className="flex-1 flex flex-col md:flex-row w-full h-full">
                {/* LEFT: Media Plane */}
                <div className="md:w-1/2 flex items-center justify-center p-8 bg-slate-50/50 md:bg-transparent">
                    <div className="w-full max-w-sm xl:max-w-md aspect-square bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-center relative overflow-hidden group">
                        <div className="w-64 h-56 bg-slate-800 rounded-3xl flex items-center justify-center shadow-xl relative transform transition duration-500 group-hover:scale-105 border-4 border-slate-700/50">
                            <span className="text-white font-bold opacity-90 letter-pop tracking-widest uppercase">SWAGO Box</span>
                            <div className="absolute top-4 right-4 w-3 h-3 bg-white/20 rounded-full"></div>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Content Plane */}
                <div className="md:w-1/2 flex flex-col justify-center px-8 pt-6 pb-12 md:py-16 md:pr-16 lg:pr-24">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-tight leading-[1.1] mb-6 letter-pop">
                        Go and grab your<br /><span className="text-slate-600">SWAGO Smart Box.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 font-medium mb-12 max-w-sm leading-relaxed text-zoom-in">
                        We're ready to start your interactive experience. Make sure your device is powered and nearby.
                    </p>

                    <button onClick={onNext} className="w-full md:w-fit px-12 py-5 lg:py-6 bg-purple-600 hover:bg-purple-700 text-white text-[15px] lg:text-[16px] font-black uppercase tracking-widest rounded-full transition-all shadow-xl shadow-purple-600/30 btn-shine btn-text-pop">
                        <span>YES, I GOT IT</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
