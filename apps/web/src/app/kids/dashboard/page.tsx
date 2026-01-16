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
  avatarColor: string;
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
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showReelSuccessModal, setShowReelSuccessModal] = useState(false);
  const [welcomeData, setWelcomeData] = useState<{ swagoMoney: number; badge: string } | null>(null);

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
        setWelcomeData({ swagoMoney: data.swagoMoney, badge: data.badge });
        setShowWelcomeModal(true);
      }
    } catch (error) {
      console.error("Failed to activate ambassador:", error);
    }
  };

  const handleReelSubmitSuccess = () => {
    setShowReelForm(false);
    fetchProfileData(profile!._id);
    setShowReelSuccessModal(true);
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
        
        {/* ========== MOBILE PROGRESS BAR (Top) ========== */}
        {isAmbassador && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white rounded-2xl shadow-lg p-4 mb-4"
          >
            <h3 className="text-sm font-bold text-gray-800 mb-4 text-center">
              Your Ambassador Journey
            </h3>
            
            {/* Horizontal Progress Bar */}
            <div className="flex items-start justify-between relative">
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0">
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 ${
                      step.status === "completed"
                        ? "bg-green-500 text-white"
                        : step.status === "active"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "bg-gray-300 text-gray-500"
                    }`}
                  >
                    {step.status === "completed" ? "✓" : step.status === "locked" ? "🔒" : step.number}
                  </motion.div>

                  <p className={`text-[10px] leading-tight font-medium text-center px-0.5 min-h-[32px] flex items-center justify-center ${
                    step.status === "locked" ? "text-gray-400" : "text-gray-700"
                  }`}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* ========== LEFT SIDEBAR (40%) ========== */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="flex items-start gap-4">
                  {/* Left: Avatar with Name/Age/Button below */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center relative mb-2">
                      {profile.avatarColor?.startsWith('#') ? (
                        <div
                          className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                          style={{ backgroundColor: profile.avatarColor }}
                        >
                          {profile.name.charAt(0).toUpperCase()}
                        </div>
                      ) : (
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
                    <h1 className="text-base font-bold text-gray-800 text-center mb-1">
                      {profile.name}
                    </h1>
                    <p className="text-xs text-gray-600 mb-2">Age {profile.age}</p>
                    
                    {/* Switch Profile Button - Below Avatar */}
                    <button
                      onClick={handleLogout}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-xs"
                    >
                      Switch Profile
                    </button>
                  </div>

                  {/* Right: Money & Badges */}
                  {isAmbassador && (
                    <div className="flex-1 space-y-3">
                      {/* Swago Money Section */}
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">You earned</p>
                        <button
                          onClick={() => setShowMoneyModal(true)}
                          className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow active:scale-95"
                        >
                          <p className="text-sm font-bold">🪙 {ambassadorData?.swagoMoney || 0} Swago Dollars</p>
                        </button>
                      </div>

                      {/* Badges Section */}
                      {ambassadorData?.badges && ambassadorData.badges.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">You earned</p>
                          <button
                            onClick={() => setShowBadgesModal(true)}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow active:scale-95"
                          >
                            {ambassadorData.badges.map(badge => (
                              <p key={badge.name} className="text-sm font-bold">
                                {badgeEmojis[badge.name] || "🎖️"} {badge.name} Badge
                              </p>
                            ))}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block">
                <div className="flex items-start gap-10">
                  {/* Left Column: Avatar + Button */}
                  <div className="flex-col items-center gap-8 flex-shrink-0">
                    {/* Avatar */}
                    <div className="flex gap-5">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center relative">
                        {profile.avatarColor?.startsWith('#') ? (
                          <div
                            className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                            style={{ backgroundColor: profile.avatarColor }}
                          >
                            {profile.name.charAt(0).toUpperCase()}
                          </div>
                        ) : (
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
                      {/* Middle Column: Name & Age */}
                      <div className="flex flex-col justify-center">
                        <h1 className="text-xl font-bold text-gray-800">
                          {profile.name}
                        </h1>
                        <p className="text-sm text-gray-600">Age {profile.age}</p>
                      </div>
                    </div>
                    <br/>

                    {/* Switch Profile Button - Below Avatar in same column */}
                    <button
                      onClick={handleLogout}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors text-sm"
                    >
                      Switch Profile
                    </button>
                  </div>

                  {/* Right Column: Stats Cards */}
                  {isAmbassador && (
                    <div className="flex-1 space-y-3 ml-auto">
                      {/* Swago Money Section */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">You earned</p>
                        <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-lg shadow-sm text-center">
                          <p className="text-sm font-bold">🪙 {ambassadorData?.swagoMoney || 0} Swago Dollars</p>
                        </div>
                      </div>

                      {/* Badges Section */}
                      {ambassadorData?.badges && ambassadorData.badges.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">You earned</p>
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg shadow-sm text-center">
                            {ambassadorData.badges.map(badge => (
                              <p key={badge.name} className="text-sm font-bold">
                                {badgeEmojis[badge.name] || "🎖️"} {badge.name} Badge
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Swago Money Card (Desktop Only) */}
            {isAmbassador && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="hidden lg:block bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-5xl">💰</div>
                  <div>
                    <p className="text-sm font-medium opacity-90">Swago Dollars</p>
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
                    💡 Use Swago Dollars for discounts, blind bags &amp; special rewards.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Badges Card (Desktop Only) */}
            {isAmbassador && ambassadorData?.badges && ambassadorData.badges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="hidden lg:block bg-white rounded-2xl shadow-lg p-6"
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
                      
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
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
            
            {/* Progress Bar (Desktop Only) */}
            {isAmbassador && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden md:block bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">
                  Your Ambassador Journey
                </h3>
                
                {/* Desktop View - Horizontal */}
                <div className="flex items-start justify-between relative">
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
                    <h2 className="text-lg md:text-3xl font-bold mb-3">
                      Ready for the First Ambassador Challenge?
                    </h2>
                    
                    <div className="flex flex-col sm:flex-col items-center justify-center gap-4">
                      <button
                        onClick={() => setShowReelForm(true)}
                        className="bg-white text-purple-600 font-bold px-5 md:px-10 py-4 mt-5 rounded-full hover:bg-gray-100 transition-all text-md md:text-lg shadow-lg"
                      >
                        Complete the challenge
                      </button>
                      
                      <Link
                        href="/ambassador"
                        className="bg-white/20 backdrop-blur-sm border-2 border-white text-white font-bold px-4 py-2 rounded-full hover:bg-white/30 transition-all text-md"
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
                      Your reel was approved! Now solve the Brain Gym riddle to earn more Swago Dollars!
                    </p>
                    <button
                      onClick={() => setShowBrainGym(true)}
                      className="bg-white text-green-600 font-bold px-10 py-4 rounded-full hover:bg-gray-100 transition-all text-lg shadow-lg"
                    >
                      Start Brain Gym 
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
                      You&apos;ve completed all challenges! Check your Swago Dollars and badges above.
                    </p>
                    <p className="text-sm opacity-75">
                      More challenges coming soon! Stay tuned 
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
                  <h2 className="text-lg md:text-3xl font-bold mb-4">
                    Join the Swago Ambassador Program!
                  </h2>
                  <p className="text-sm md:text-lg mb-8 opacity-90">
                    Become a Swago Ambassador, complete challenges, earn Swago Dollars, and unlock exclusive rewards!
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={handleActivateAmbassador}
                      className="bg-white text-purple-600 font-bold px-5 py-5 rounded-full text-sm md:text-xl hover:bg-gray-100 transition-all shadow-lg"
                    >
                      Start Ambassador Journey 
                    </button>
                    
                    <Link
                      href="/ambassador"
                      className="bg-white/20 backdrop-blur-sm border-2 border-white text-white font-bold px-5 py-3 rounded-full text-xs md:text-lg hover:bg-white/30 transition-all"
                    >
                      Know More
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ========== MODALS ========== */}
        
        {/* Welcome Ambassador Modal */}
        <AnimatePresence>
          {showWelcomeModal && welcomeData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setShowWelcomeModal(false)}
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl p-8 text-white max-w-md w-full text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-7xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold mb-4">
                  Welcome to the Ambassador Program!
                </h2>
                <div className="bg-white/20 backdrop-blur rounded-2xl p-6 mb-6">
                  <p className="text-lg mb-3">You earned:</p>
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <div className="bg-white/30 rounded-lg px-4 py-2">
                      <p className="text-2xl font-bold">🪙 {welcomeData.swagoMoney}</p>
                      <p className="text-xs">Swago Dollars</p>
                    </div>
                  </div>
                  <div className="bg-white/30 rounded-lg px-4 py-3">
                    <p className="text-lg font-bold">{badgeEmojis[welcomeData.badge] || "🎖️"} {welcomeData.badge}</p>
                    <p className="text-xs">Badge Unlocked</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className="bg-white text-purple-600 font-bold px-8 py-3 rounded-full hover:bg-gray-100 transition-all shadow-lg"
                >
                  Awesome! Let&apos;s Go 
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reel Success Modal */}
        <AnimatePresence>
          {showReelSuccessModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setShowReelSuccessModal(false)}
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-7xl mb-4">✅</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Reel Submitted Successfully!
                </h2>
                <p className="text-gray-600 text-lg mb-6">
                  Your reel is now under review. We&apos;ll notify you once it&apos;s approved!
                </p>
                <button
                  onClick={() => setShowReelSuccessModal(false)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-8 py-3 rounded-full hover:opacity-90 transition-all shadow-lg"
                >
                  Got it!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Money Modal */}
        <AnimatePresence>
          {showMoneyModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 md:hidden"
              onClick={() => setShowMoneyModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-2xl p-6 text-white max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">💰 Swago Dollars</h3>
                  <button
                    onClick={() => setShowMoneyModal(false)}
                    className="text-white/80 hover:text-white text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-6xl">💰</div>
                  <div>
                    <p className="text-sm font-medium opacity-90">Your Balance</p>
                    <motion.p
                      key={ambassadorData?.swagoMoney}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-5xl font-bold"
                    >
                      {ambassadorData?.swagoMoney || 0}
                    </motion.p>
                  </div>
                </div>
                
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <p className="font-medium text-orange-100 text-sm">
                    💡 Use Swago Dollars for discounts, blind bags &amp; special rewards.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badges Modal */}
        <AnimatePresence>
          {showBadgesModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 md:hidden"
              onClick={() => setShowBadgesModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span>🏆</span> Your Badges
                  </h3>
                  <button
                    onClick={() => setShowBadgesModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {ambassadorData?.badges?.map((badge, index) => (
                    <motion.div
                      key={badge.name}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.1, type: "spring" }}
                    >
                      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-4 flex flex-col items-center gap-2 border-2 border-purple-300">
                        <div className="text-4xl">
                          {badgeEmojis[badge.name] || "🎖️"}
                        </div>
                        <p className="text-xs font-bold text-gray-800 text-center">
                          {badge.name}
                        </p>
                        <p className="text-xs text-gray-600 text-center">
                          {new Date(badge.awardedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
