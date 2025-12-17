"use client";

import { useState } from 'react';

export default function ApplicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleApplicationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const data = {
      kidName: formData.get('kidName') as string,
      kidAge: parseInt(formData.get('kidAge') as string),
      city: formData.get('city') as string,
      parentName: formData.get('parentName') as string,
      parentPhone: formData.get('parentPhone') as string,
      parentEmail: formData.get('parentEmail') as string,
      whyJoin: formData.get('whyJoin') as string || undefined,
      consentGiven: formData.get('consent') === 'on',
    };

    try {
      const response = await fetch('/api/ambassador/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application');
      }

      setSuccess(true);
      e.currentTarget.reset();
      
      // Scroll to top to show success message
      setTimeout(() => {
        document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div id="application-form" className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Application Submitted! 🎉</h2>
            <p className="text-lg text-slate-600 mb-6">
              Thank you for applying to the Swago Kid Ambassador Program. We&apos;ve received your application and will review it soon.
            </p>
            <p className="text-sm text-slate-500">
              We&apos;ll contact you via email at the address you provided.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="application-form" className="bg-slate-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-3xl font-bold text-slate-800 mb-2 text-center">Apply Now</h2>
          <p className="text-slate-600 text-center mb-8">Fill out the form below to apply for the Swago Kid Ambassador Program</p>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleApplicationSubmit} className="space-y-6">
            {/* Kid's Name */}
            <div>
              <label htmlFor="kidName" className="block text-sm font-medium text-slate-700 mb-2">Kid&apos;s Full Name *</label>
              <input 
                id="kidName"
                name="kidName"
                type="text" 
                required
                disabled={isSubmitting}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent disabled:bg-slate-100"
                placeholder="Enter child's full name"
              />
            </div>

            {/* Age & City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="kidAge" className="block text-sm font-medium text-slate-700 mb-2">Kid&apos;s Age *</label>
                <select 
                  id="kidAge"
                  name="kidAge"
                  required
                  disabled={isSubmitting}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent disabled:bg-slate-100"
                >
                  <option value="">Select age</option>
                  {[7,8,9,10,11,12,13,14].map(age => (
                    <option key={age} value={age}>{age} years</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">City *</label>
                <input 
                  id="city"
                  name="city"
                  type="text" 
                  required
                  disabled={isSubmitting}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent disabled:bg-slate-100"
                  placeholder="Enter city"
                />
              </div>
            </div>

            {/* Parent Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="parentName" className="block text-sm font-medium text-slate-700 mb-2">Parent/Guardian Name *</label>
                <input 
                  id="parentName"
                  name="parentName"
                  type="text" 
                  required
                  disabled={isSubmitting}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent disabled:bg-slate-100"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="parentPhone" className="block text-sm font-medium text-slate-700 mb-2">Parent Phone *</label>
                <input 
                  id="parentPhone"
                  name="parentPhone"
                  type="tel" 
                  required
                  disabled={isSubmitting}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent disabled:bg-slate-100"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>

            <div>
              <label htmlFor="parentEmail" className="block text-sm font-medium text-slate-700 mb-2">Parent Email *</label>
              <input 
                id="parentEmail"
                name="parentEmail"
                type="email" 
                required
                disabled={isSubmitting}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent disabled:bg-slate-100"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Why Join */}
            <div>
              <label htmlFor="whyJoin" className="block text-sm font-medium text-slate-700 mb-2">Why do you want to join? (Optional)</label>
              <textarea 
                id="whyJoin"
                name="whyJoin"
                rows={4}
                disabled={isSubmitting}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent resize-none disabled:bg-slate-100"
                placeholder="Tell us why your child wants to be a Swago Ambassador..."
              ></textarea>
            </div>

            {/* Consent */}
            <div className="flex items-start gap-3">
              <input 
                id="consent"
                name="consent"
                type="checkbox" 
                required
                disabled={isSubmitting}
                className="mt-1 w-4 h-4 text-[hsl(var(--swago-purple))] border-slate-300 rounded focus:ring-[hsl(var(--swago-purple))] disabled:bg-slate-100"
              />
              <label htmlFor="consent" className="text-sm text-slate-600">
                I consent to my child&apos;s participation and understand that all sessions are child-safe and moderated. I agree to Swago&apos;s terms and privacy policy. *
              </label>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-shine bg-[hsl(var(--swago-purple))] text-white font-bold py-4 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
