import { Play } from "lucide-react";

interface StepProps {
    onNext: () => void;
}

export default function Step4FaceAlign({ onNext }: StepProps) {
    return (
        <div className="flex-1 flex flex-col w-full min-h-screen md:min-h-full relative overflow-y-auto md:overflow-hidden pb-0 md:pb-0 pt-0 lg:pt-0">
            <div className="flex-1 flex flex-col-reverse md:flex-row-reverse w-full h-full max-w-7xl mx-auto gap-4 md:gap-0">
                {/* RIGHT: Media Plane */}
                <div className="md:w-1/2 flex flex-col items-center justify-start md:justify-center md:items-start p-4 sm:p-6 md:px-8 pt-0 pb-6 md:py-0 md:pl-12 lg:pl-16 xl:pl-24 bg-transparent shrink-0">
                    <div className="w-full max-w-sm sm:max-w-md md:max-w-lg aspect-[4/3] lg:aspect-video bg-slate-200 rounded-[2rem] overflow-hidden flex items-center justify-center shadow-inner border-2 border-white relative group cursor-pointer hover:shadow-purple-500/20 transition-all mx-auto md:mx-0">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
                        <p className="absolute bottom-4 left-6 text-white font-medium opacity-90 z-20 transition-transform group-hover:translate-x-2 duration-300">
                            Click to play tutorial
                        </p>
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-purple-600 rounded-full flex items-center justify-center shadow-xl shadow-purple-600/50 text-white cursor-pointer z-20 text-pop-bounce relative">
                            <div className="absolute inset-0 flex items-center justify-center pl-1 md:pl-1.5">
                                <Play className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* LEFT: Content Plane */}
                <div className="md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left justify-start md:justify-center px-6 sm:px-8 pt-0 pb-4 md:py-0 md:pr-8 md:pl-8 lg:pl-10 xl:pl-12">
                    <div className="w-32 h-[142px] sm:w-36 sm:h-[162px] md:w-40 md:h-[182px] lg:w-48 lg:h-[220px] rounded-[50%] overflow-hidden border-[4px] border-[#fde8e8] shadow-lg shadow-slate-200/50 mb-6 bg-slate-100 shrink-0 mx-auto md:mb-6">
                        <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&q=80"
                            alt="Face alignment guide tutorial"
                            className="w-full h-full object-cover object-center"
                        />
                    </div>

                    <h1 className="text-[32px] sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-tight font-normal leading-[1.15] mb-4 md:mb-6 letter-pop max-w-[340px] md:max-w-none mx-auto md:mx-0">
                        Pop your face
                        in the <span className="font-medium">center</span> and groove on{" "}
                        <span className="text-purple-500 font-medium">“Yes I can”</span>{" "}
                        song.
                    </h1>
                    <p className="text-base sm:text-lg text-slate-500 font-medium mb-8 max-w-[300px] md:max-w-sm md:hidden mx-auto">
                        Check below video for reference.
                    </p>

                    <button
                        onClick={onNext}
                        className="w-full max-w-[320px] md:w-fit px-10 md:px-12 py-[18px] md:py-5 lg:py-6 bg-purple-600 hover:bg-purple-700 text-white text-[16px] lg:text-[18px] font-bold rounded-2xl transition-all shadow-xl shadow-purple-600/30 mx-auto md:mx-0 btn-shine btn-text-pop"
                    >
                        <span>Link Your Yes, I can Video</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
