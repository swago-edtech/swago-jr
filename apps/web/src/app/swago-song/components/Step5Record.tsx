import { Video } from "lucide-react";

interface StepProps {
    onComplete: () => void;
}

export default function Step5Record({ onComplete }: StepProps) {
    return (
        <div className="flex-1 flex flex-col w-full min-h-screen md:min-h-full relative overflow-y-auto md:overflow-hidden pb-0 md:pb-0 pt-0 lg:pt-0">
            <div className="flex-1 flex flex-col md:flex-row w-full h-full max-w-7xl mx-auto gap-4 md:gap-0">
                {/* LEFT: Media Plane */}
                <div className="md:w-1/2 flex items-center justify-center md:justify-start p-4 sm:p-6 md:px-8 pt-0 pb-6 md:py-0 md:pl-12 lg:pl-24 bg-transparent shrink-0">
                    <div className="flex justify-center items-center h-full w-full max-w-sm sm:max-w-md md:max-w-full mx-auto md:mx-0">
                        <img src="/images/home/step-one-Photoroom.png" alt="Mascot Gogo" className="w-full h-auto rounded-lg object-contain md:object-cover max-h-[40vh] md:max-h-none" />
                    </div>
                </div>

                {/* RIGHT: Content Plane */}
                <div className="md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left justify-start md:justify-center px-6 sm:px-8 pt-0 pb-4 md:py-0 md:pl-12 md:pr-6 lg:pr-10 xl:pr-12">
                    <h1 className="text-4xl md:text-5xl lg:text-[64px] font-black text-slate-800 tracking-tight leading-[1.1] mb-4 md:mb-6 text-pop max-w-[340px] md:max-w-none mx-auto md:mx-0">
                        Now record your<br className="hidden md:block" /> best <span className="text-purple-600 font-bold">'Yes, I Can'</span><br className="hidden md:block" /> moves.
                    </h1>
                    <p className="text-base md:text-lg lg:text-xl text-slate-500 font-medium mb-8 max-w-[300px] md:max-w-md leading-relaxed text-zoom-in mx-auto md:mx-0">
                        🕺 Link your Reel below so we can verify your mission and 20 Swago Dollars will be added to your wallet.
                    </p>

                    <button onClick={onComplete} className="w-full max-w-[320px] md:w-fit px-10 py-[18px] lg:py-6 bg-purple-600 hover:bg-purple-700 text-white text-[16px] lg:text-[18px] font-bold uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-purple-600/30 btn-shine btn-text-pop flex items-center justify-center gap-3 md:gap-4 mx-auto md:mx-0">
                        <Video className="w-6 h-6 lg:w-7 lg:h-7 animate-pulse" fill="currentColor" /> <span className="leading-tight">Claim your 20 Swago dollars</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
