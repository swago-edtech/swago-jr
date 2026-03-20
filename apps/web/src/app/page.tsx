import HeroCarousel from "@/components/HeroCarousel";
import ChooseYourKit from "@/components/ChooseYourKit";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import FeaturedProducts from "@/components/FeaturedProducts";
import ShopByPrice from "@/components/ShopByPrice";
import SkillUnlockSlider from "@/components/SkillUnlockSlider";
import SkillBuildingSystem from "@/components/SkillBuildingSystem";
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
        <ChooseYourKit />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <FeaturedProducts />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <ShopByPrice />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <SkillUnlockSlider />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <SkillBuildingSystem />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <HomeBlogSection />
      </AnimateOnScroll>
    </div>
  );
}