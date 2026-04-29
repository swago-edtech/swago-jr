import { Video } from "lucide-react";
import { motion } from "framer-motion";
import { ArrowRight, Trophy } from "lucide-react";

interface StepProps {
    onComplete: () => void;
}

export default function Step5Record({ onComplete }: StepProps) {
    return (
 <div className="flex-1 flex flex-col w-full min-h-screen md:min-h-full relative overflow-x-hidden bg-white px-4 pt-6 md:pt-0">
  <div className="flex-1 flex flex-col md:flex-row w-full h-full max-w-7xl mx-auto items-center">
    
    {/* 1) TOP SECTION: Mascot & Headline */}
    <div className="w-full md:w-1/2 flex flex-col items-center justify-center z-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative w-full max-w-[160px] sm:max-w-[200px] md:max-w-[320px]"
      >
        <img
          src="/images/home/step-one-Photoroom.png" 
          alt="Woo Mascot"
          className="w-full h-auto object-contain animate-float"
        />
      </motion.div>

      <div className="text-center px-2">
        <h1 className="text-3xl md:text-5xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-[1.1]">
          Wohoo! Now you <br />
          can <span className="text-[hsl(var(--swago-purple))]">Claim</span> your reward.
        </h1>
      </div>
    </div>

    {/* 2) BOTTOM SECTION: Instructions & Login Trigger */}
    <div className="w-full md:w-1/2 flex flex-col items-center justify-center py-6 md:p-12">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-4 text-[hsl(var(--swago-purple))] font-bold text-xs uppercase tracking-widest">
          <span className="bg-purple-50 px-4 py-1.5 rounded-full flex items-center gap-2">
            <Trophy className="w-3 h-3" />
            Mission Reward: 15 Swago Dollars
          </span>
        </div>

        <p className="text-slate-500 font-medium text-sm md:text-lg mb-5 leading-relaxed px-4">
          Share your reel link with us so we can verify your mission. Your 15 Swago Dollars will be added to your wallet automatically!
        </p>

        <div className="w-full px-2">
          <button
            onClick={onComplete}
            className="w-full md:w-fit md:px-12 py-5 bg-[hsl(var(--swago-purple))] text-white font-black tracking-widest rounded-2xl shadow-xl shadow-purple-900/20 hover:brightness-110 active:scale-95 transition-all btn-shine flex items-center justify-center gap-3 mx-auto"
          >
            <span>Claim Your 15 Swago Dollars</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <p className="text-[10px] text-slate-400 mt-4 font-bold tracking-tighter">
            You will be asked to login to secure your reward
          </p>
        </div>
      </div>
    </div>

  </div>
</div>
    );
}

