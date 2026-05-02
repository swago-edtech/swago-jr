import { Play, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

interface StepProps {
  onNext: () => void;
}

export default function Step2Mission({ onNext }: StepProps) {
  return (
    <div className="flex-1 flex flex-col w-full relative overflow-x-hidden bg-white px-4 pt-2">
      
      <div className="flex-1 flex flex-col md:flex-row w-full h-full max-w-7xl mx-auto items-center">
        
        {/* 1) TOP SECTION: Shrunken Girl Image & Headline */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center z-20">
          {/* <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative w-full max-w-[160px] sm:max-w-[200px] md:max-w-[320px]"
          >
            <img
              src="/images/home/step-5-smart-box.png"
              alt="Swago Mascot"
              className="w-full h-auto object-contain animate-float"
            />
          </motion.div> */}

          <div className="text-center mt-4 px-2">
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1]">
              Your <span className="text-[hsl(var(--swago-purple))]">Mission:</span>
            </h1>
            <p className="text-slate-500 font-medium mt-2 text-sm md:text-lg">
              Watch this &apos;Yes I Can&apos; video and record yourself doing the same moves. It&apos;s all about grit and focus!
            </p>
          </div>
        </div>

        {/* 2) MIDDLE SECTION: Video Reference & Action Button */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center py-6 md:p-12">
          
          <div className="flex items-center gap-2 mb-4 text-[hsl(var(--swago-purple))] font-bold text-xs uppercase tracking-widest">
            <span className="bg-purple-50 px-3 py-1 rounded-full">Check video for reference</span>
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </div>

          <a 
            href="https://www.instagram.com/reel/DXEt3pziDvm/?igsh=MWo3M2U5MWF2Nm94aQ==" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full"
          >
            <div className="w-full aspect-[16/10] md:aspect-video max-w-[280px] md:max-w-[400px] bg-slate-100 rounded-[2rem] overflow-hidden flex items-center justify-center shadow-xl border-4 border-white relative group cursor-pointer mx-auto">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
              
              <div className="w-12 h-12 bg-[hsl(var(--swago-purple))] rounded-full flex items-center justify-center shadow-lg text-white z-20">
                <Play className="w-5 h-5 ml-1" fill="currentColor" />
              </div>

              <p className="absolute bottom-4 text-white font-bold text-[10px] tracking-widest z-20 uppercase">
                Tap to Watch
              </p>
            </div>
          </a>

          {/* 3) BOTTOM SECTION: Action Button */}
          <div className="w-full mt-8 px-2">
            <button
              onClick={onNext}
              className="w-full md:w-fit md:px-12 py-5 bg-[hsl(var(--swago-purple))] text-white font-black tracking-widest rounded-2xl shadow-xl shadow-purple-900/20 hover:brightness-110 active:scale-95 transition-all btn-shine flex items-center justify-center mx-auto"
            >
              <span>Woohoo, I have recorded the video!</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
