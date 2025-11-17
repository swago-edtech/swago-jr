// apps/web/src/app/kids/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SelectedKidProfile = {
  _id: string;
  name: string;
  age: number;
  avatarColor: string;
};

export default function KidDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<SelectedKidProfile | null>(null);
  const [unlockedContent, setUnlockedContent] = useState([]);

  useEffect(() => {
    // Get selected profile from localStorage
    const storedProfile = localStorage.getItem("selectedKidProfile");
    if (!storedProfile) {
      router.push("/kids");
      return;
    }

    const profileData = JSON.parse(storedProfile);
    setProfile(profileData);
    
    // Fetch unlocked content for this profile
    fetchUnlockedContent(profileData._id);
  }, [router]);

  const fetchUnlockedContent = async (profileId: string) => {
    try {
      const res = await fetch(`/api/kid-profiles/${profileId}`);
      if (res.ok) {
        const data = await res.json();
        setUnlockedContent(data.profile.unlockedProducts || []);
      }
    } catch (error) {
      console.error("Failed to fetch unlocked content:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("selectedKidProfile");
    router.push("/kids");
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-blue-800">Loading your space...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-green-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: profile.avatarColor }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Hi, {profile.name}! 👋
              </h1>
              <p className="text-sm text-gray-600">Age {profile.age}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Switch Profile
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Games Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Games</h2>
            <p className="text-gray-600 mb-4">Play fun educational games!</p>
            <button className="bg-blue-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600">
            Coming Soon!
            </button>
          </div>

          {/* Activities Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Activities</h2>
            <p className="text-gray-600 mb-4">Fun activities and crafts!</p>
            <button className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-600">
              Coming Soon!
            </button>
          </div>

          {/* Unlock Content Card */}
          <Link
            href={`/profile/kids/${profile._id}/unlock`}
            className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform block"
          >
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Unlock Content</h2>
            <p className="text-gray-600 mb-4">Use your product codes!</p>
            <div className="bg-purple-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-600 text-center">
              Enter Code
            </div>
          </Link>

          {/* My Collection Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">My Collection</h2>
            <p className="text-gray-600 mb-4">
              {unlockedContent.length} items unlocked
            </p>
            <button className="bg-orange-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-600">
              View All
            </button>
          </div>

          {/* Learning Path Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Learning Path</h2>
            <p className="text-gray-600 mb-4">Track your progress!</p>
            <button className="bg-pink-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-pink-600">
              Coming Soon!
            </button>
          </div>

          {/* Achievements Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Achievements</h2>
            <p className="text-gray-600 mb-4">Earn badges and rewards!</p>
            <button className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-yellow-600">
              Coming Soon!
            </button>
          </div>
        </div>

        {/* Welcome Banner */}
        <div className="mt-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl shadow-xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Welcome to Your Learning Space!</h2>
          <p className="text-lg mb-6">
            This is your personal dashboard where you can play games, do activities, and learn new things!
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2">
              <span className="font-bold">Tip:</span> Use product codes to unlock more content!
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2">
              <span className="font-bold">Coming Soon:</span> Multiplayer games with friends!
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}