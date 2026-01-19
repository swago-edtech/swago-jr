"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type KidProfile = {
  _id: string;
  name: string;
  age: number;
  avatarColor: string;
};

export default function KidSelectionPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<KidProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch("/api/kid-profiles");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = (profile: KidProfile) => {
    // Direct access - no PIN verification
    localStorage.setItem("selectedKidProfile", JSON.stringify({
      _id: profile._id,
      name: profile.name,
      age: profile.age,
      avatarColor: profile.avatarColor,
    }));
    router.push("/kids/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[hsl(var(--swago-purple))] mx-auto"></div>
          <p className="mt-4 text-lg text-[hsl(var(--swago-purple))]">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="text-8xl mb-6">🎮</div>
          <h1 className="text-3xl font-bold text-[hsl(var(--swago-purple))] mb-4">No Profiles Found</h1>
          <p className="text-gray-600 mb-8">
            Ask your parent to create a kid profile for you!
          </p>
          <Link
            href="/profile/kids/new"
            className="inline-block bg-[hsl(var(--swago-purple))] text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-opacity"
          >
            Create Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-4 flex flex-col items-center justify-center">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <h1 className="text-lg md:text-4xl font-bold text-[hsl(var(--swago-purple))] mb-4">
            Click on your profile to start
          </h1>
        </div>

        {/* Centered Flex Container */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          {profiles.map((profile) => (
            <button
              key={profile._id}
              onClick={() => handleProfileClick(profile)}
              className="group relative transform transition-all duration-300 hover:scale-105 hover:-translate-y-2 w-full md:w-80"
            >
              <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                {/* Avatar with backward compatibility */}
                <div className="w-32 h-32 rounded-full mx-auto mb-6 overflow-hidden bg-gray-100 flex items-center justify-center relative">
                  {profile.avatarColor?.startsWith('#') ? (
                    // OLD DATA: Render colored circle with initial
                    <div
                      className="w-full h-full flex items-center justify-center text-white text-5xl font-bold"
                      style={{ backgroundColor: profile.avatarColor }}
                    >
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    // NEW DATA: Render image
                    <Image
                      src={profile.avatarColor || "/images/swoo.png"}
                      alt={profile.name}
                      width={128}
                      height={128}
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/swoo.png";
                      }}
                    />
                  )}
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {profile.name}
                </h2>

                <p className="text-gray-600 mb-4">
                  Age {profile.age}
                </p>

                <div className="inline-flex items-center gap-2 bg-[hsl(var(--swago-purple))] text-white px-4 py-2 rounded-full text-sm font-medium">
                  <span>Click to Enter</span>
                  <span>→</span>
                </div>
              </div>
            </button>
          ))}

          {/* Add Profile Button */}
          {profiles.length < 2 && (
            <Link
              href="/profile/kids/new"
              className="group relative transform transition-all duration-300 hover:scale-105 hover:-translate-y-2 w-full md:w-80"
            >
              <div className="bg-white border-2 border-dashed border-[hsl(var(--swago-purple))]/30 rounded-3xl shadow-xl p-8 text-center h-full flex flex-col items-center justify-center hover:border-[hsl(var(--swago-purple))] transition-colors min-h-[380px]">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">➕</div>
                <h2 className="text-2xl font-bold text-[hsl(var(--swago-purple))] mb-2">
                  Add Profile
                </h2>
                <p className="text-gray-600">
                  Create a new kid profile
                </p>
              </div>
            </Link>
          )}
        </div>

        {/* Parent Button */}
        <div className="text-center">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 bg-white text-[hsl(var(--swago-purple))] border-2 border-[hsl(var(--swago-purple))] px-6 py-3 rounded-full font-semibold hover:bg-[hsl(var(--swago-purple))] hover:text-white transition-all shadow-md hover:shadow-lg"
          >
            <span>👨‍👩‍👧‍👦</span>
            <span>Parent? Click here to manage profiles</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
