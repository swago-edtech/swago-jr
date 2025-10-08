import HeroCarousel from "@/components/HeroCarousel";
import ChooseYourKit from "@/components/ChooseYourKit";
import SwagoElementsSection from "@/components/SwagoElementsSection";
import CallToAction from "@/components/CallToAction";
import AnimateOnScroll from "@/components/AnimateOnScroll";
// 1. Import the new component
import FeaturedProducts from "@/components/FeaturedProducts";

export default function Home() {
  return (
    <div className="w-full">
      <AnimateOnScroll className="mb-5">
        <HeroCarousel />
      </AnimateOnScroll>
      
      <AnimateOnScroll className="mb-5">
        <ChooseYourKit />
      </AnimateOnScroll>
      
      {/* 2. Add the new FeaturedProducts section here */}
      <AnimateOnScroll className="mb-5">
        <FeaturedProducts />
      </AnimateOnScroll>
      
      <AnimateOnScroll className="mb-5">
        <SwagoElementsSection />
      </AnimateOnScroll>
      
      <AnimateOnScroll>
        <CallToAction />
      </AnimateOnScroll>
    </div>
  );
}