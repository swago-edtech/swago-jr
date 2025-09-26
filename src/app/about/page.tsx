import HeroSection from "@/components/HeroSection";
import CoreElements from "@/components/CoreElements";
import SwagoScoreSection from "@/components/SwagoScoreSection";
import WhySwagoIsFunSection from "@/components/WhySwagoIsFunSection"; // 1. Import

export default function AboutPage() {
  return (
    <div className="w-full">
      <HeroSection />
      <CoreElements />
      <SwagoScoreSection />
      <WhySwagoIsFunSection /> {/* 2. Add to the page */}
    </div>
  );
}