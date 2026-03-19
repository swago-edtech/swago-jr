// src/app/page.tsx
import HeroCarousel from "@/components/HeroCarousel";
import ChooseYourKit from "@/components/ChooseYourKit";
import SwagoElementsSection from "@/components/SwagoElementsSection";
import CallToAction from "@/components/CallToAction";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import FeaturedProducts from "@/components/FeaturedProducts";
import ShopByPrice from "@/components/ShopByPrice";
import SkillBuildingSystem from "@/components/SkillBuildingSystem";
import Link from "next/link";

import { redirect } from "next/navigation";

export default function Home() {
  if (process.env.BLOG_ONLY_MODE === "true") {
    redirect("/blog/child-brain-quiz");
  }

  return (
    <div className="w-full">
      <AnimateOnScroll>
        <HeroCarousel />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <ChooseYourKit />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <FeaturedProducts />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <ShopByPrice />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <SkillBuildingSystem />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <CallToAction />
      </AnimateOnScroll>
    </div>
  );
}