interface StepProps {
    onNext: () => void;
}

export default function Step2Mascot({ onNext }: StepProps) {
    return (
        <div className="flex-1 flex flex-col w-full h-full relative">

            <div className="flex-1 flex flex-col md:flex-row-reverse w-full h-full">
                {/* RIGHT/TOP: Media Plane */}
                <div className="md:w-1/2 flex items-center justify-center md:justify-start p-2 md:pl-12 lg:pl-24 bg-sky-50/50 md:bg-transparent">
                    <div className="flex space-x-3 md:space-x-5 justify-center items-end h-full w-full">
                        <img src="/images/home/five-mascots.png" alt="Mascot" className="w-full h-full rounded-lg object-cover" width={500} height={500} />
                    </div>
                </div>

                {/* LEFT/BOTTOM: Content Plane */}
                <div className="md:w-1/2 flex flex-col justify-center px-8 pt-0 pb-6 md:py-16 md:pr-12 md:pl-24 lg:pl-48 xl:pl-64">
                    <h1 className="text-3xl md:text-5xl lg:text-[64px] font-black text-slate-800 tracking-tight leading-[1.1] mb-2 md:mb-6 text-pop">
                        Alright! We will<br />guide <span className="text-swago-teal">you!</span>
                    </h1>
                    <p className="text-sm text-lg md:text-xl text-slate-500 font-medium mb-6 md:mb-12 max-w-sm leading-relaxed text-zoom-in">
                        Meet the rest of your Swago Guides: Aga, Skoo, Op, and Woo. You're officially on the SWAGO <span className="text-purple-600 font-bold">'Yes I Can' Squad!</span> 🌟
                    </p>

                    <button onClick={onNext} className="w-full md:w-fit px-12 py-5 lg:py-6 bg-purple-600 hover:bg-purple-700 text-white text-[18px] lg:text-[20px] font-bold rounded-2xl transition-all shadow-xl shadow-purple-600/30 btn-shine btn-text-pop flex items-center justify-center gap-3">
                        <span>Tell me the mission</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
