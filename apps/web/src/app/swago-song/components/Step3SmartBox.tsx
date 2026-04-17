interface StepProps {
    onNext: () => void;
}

export default function Step3SmartBox({ onNext }: StepProps) {
    return (
        <div className="flex-1 flex flex-col w-full h-full relative">


            <div className="flex-1 flex flex-col md:flex-row w-full h-full">
                {/* LEFT: Media Plane */}
                <div className="md:w-1/2 flex items-center justify-center md:justify-end p-4 md:pr-12 lg:pr-24 bg-slate-50/50 md:bg-transparent">
                    <div className="w-full aspect-square relative overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
                        <img
                            src="/images/smart-box.jpeg"
                            alt="Swago Smart Box"
                            className="w-full h-full object-cover max-w-[500px] max-h-[600px] mx-auto"
                        />
                    </div>
                </div>

                {/* RIGHT: Content Plane */}
                <div className="md:w-1/2 flex flex-col justify-center px-8 pt-6 pb-2 md:py-16 md:pl-12 md:pr-24 lg:pr-48 xl:pr-64">
                    <h1 className="text-4xl md:text-5xl lg:text-[64px] font-black text-slate-800 tracking-tight leading-[1.1] mb-8 md:mb-6 letter-pop">
                        Go get your <br /><span className="text-purple-600">SWAGO Smart Box.</span>
                    </h1>

                    <button onClick={onNext} className="w-full md:w-fit px-12 py-5 lg:py-6 bg-purple-600 hover:bg-purple-700 text-white text-[16px] lg:text-[18px] font-bold uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-purple-600/30 btn-shine btn-text-pop">
                        <span>Yes, I Got It</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
