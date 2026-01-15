import Link from "next/link";
import { HiShieldCheck } from "react-icons/hi2";
import HeroJourneyIntro from "@/components/HeroJourneyIntro";
import JourneyStepsSection from "@/components/JourneyStepsSection";
import EntryChallengeDetails from "@/components/EntryChallengeDetails";
import AmbassadorBenefitsSection from "@/components/AmbassadorBenefitsSection";
import AmbassadorPerksSection from "@/components/AmbassadorPerksSection";

export const metadata = {
  title: "Swago Kid Brand Ambassador Program | Where Kids Believe - Yes, I Can",
  description: "Join the Swago Ambassador Journey - Build confidence, creativity, and skills that AI can't replace through fun challenges and missions",
};

export default function AmbassadorPage() {
  return (
    <div className="min-h-screen bg-white">
 {/* Hero Section */}
<div className="py-2 md:py-10 px-4">
  <div className="container mx-auto text-center">
    <div className="inline-block mb-4 px-4 py-2 bg-purple-100 rounded-full text-sm font-semibold text-purple-700">
      ✨ Limited Spots Available
    </div>
    <h1 className="text-4xl md:text-6xl font-bold mb-6 text-slate-800">
       Swago Kid Ambassador Program
    </h1>
    <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-8">
      A journey where children learn to believe in themselves through real actions
    </p>
    <Link
      href="/ambassador/register"
      className="inline-block btn-shine bg-gradient-to-r from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-pink))] text-white font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all text-lg"
    >
       Create Your Child&apos;s Swago Hero Profile 
    </Link>
  </div>
</div>

      {/* Hero Journey Intro */}
      <HeroJourneyIntro />

      {/* Journey Steps */}
      <JourneyStepsSection />

      {/* Entry Challenge Details */}
      <EntryChallengeDetails />

      {/* What Happens After */}
      <AmbassadorBenefitsSection />

      {/* Ambassador Perks at 500 Swago Money */}
      <AmbassadorPerksSection />

      {/* Safety Section */}
      <div className="container mx-auto px-4 py-5 ">
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-[hsl(var(--swago-teal))]/10 to-[hsl(var(--swago-purple))]/10 p-8 rounded-2xl">
          <div className="flex items-start gap-4">
            
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Safe &amp; Parent-Friendly</h3>
              <ul className="space-y-2 text-slate-600">
                <li>✓ All sessions are <strong>child-safe and moderated</strong></li>
                <li>✓ Parents are kept informed throughout</li>
                <li>✓ No content shared publicly without consent</li>
              </ul>
              <p className="mt-4 text-sm text-slate-500 italic">
                Only a <strong>limited number of kids</strong> are selected each cycle. Applications close once slots are filled.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-4 py-5 max-w-6xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden p-12 text-center bg-gradient-to-r from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-pink))]">
          <div className="flex flex-col items-center text-white">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Ready to Begin?</h2>
            <p className="text-md md:text-xl opacity-90 max-w-2xl mb-6">
              Give your child a place where their voice matters, their effort is valued, and their confidence grows.
            </p>
            <Link
              href="/ambassador/register"
              className="inline-block btn-shine bg-white text-[hsl(var(--swago-purple))] font-bold px-8 py-3 rounded-full shadow-lg hover:opacity-90 transition-opacity text-sm md:text-lg"
            >
               Create Your Child&apos;s Swago Hero Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
