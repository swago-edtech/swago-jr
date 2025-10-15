import HeroSection from "@/components/HeroSection";
import CoreElements from "@/components/CoreElements";
import SwagoScoreSection from "@/components/SwagoScoreSection";
import WhySwagoIsFunSection from "@/components/WhySwagoIsFunSection";
// 1. Import the animation component we already built
import AnimateOnScroll from "@/components/AnimateOnScroll";

export default function AboutPage() {
  return (
    <div className="w-full">
      {/* 2. Wrap each section with the AnimateOnScroll component */}
      <AnimateOnScroll>
        <HeroSection />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <CoreElements />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <SwagoScoreSection />
      </AnimateOnScroll>
      
      <AnimateOnScroll>
        <WhySwagoIsFunSection />
      </AnimateOnScroll>
    </div>
  );
}