import CoreElements from "@/components/CoreElements";
import FounderMessage from "@/components/FounderMessage";
import AmbassadorCTA from "@/components/AmbassadorCTA";
import AnimateOnScroll from "@/components/AnimateOnScroll";

export default function AboutPage() {
  return (
    <div className="w-full">
      <AnimateOnScroll>
        <FounderMessage />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <CoreElements />
      </AnimateOnScroll>


      <AnimateOnScroll>
        <AmbassadorCTA />
      </AnimateOnScroll>

    
      {/* Copyright Section */}
      <div className="container mx-auto px-4 mt-12 border-t border-slate-200 pt-8 text-center">
        <p className="text-sm text-slate-500">Adi anant - All copyrights reserved 2025</p>
      </div>
      

    </div>
  );
}
