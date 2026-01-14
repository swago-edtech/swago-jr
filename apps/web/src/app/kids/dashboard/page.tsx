"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReelUploadForm from "@/components/ReelUploadForm";
import BrainGymQuiz from "@/components/BrainGymQuiz";
import { motion, AnimatePresence } from "framer-motion";

type SelectedKidProfile = {
  _id: string;
  name: string;
  age: number;
  avatarColor: string; // Now stores image path
};

type AmbassadorData = {
  isAmbassador: boolean;
  status: string;
  swagoMoney: number;
  badges: { name: string; awardedAt: string }[];
  currentStep: number;
  entryChallenge: {
    submitted: boolean;
    status: string;
    reelUrl?: string;
  };
  brainGym: {
    completed: boolean;
  };
};

const badgeEmojis: { [key: string]: string } = {
  "Swago Saviour": "🦸",
  "Entry Master": "🎬",
  "Brain Champion": "🧠",
  "Brand Ambassador": "⭐",
};

export default function KidDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<SelectedKidProfile | null>(null);
  const [ambassadorData, setAmbassadorData] = useState<AmbassadorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReelForm, setShowReelForm] = useState(false);
  const [showBrainGym, setShowBrainGym] = useState(false);

  useEffect(() => {
    const storedProfile = localStorage.getItem("selectedKidProfile");
    if (!storedProfile) {
      router.push("/kids");
      return;
    }

    const profileData = JSON.parse(storedProfile);
    setProfile(profileData);
    
    fetchProfileData(profileData._id);
  }, [router]);

  const fetchProfileData = async (profileId: string) => {
    try {
      const res = await fetch(`/api/kid-profiles/${profileId}`);
      if (res.ok) {
        const data = await res.json();
        setAmbassadorData(data.profile.ambassador || null);
        console.log("🔍 Ambassador Data:", JSON.stringify(data.profile.ambassador, null, 2));
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAmbassador = async () => {
    if (!profile) return;

    try {
      const res = await fetch("/api/ambassador/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidProfileId: profile._id }),
      });

      if (res.ok) {
        const data = await res.json();
        fetchProfileData(profile._id);
        alert(`🎉 Welcome to the Ambassador Program! You earned ${data.swagoMoney} Swago Money and the "${data.badge}" badge!`);
      }
    } catch (error) {
      console.error("Failed to activate ambassador:", error);
    }
  };

  const handleReelSubmitSuccess = () => {
    setShowReelForm(false);
    fetchProfileData(profile!._id);
    alert("🎬 Reel submitted successfully! It's under review.");
  };

  const handleBrainGymComplete = () => {
    setShowBrainGym(false);
    fetchProfileData(profile!._id);
  };

  const handleLogout = () => {
    localStorage.removeItem("selectedKidProfile");
    router.push("/kids");
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-blue-800">Loading your space...</p>
        </div>
      </div>
    );
  }

  const isAmbassador = ambassadorData?.isAmbassador || false;
  const canUploadReel = isAmbassador && ambassadorData?.currentStep === 2 && !ambassadorData?.entryChallenge.submitted;
  const isReelPending = ambassadorData?.entryChallenge.status === "pending";
  const isReelApproved = ambassadorData?.entryChallenge.status === "approved";
  const canPlayBrainGym = isReelApproved && !ambassadorData?.brainGym.completed;

  const currentStep = ambassadorData?.currentStep || 1;
  const steps = [
    { number: 1, label: "Profile Created", status: currentStep >= 1 ? "completed" : "locked" },
    { number: 2, label: "First Ambassador Challenge", status: currentStep === 2 ? "active" : currentStep > 2 ? "completed" : "locked" },
    { number: 3, label: "Brain Gym", status: currentStep === 3 ? "active" : currentStep > 3 ? "completed" : "locked" },
    { number: 4, label: "Brand Ambassador", status: currentStep >= 4 ? "active" : "locked" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-green-100">
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* ========== LEFT SIDEBAR (40%) ========== */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              {/* Avatar & Name with Swago Money on the right */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  {/* ✅ FIXED: Avatar with backward compatibility */}
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center relative flex-shrink-0">
                    {profile.avatarColor?.startsWith('#') ? (
                      // OLD DATA: Render colored circle
                      <div
                        className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                        style={{ backgroundColor: profile.avatarColor }}
                      >
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      // NEW DATA: Render image
                      <Image
                        src={profile.avatarColor || "/images/swoo.png"}
                        alt={profile.name}
                        width={80}
                        height={80}
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/swoo.png";
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      {profile.name} 👋
                    </h1>
                    <p className="text-sm text-gray-600">Age {profile.age}</p>
                  </div>
                </div>
                
                {/* Swago Money on the far right */}
                {isAmbassador && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-lg shadow-sm">
                    <span className="text-2xl">💰</span>
                    <div className="text-right">
                      <p className="text-xs font-medium opacity-90">Swago Money</p>
                      <p className="text-lg font-bold">{ambassadorData?.swagoMoney || 0}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Switch Profile Button */}
              <button
                onClick={handleLogout}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Switch Profile
              </button>
            </motion.div>

            {/* Swago Money Card */}
            {isAmbassador && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-5xl">💰</div>
                  <div>
                    <p className="text-sm font-medium opacity-90">Swago Money</p>
                    <motion.p
                      key={ambassadorData?.swagoMoney}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-4xl font-bold"
                    >
                      {ambassadorData?.swagoMoney || 0}
                    </motion.p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg p-3 text-xs">
                  <p className="font-medium text-orange-100">
                    💡 Use Swago Money for discounts, blind bags &amp; special rewards.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Badges Card */}
            {isAmbassador && ambassadorData?.badges && ambassadorData.badges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🏆</span> Your Badges
                </h3>
                
                <div className="flex flex-wrap gap-3">
                  {ambassadorData.badges.map((badge, index) => (
                    <motion.div
                      key={badge.name}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.1, type: "spring" }}
                      className="relative group"
                    >
                      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-4 flex flex-col items-center gap-2 min-w-[100px] border-2 border-purple-300 hover:border-purple-500 transition-all hover:scale-105 cursor-pointer">
                        <div className="text-3xl">
                          {badgeEmojis[badge.name] || "🎖️"}
                        </div>
                        <p className="text-xs font-bold text-gray-800 text-center">
                          {badge.name}
                        </p>
                      </div>
                      
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Awarded on {new Date(badge.awardedAt).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ========== RIGHT CONTENT AREA (60%) ========== */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Progress Bar */}
            {isAmbassador && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">
                  Your Ambassador Journey
                </h3>
                
                {/* Desktop View - Horizontal */}
                <div className="hidden md:flex items-start justify-between relative">
                  <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 z-0">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>

                  {steps.map((step, index) => (
                    <div key={step.number} className="flex flex-col items-center z-10 relative flex-1">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-3 ${
                          step.status === "completed"
                            ? "bg-green-500 text-white"
                            : step.status === "active"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse"
                            : "bg-gray-300 text-gray-500"
                        }`}
                      >
                        {step.status === "completed" ? "✓" : step.status === "locked" ? "🔒" : step.number}
                      </motion.div>

                      <p
                        className={`text-xs md:text-sm font-medium text-center px-2 min-h-[40px] flex items-center justify-center ${
                          step.status === "locked" ? "text-gray-400" : "text-gray-700"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Mobile View - Vertical */}
                <div className="md:hidden space-y-4">
                  {steps.map((step, index) => (
                    <div key={step.number} className="flex items-start gap-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                          step.status === "completed"
                            ? "bg-green-500 text-white"
                            : step.status === "active"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse"
                            : "bg-gray-300 text-gray-500"
                        }`}
                      >
                        {step.status === "completed" ? "✓" : step.status === "locked" ? "🔒" : step.number}
                      </motion.div>

                      <div className="flex-1 pb-4">
                        <p
                          className={`text-sm font-medium ${
                            step.status === "locked" ? "text-gray-400" : "text-gray-700"
                          }`}
                        >
                          {step.label}
                        </p>
                        {index < steps.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200 ml-5 mt-2">
                            {step.status === "completed" && (
                              <div className="w-full h-full bg-gradient-to-b from-purple-500 to-pink-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Activity Section */}
            {isAmbassador ? (
              <div className="space-y-6">
                {/* Entry Challenge Section */}
                {canUploadReel && !showReelForm && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 text-white text-center"
                  >
                    <div className="text-6xl mb-4">🎬</div>
                    <h2 className="text-3xl font-bold mb-3">
                      Ready for the First Ambassador Challenge?
                    </h2>
                    <p className="text-lg mb-6 opacity-90">
                      Upload your Instagram Reel using the Swago Scarf to unlock the next step!
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button
                        onClick={() => setShowReelForm(true)}
                        className="bg-white text-purple-600 font-bold px-10 py-4 rounded-full hover:bg-gray-100 transition-all text-lg shadow-lg"
                      >
                        Upload Reel Now 🚀
                      </button>
                      
                      <Link
                        href="/ambassador"
                        className="bg-white/20 backdrop-blur-sm border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/30 transition-all text-lg"
                      >
                        Know More
                      </Link>
                    </div>
                  </motion.div>
                )}

                {/* Reel Upload Form */}
                <AnimatePresence>
                  {showReelForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <ReelUploadForm 
                        kidProfileId={profile._id}
                        onSuccess={handleReelSubmitSuccess}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reel Under Review */}
                {isReelPending && (
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-8 text-center">
                    <div className="text-6xl mb-4">⏳</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">
                      Your Reel is Under Review!
                    </h3>
                    <p className="text-gray-600 text-lg">
                      We&apos;re checking your amazing reel. You&apos;ll be notified once it&apos;s approved!
                    </p>
                  </div>
                )}

                {/* Brain Gym Section */}
                {canPlayBrainGym && !showBrainGym && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl shadow-xl p-8 text-white text-center"
                  >
                    <div className="text-6xl mb-4">🧠</div>
                    <h2 className="text-3xl font-bold mb-3">
                      Brain Gym Challenge Unlocked!
                    </h2>
                    <p className="text-lg mb-6 opacity-90">
                      Your reel was approved! Now solve the Brain Gym riddle to earn more Swago Money!
                    </p>
                    <button
                      onClick={() => setShowBrainGym(true)}
                      className="bg-white text-green-600 font-bold px-10 py-4 rounded-full hover:bg-gray-100 transition-all text-lg shadow-lg"
                    >
                      Start Brain Gym 🚀
                    </button>
                  </motion.div>
                )}

                {/* Brain Gym Quiz */}
                <AnimatePresence>
                  {showBrainGym && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <BrainGymQuiz
                        kidProfileId={profile._id}
                        onComplete={handleBrainGymComplete}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Completion Message */}
                {ambassadorData?.brainGym.completed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl shadow-xl p-8 text-white text-center"
                  >
                    <div className="text-7xl mb-4">🎉</div>
                    <h2 className="text-3xl font-bold mb-3">
                      Congratulations, Ambassador!
                    </h2>
                    <p className="text-lg mb-4 opacity-90">
                      You&apos;ve completed all challenges! Check your Swago Money and badges above.
                    </p>
                    <p className="text-sm opacity-75">
                      More challenges coming soon! Stay tuned 🚀
                    </p>
                  </motion.div>
                )}
              </div>
            ) : (
              // Ambassador Program Invitation
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl shadow-2xl p-12 text-white"
              >
                <div className="text-center max-w-2xl mx-auto">
                  <div className="text-8xl mb-6">🌟</div>
                  <h2 className="text-4xl font-bold mb-4">
                    Join the Swago Ambassador Program!
                  </h2>
                  <p className="text-xl mb-8 opacity-90">
                    Become a Swago Ambassador, create content, earn Swago Money, and unlock exclusive rewards!
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={handleActivateAmbassador}
                      className="bg-white text-purple-600 font-bold px-12 py-5 rounded-full text-xl hover:bg-gray-100 transition-all shadow-lg"
                    >
                      Start Ambassador Journey 🚀
                    </button>
                    
                    <Link
                      href="/ambassador"
                      className="bg-white/20 backdrop-blur-sm border-2 border-white text-white font-bold px-10 py-5 rounded-full text-xl hover:bg-white/30 transition-all"
                    >
                      Know More
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
