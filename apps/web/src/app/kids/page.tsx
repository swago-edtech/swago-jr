// apps/web/src/app/kids/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type KidProfile = {
  _id: string;
  name: string;
  age: number;
  avatarColor: string;
  hasPin: boolean;
  isLocked: boolean;
};

export default function KidSelectionPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<KidProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<KidProfile | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinHint, setPinHint] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [verifying, setVerifying] = useState(false);

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
    if (profile.isLocked) {
      setPinError("This profile is temporarily locked. Please ask a parent for help.");
      return;
    }
    
    // If no PIN is set, go directly to dashboard
    if (!profile.hasPin) {
      localStorage.setItem("selectedKidProfile", JSON.stringify({
        _id: profile._id,
        name: profile.name,
        age: profile.age,
        avatarColor: profile.avatarColor,
      }));
      router.push("/kids/dashboard");
      return;
    }
    
    // Otherwise show PIN entry screen
    setSelectedProfile(profile);
    setPin("");
    setPinError("");
    setPinHint("");
    setAttemptsLeft(5);
  };
  const handlePinSubmit = async () => {
    if (!selectedProfile) return;
    
    // Check if PIN is required
    if (!selectedProfile.hasPin) {
      // No PIN required, proceed directly
      localStorage.setItem("selectedKidProfile", JSON.stringify({
        _id: selectedProfile._id,
        name: selectedProfile.name,
        age: selectedProfile.age,
        avatarColor: selectedProfile.avatarColor,
      }));
      router.push("/kids/dashboard");
      return;
    }

    if (pin.length !== 4) {
      setPinError("Please enter a 4-digit PIN");
      return;
    }

    setVerifying(true);
    setPinError("");

    try {
      const res = await fetch(`/api/kid-profiles/${selectedProfile._id}/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (res.ok) {
        // Success! Store profile and redirect
        localStorage.setItem("selectedKidProfile", JSON.stringify(data.profile));
        router.push("/kids/dashboard");
      } else {
        setPinError(data.error || "Incorrect PIN");
        setAttemptsLeft(data.attemptsLeft || 0);
        
        if (data.hint) {
          setPinHint(data.hint);
        }
        
        if (data.locked) {
          // Profile is now locked
          setProfiles(prev => prev.map(p => 
            p._id === selectedProfile._id 
              ? { ...p, isLocked: true }
              : p
          ));
          setSelectedProfile(null);
        }
        
        setPin("");
      }
    } catch (error) {
      console.error("PIN verification error:", error);
      setPinError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setPinError("");
    }
  };

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handlePinClear = () => {
    setPin("");
    setPinError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-lg text-purple-800">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="text-8xl mb-6">🎮</div>
          <h1 className="text-3xl font-bold text-purple-800 mb-4">No Profiles Found</h1>
          <p className="text-gray-600 mb-8">
            Ask your parent to create a kid profile for you!
          </p>
          <Link
            href="/"
            className="inline-block bg-purple-600 text-white px-8 py-3 rounded-full font-bold hover:bg-purple-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-4">
      {!selectedProfile ? (
        // Profile Selection Screen
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 pt-8">
            <h1 className="text-5xl font-bold text-purple-800 mb-4">
              Who&apos;s Playing? 🎮
            </h1>
            <p className="text-xl text-purple-600">
             Click on your profile to start
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {profiles.map((profile) => (
              <button
                key={profile._id}
                onClick={() => handleProfileClick(profile)}
                disabled={profile.isLocked}
                className={`group relative transform transition-all duration-300 ${
                  profile.isLocked 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-105 hover:-translate-y-2'
                }`}
              >
                <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                  {/* Lock indicator */}
                  {profile.isLocked && (
                    <div className="absolute top-4 right-4 text-2xl">🔒</div>
                  )}
                  
                  {/* Avatar */}
                  <div
                    className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-5xl font-bold shadow-lg"
                    style={{ backgroundColor: profile.avatarColor }}
                  >
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Name */}
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {profile.name}
                  </h2>
                  
                  {/* Age */}
                  <p className="text-gray-600 mb-4">
                    Age {profile.age}
                  </p>
                  
                  {/* PIN indicator */}
                  {profile.hasPin && !profile.isLocked && (
                    <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                      <span>🔐</span>
                      <span>PIN Protected</span>
                    </div>
                  )}
                  
                  {profile.isLocked && (
                    <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                      <span>Locked</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Parent Access Link */}
          <div className="text-center mt-12">
            <Link
              href="/profile"
              className="text-purple-600 hover:text-purple-800 underline"
            >
              Parent? Click here to manage profiles
            </Link>
          </div>

          {/* Error message for locked profiles */}
          {pinError && !selectedProfile && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
              {pinError}
            </div>
          )}
        </div>
      ) : (
        // PIN Entry Screen
        <div className="max-w-md mx-auto pt-12">
          <button
            onClick={() => {
              setSelectedProfile(null);
              setPin("");
              setPinError("");
              setPinHint("");
            }}
            className="mb-8 text-purple-600 hover:text-purple-800 flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to profiles</span>
          </button>

          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {/* Profile Info */}
            <div className="text-center mb-8">
              <div
                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold"
                style={{ backgroundColor: selectedProfile.avatarColor }}
              >
                {selectedProfile.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Welcome back, {selectedProfile.name}!
              </h2>
              {selectedProfile.hasPin ? (
                <p className="text-gray-600 mt-2">Enter your secret PIN</p>
              ) : (
                <p className="text-gray-600 mt-2">Click continue to start playing!</p>
              )}
            </div>

            {selectedProfile.hasPin ? (
              <>
                {/* PIN Display */}
                <div className="mb-6">
                  <div className="flex justify-center gap-3 mb-4">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`w-14 h-14 border-2 rounded-lg flex items-center justify-center text-2xl font-bold ${
                          pin.length > index
                            ? "border-purple-600 bg-purple-50"
                            : "border-gray-300"
                        }`}
                      >
                        {pin[index] ? "•" : ""}
                      </div>
                    ))}
                  </div>

                  {/* Attempts indicator */}
                  {attemptsLeft < 5 && attemptsLeft > 0 && (
                    <p className="text-center text-sm text-orange-600">
                      {attemptsLeft} attempts remaining
                    </p>
                  )}

                  {/* Hint display */}
                  {pinHint && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Hint:</strong> {pinHint}
                      </p>
                    </div>
                  )}

                  {/* Error message */}
                  {pinError && (
                    <div className="bg-red-50 text-red-600 text-center p-3 rounded-lg mt-4">
                      {pinError}
                    </div>
                  )}
                </div>

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <button
                      key={digit}
                      onClick={() => handlePinInput(digit.toString())}
                      disabled={verifying}
                      className="bg-purple-100 hover:bg-purple-200 text-purple-800 text-2xl font-bold py-4 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    onClick={handlePinClear}
                    disabled={verifying}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium py-4 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => handlePinInput("0")}
                    disabled={verifying}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-800 text-2xl font-bold py-4 rounded-xl transition-colors disabled:opacity-50"
                  >
                    0
                  </button>
                  <button
                    onClick={handlePinDelete}
                    disabled={verifying}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium py-4 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handlePinSubmit}
                  disabled={pin.length !== 4 || verifying}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {verifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    "Enter Room 🚀"
                  )}
                </button>
              </>
            ) : (
              // No PIN required - direct continue button
              <button
                onClick={handlePinSubmit}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Continue to Dashboard 🚀
              </button>
            )}

            {/* Forgot PIN link */}
            {selectedProfile.hasPin && (
              <p className="text-center text-sm text-gray-500 mt-6">
                Forgot your PIN? Ask a parent to help you reset it.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}