"use client";

import { useState } from 'react';
import { HiShieldCheck } from 'react-icons/hi2';
import ApplicationForm from './ApplicationForm';
import WaitlistForm from './WaitlistForm';
import AmbassadorBenefitsSection from '@/components/AmbassadorBenefitsSection';
import AmbassadorHowToApplySection from '@/components/AmbassadorHowToApplySection';
import AmbassadorEligibilitySection from '@/components/AmbassadorEligibilitySection';

export default function AmbassadorPage() {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);

  const handleApplyNow = () => {
    setShowApplicationForm(true);
    setShowWaitlistForm(false);
    setTimeout(() => {
      document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleJoinWaitlist = () => {
    setShowWaitlistForm(true);
    setShowApplicationForm(false);
    setTimeout(() => {
      document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-pink))] text-white py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-white/20 rounded-full text-sm font-semibold backdrop-blur-sm">
            ✨ Limited Spots Available
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            🌟 Swago Kid Ambassador Program
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto mb-8">
            Become the face of Swago and co-create learning experiences that AI can&apos;t replace
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleApplyNow}
              className="btn-shine bg-white text-[hsl(var(--swago-purple))] font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              👉 Apply Now
            </button>
            <button
              onClick={handleJoinWaitlist}
              className="btn-shine bg-[hsl(var(--swago-orange))] text-white font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              Join the Waitlist
            </button>
          </div>
        </div>
      </div>

      {/* What is Swago Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">What is Swago?</h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-4">
            <strong className="text-slate-800">Swago is a smart-box learning platform for kids, where learning becomes game time.</strong>
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            Through <strong>gamified physical smart boxes and Brain Gym challenges</strong>, Swago builds human skills that <strong>schools don&apos;t teach and AI can&apos;t replace</strong>. Swago helps kids think better, express freely, and discover their unique superpowers.
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <AmbassadorBenefitsSection />

      {/* How to Apply Section */}
      <AmbassadorHowToApplySection />

      {/* Eligibility & Details Section */}
      <AmbassadorEligibilitySection />

      {/* Safety Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-[hsl(var(--swago-teal))]/10 to-[hsl(var(--swago-purple))]/10 p-8 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="text-[hsl(var(--swago-purple))]">
              <HiShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Safe & Parent-Friendly</h3>
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

      {/* Application Form */}
      {showApplicationForm && <ApplicationForm />}

      {/* Waitlist Form */}
      {showWaitlistForm && <WaitlistForm />}

      {/* Final CTA */}
      <div className="container mx-auto px-4 py-16">
        <div className="relative rounded-2xl overflow-hidden p-12 text-center bg-gradient-to-r from-[hsl(var(--swago-purple))] to-[hsl(var(--swago-pink))]">
          <div className="flex flex-col items-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">🚀 Ready to Apply?</h2>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mb-6">
              Become part of the Swago Kid Ambassador Program and let your child create, lead, and shine.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleApplyNow}
                className="btn-shine bg-white text-[hsl(var(--swago-purple))] font-bold px-8 py-3 rounded-full shadow-lg hover:opacity-90 transition-opacity"
              >
                👉 Apply Now
              </button>
              <button
                onClick={handleJoinWaitlist}
                className="btn-shine bg-[hsl(var(--swago-orange))] text-white font-bold px-8 py-3 rounded-full shadow-lg hover:opacity-90 transition-opacity"
              >
                Join the Waitlist
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
