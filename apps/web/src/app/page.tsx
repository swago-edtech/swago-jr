import HeroCarousel from "@/components/HeroCarousel";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import FeaturedProducts from "@/components/FeaturedProducts";
import HowToEarnSwagoMoney from "@/components/HowToEarnSwagoMoney";
import SwagoElementsSection from "@/components/SwagoElementsSection";
import WhySwagoIsFunSection from "@/components/WhySwagoIsFunSection";
import SwagoSkillsSection from "@/components/SwagoSkillsSection";
import HomeBlogSection from "@/components/HomeBlogSection";
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
        <FeaturedProducts />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <HowToEarnSwagoMoney />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <WhySwagoIsFunSection />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <SwagoSkillsSection />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <HomeBlogSection />
      </AnimateOnScroll>
    </div>
  );
}