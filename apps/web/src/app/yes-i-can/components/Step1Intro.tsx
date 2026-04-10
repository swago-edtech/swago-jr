interface StepProps {
    onNext: () => void;
}

export default function Step1Intro({ onNext }: StepProps) {
    return (
        <div className="flex-1 flex flex-col w-full h-full relative">
            {/* Step Header */}
            <div className="w-full flex justify-center pt-12 pb-0 md:pt-20 md:-mb-16 z-10 relative pointer-events-none">
                <h2 className="text-[14px] md:text-[16px] font-bold text-swago-purple tracking-widest uppercase opacity-60">Journey Progress</h2>
            </div>

            <div className="flex-1 flex flex-col md:flex-row w-full h-full">
                {/* LEFT: Media Plane */}
                <div className="md:w-1/2 flex items-center justify-center md:justify-end p-8 md:pr-12 lg:pr-24 bg-orange-50/50 md:bg-transparent">
                    <div className="relative w-64 h-64 md:w-full md:max-w-md aspect-square bg-white rounded-full shadow-2xl shadow-orange-100 border-8 border-orange-50 flex items-center justify-center">
                        <span className="text-orange-400 font-bold text-2xl letter-pop">Orange Mascot</span>
                    </div>
                </div>

                {/* RIGHT: Content Plane */}
                <div className="md:w-1/2 flex flex-col justify-center px-8 pt-6 pb-12 md:py-16 md:pl-12 md:pr-24 lg:pr-48 xl:pr-64">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-tight leading-[1.1] mb-6 letter-pop">
                        Hey <span className="text-purple-600">smart kid</span>,<br />
                        wondering what<br />you have to do here?
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 font-medium mb-12 max-w-md leading-relaxed text-zoom-in">
                        Get ready to embark on an interactive video learning experience like never before.
                    </p>

                    <button onClick={onNext} className="w-full md:w-fit px-10 py-5 lg:py-6 bg-purple-600 hover:bg-purple-700 text-white text-[15px] lg:text-[17px] font-black uppercase tracking-widest rounded-full transition-transform shadow-xl shadow-purple-600/30 btn-shine btn-text-pop">
                        <span>YES, I'M READY TO EXPLORE</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
