interface StepProps {
    onNext: () => void;
}

export default function Step2Mascot({ onNext }: StepProps) {
    return (
        <div className="flex-1 flex flex-col w-full h-full relative">
            {/* Step Header */}
            <div className="w-full flex justify-center pt-12 pb-0 md:pt-20 md:-mb-16 z-10 relative pointer-events-none">
                <h2 className="text-[14px] md:text-[16px] font-bold text-swago-purple tracking-widest uppercase opacity-60">Journey Progress</h2>
            </div>

            <div className="flex-1 flex flex-col md:flex-row-reverse w-full h-full">
                {/* RIGHT/TOP: Media Plane */}
                <div className="md:w-1/2 flex items-center justify-center md:justify-start p-8 md:pl-12 lg:pl-24 bg-sky-50/50 md:bg-transparent">
                    <div className="w-full max-w-xs md:max-w-sm xl:max-w-md bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-slate-100 p-8 py-4 aspect-square flex flex-col items-center justify-center relative">
                        <div className="flex space-x-3 md:space-x-5 justify-center items-end h-full w-full">
                            <img src="/images/home/five-mascots.jpeg" alt="Mascot" className="w-full h-full rounded-lg object-cover" width={500} height={500} />
                        </div>
                        <p className="mt-4 font-bold tracking-widest uppercase text-slate-300 text-sm">The Mascot Team</p>
                    </div>
                </div>

                {/* LEFT/BOTTOM: Content Plane */}
                <div className="md:w-1/2 flex flex-col justify-center px-8 pt-4 pb-12 md:py-16 md:pr-12 md:pl-24 lg:pl-48 xl:pl-64">
                    <h1 className="text-4xl md:text-5xl lg:text-[64px] font-black text-slate-800 tracking-tight leading-[1.1] mb-6 text-pop">
                        Alright! We will<br />guide <span className="text-swago-teal">you</span>.
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 font-medium mb-12 max-w-sm leading-relaxed text-zoom-in">
                        The Full Mascot Team—Aga, Woo, Gogo, Op, and Skoo—are ready to support your unique learning adventure.
                    </p>

                    <button onClick={onNext} className="w-full md:w-fit px-12 py-5 lg:py-6 bg-purple-600 hover:bg-purple-700 text-white text-[18px] lg:text-[20px] font-bold rounded-2xl transition-all shadow-xl shadow-purple-600/30 btn-shine btn-text-pop flex items-center justify-center gap-3">
                        <span>Next Step</span> <span className="text-3xl leading-none font-light block pb-1">&rarr;</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
