"use client";

import { useState } from 'react';

export default function WaitlistForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const data = {
      kidName: formData.get('waitlistKidName') as string,
      kidAge: parseInt(formData.get('waitlistAge') as string),
      parentEmail: formData.get('waitlistEmail') as string,
      parentPhone: formData.get('waitlistPhone') as string,
    };

    try {
      const response = await fetch('/api/ambassador/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to join waitlist');
      }

      setSuccess(true);
      e.currentTarget.reset();
      
      // Scroll to top to show success message
      setTimeout(() => {
        document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' });
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
      <div id="waitlist-form" className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">You&apos;re on the Waitlist! 🎉</h2>
            <p className="text-lg text-slate-600 mb-6">
              Thank you for your interest in the Swago Kid Ambassador Program. We&apos;ll notify you when applications reopen.
            </p>
            <p className="text-sm text-slate-500">
              We&apos;ll send updates to the email address you provided.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="waitlist-form" className="bg-slate-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-3xl font-bold text-slate-800 mb-2 text-center">Join the Waitlist</h2>
          <p className="text-slate-600 text-center mb-8">Be the first to know when applications reopen</p>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleWaitlistSubmit} className="space-y-6">
            <div>
              <label htmlFor="waitlistKidName" className="block text-sm font-medium text-slate-700 mb-2">Kid&apos;s Full Name *</label>
              <input 
                id="waitlistKidName"
                name="waitlistKidName"
                type="text" 
                required
                disabled={isSubmitting}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-orange))] focus:border-transparent disabled:bg-slate-100"
                placeholder="Enter child's full name"
              />
            </div>

            <div>
              <label htmlFor="waitlistAge" className="block text-sm font-medium text-slate-700 mb-2">Kid&apos;s Age *</label>
              <select 
                id="waitlistAge"
                name="waitlistAge"
                required
                disabled={isSubmitting}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-orange))] focus:border-transparent disabled:bg-slate-100"
              >
                <option value="">Select age</option>
                {[7,8,9,10,11,12,13,14].map(age => (
                  <option key={age} value={age}>{age} years</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="waitlistEmail" className="block text-sm font-medium text-slate-700 mb-2">Parent Email *</label>
              <input 
                id="waitlistEmail"
                name="waitlistEmail"
                type="email" 
                required
                disabled={isSubmitting}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-orange))] focus:border-transparent disabled:bg-slate-100"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="waitlistPhone" className="block text-sm font-medium text-slate-700 mb-2">Parent Phone *</label>
              <input 
                id="waitlistPhone"
                name="waitlistPhone"
                type="tel" 
                required
                disabled={isSubmitting}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-orange))] focus:border-transparent disabled:bg-slate-100"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-shine bg-[hsl(var(--swago-orange))] text-white font-bold py-4 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Joining...' : 'Join Waitlist'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
