import HeroCarousel from "@/components/HeroCarousel";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import FeaturedProducts from "@/components/FeaturedProducts";
import HowToEarnSwagoMoney from "@/components/HowToEarnSwagoMoney";
import HomePopup from "@/components/HomePopup";
import SwagoElementsSection from "@/components/SwagoElementsSection";
import WhySwagoIsFunSection from "@/components/WhySwagoIsFunSection";
import SkillUnlockSlider from "@/components/SkillUnlockSlider";
// import SkillBuildingSystem from "@/components/SkillBuildingSystem";
import HomeBlogSection from "@/components/HomeBlogSection";
import ReviewsSection from "@/components/ReviewsSection";
import Link from "next/link";
import { connectDB, Review } from "@swago/database";

import { redirect } from "next/navigation";

export default async function Home() {
  if (process.env.BLOG_ONLY_MODE === "true") {
    redirect("/blog/child-brain-quiz");
  }

  await connectDB();
  
  // Fetch up to 10 approved positive reviews
  const rawReviews = await Review.find({ 
    status: "approved", 
    rating: { $gte: 4 } 
  })
    .populate("userId", "name address")
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const fetchedReviews = rawReviews.map(r => ({
    id: r._id?.toString(),
    date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : "",
    text: r.comment,
    name: r.userId?.name || "Verified Buyer",
    role: r.userId?.address || "Customer",
    rating: r.rating,
  }));

  return (
    <div className="w-full">
      <HomePopup />
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
        <SkillUnlockSlider />
      </AnimateOnScroll>

      {/* <AnimateOnScroll>
        <SkillBuildingSystem />
      </AnimateOnScroll> */}

      <AnimateOnScroll>
        <ReviewsSection initialReviews={fetchedReviews} />
      </AnimateOnScroll>

      <AnimateOnScroll>
        <HomeBlogSection />
      </AnimateOnScroll>
    </div>
  );
}