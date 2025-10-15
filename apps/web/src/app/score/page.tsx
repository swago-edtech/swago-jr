"use client";

import { useSharedContext } from "@/context/SharedContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// --- Dummy Data ---
const dummyData = {
  name: "Aanya",
  age: 8,
  totalPoints: 170,
  badges: [
    { name: "Curiosity", unlocked: true },
    { name: "Explorer", unlocked: true },
    { name: "Builder", unlocked: true },
    { name: "Leader", unlocked: false },
  ],
  journey: [
    { name: "Onboarded", completed: true },
    { name: "First Kit", completed: true },
    { name: "Earned Badge", completed: true },
    { name: "Community Share", completed: false },
    { name: "Swago Core", completed: false },
  ],
};

export default function ScorePage() {
  const { user } = useSharedContext();
  const router = useRouter();

  // Protect the route
  useEffect(() => {
    // A small delay to allow user context to load
    const timer = setTimeout(() => {
      if (user === null) {
        router.push("/login?redirect=/score");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [user, router]);

  // Show a loading state while user is being determined
  if (user === undefined) {
    return <p className="text-center p-10">Loading...</p>;
  }
  
  if (user) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header Section - Stacks on mobile */}
        <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[hsl(var(--swago-pink))] text-white text-3xl font-bold rounded-full flex items-center justify-center flex-shrink-0">
              {dummyData.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{dummyData.name}</h1>
              <p className="text-slate-500">Age {dummyData.age}</p>
            </div>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <p className="text-slate-500">Total Points</p>
            <p className="text-3xl font-bold text-[hsl(var(--swago-purple))]">{dummyData.totalPoints}</p>
          </div>
        </div>

        {/* Main Grid Layout - Stacks on mobile, 3 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h2 className="font-bold mb-4">Digital Badges</h2>
              <div className="flex flex-wrap gap-4">
                {dummyData.badges.map(badge => (
                  <div key={badge.name} className={`text-center ${!badge.unlocked && 'opacity-30'}`}>
                    <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto flex items-center justify-center font-bold text-slate-400 text-2xl">
                      {badge.name.charAt(0)}
                    </div>
                    <p className="text-sm mt-2">{badge.name}</p>
                  </div>
                ))}
              </div>
            </div>
             {/* You can add more cards here like "Cards & Points" */}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="font-bold mb-4">Swago Journey</h2>
            <ul className="space-y-4">
              {dummyData.journey.map(step => (
                <li key={step.name} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${step.completed ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {step.completed ? '✓' : '●'}
                  </div>
                  <span className={`font-medium ${step.completed ? 'text-slate-800' : 'text-slate-400'}`}>{step.name}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    );
  }

  // Fallback for non-logged-in users
  return (
    <div className="text-center p-10">
      <p>Redirecting to login...</p>
    </div>
  );
}