import HeroSection from "@/components/HeroSection";
import CoreElements from "@/components/CoreElements";
import SWAGO_S from "@/components/SWAGO_S";
import SWAGO_W from "@/components/SWAGO_W";
import SWAGO_A from "@/components/SWAGO_A";
import SWAGO_G from "@/components/SWAGO_G";
import SWAGO_O from "@/components/SWAGO_O";
import SwagoScoreSection from "@/components/SwagoScoreSection";
import WhySwagoIsFunSection from "@/components/WhySwagoIsFunSection";
import AnimateOnScroll from "@/components/AnimateOnScroll";

export default function AboutPage() {
  return (
    <div className="w-full">
      <AnimateOnScroll>
        <HeroSection />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <CoreElements />
      </AnimateOnScroll>

      {/* Character Animations - NO AnimateOnScroll wrapper */}
      <SWAGO_S />
      <SWAGO_W />
      <SWAGO_A />
      <SWAGO_G />
      <SWAGO_O />

      <AnimateOnScroll>
        <SwagoScoreSection />
      </AnimateOnScroll>
      
      <AnimateOnScroll>
        <WhySwagoIsFunSection />
      </AnimateOnScroll>
    </div>
  );
}
