// src/app/page.tsx
import HeroCarousel from "@/components/HeroCarousel";
import ChooseYourKit from "@/components/ChooseYourKit";
import SwagoElementsSection from "@/components/SwagoElementsSection";
import CallToAction from "@/components/CallToAction";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import FeaturedProducts from "@/components/FeaturedProducts";
import ShopByPrice from "@/components/ShopByPrice";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full">
      <AnimateOnScroll className="mb-5">
        <HeroCarousel />
      </AnimateOnScroll>

      <AnimateOnScroll className="mb-5">
        <ChooseYourKit />
      </AnimateOnScroll>

      <AnimateOnScroll className="mb-5">
        <FeaturedProducts />
      </AnimateOnScroll>

      <AnimateOnScroll className="mb-5">
        <ShopByPrice />
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