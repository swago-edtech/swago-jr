import HeroCarousel from "@/components/HeroCarousel";
import ChooseYourKit from "@/components/ChooseYourKit";
import SwagoElementsSection from "@/components/SwagoElementsSection"; // 1. Import
import CallToAction from "@/components/CallToAction";

export default function Home() {
  return (
    <div className="w-full space-y-16">
      <HeroCarousel />
      <ChooseYourKit />
      <SwagoElementsSection /> {/* 2. Add the new section */}
      <CallToAction />
    </div>
  );
}