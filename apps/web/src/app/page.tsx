// src/app/page.tsx
import HeroCarousel from "@/components/HeroCarousel";
import ChooseYourKit from "@/components/ChooseYourKit";
import SwagoElementsSection from "@/components/SwagoElementsSection";
import CallToAction from "@/components/CallToAction";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import FeaturedProducts from "@/components/FeaturedProducts";
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

      {/* New Kids Zone Section */}
      <AnimateOnScroll className="mb-5">
        <section className="py-16 bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4 text-purple-800">
                🎮 Kids Zone - Fun Learning Portal
              </h2>
              <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
                Kids can access their personalized learning space, play educational games, 
                and unlock content with their Swago product codes!
              </p>
              
              <Link
                href="/kids"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl px-12 py-6 rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all shadow-xl"
              >
                <span className="text-3xl">🚀</span>
                <span>Enter Kids Zone</span>
                <span className="text-3xl">🎮</span>
              </Link>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <div className="bg-white/80 backdrop-blur rounded-xl p-4">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-bold text-sm mb-1">Fun Games</h3>
                  <p className="text-xs text-gray-600">Educational & entertaining</p>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-xl p-4">
                  <div className="text-3xl mb-2">🎨</div>
                  <h3 className="font-bold text-sm mb-1">Activities</h3>
                  <p className="text-xs text-gray-600">Creative learning</p>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-xl p-4">
                  <div className="text-3xl mb-2">🏆</div>
                  <h3 className="font-bold text-sm mb-1">Achievements</h3>
                  <p className="text-xs text-gray-600">Track progress</p>
                </div>
              </div>
            </div>
          </div>
        </section>
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