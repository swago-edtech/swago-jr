"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSharedContext } from "@/context/SharedContext";

type KidProfile = {
  _id: string;
  name: string;
  age: number;
  avatarColor: string;
  unlockedProducts: number[];
};

export default function UnlockContentPage({ 
  params 
}: { 
  params: Promise<{ kidId: string }> 
}) {
  const { kidId } = use(params); // Unwrap params with React.use()
  const { user } = useSharedContext();
  const router = useRouter();
  const [kidProfile, setKidProfile] = useState<KidProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.push("/login?redirect=/profile");
      return;
    }
    
    const fetchKidProfile = async () => {
      try {
        const res = await fetch(`/api/kid-profiles/${kidId}`);
        if (res.ok) {
          const data = await res.json();
          setKidProfile(data.profile);
        } else if (res.status === 404) {
          setMessage("Profile not found");
          setTimeout(() => router.push("/profile"), 2000);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setMessage("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    
    fetchKidProfile();
  }, [user, kidId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setMessage("Please enter a code");
      setIsSuccess(false);
      return;
    }

    setUnlocking(true);
    setMessage("");
    setIsSuccess(false);

    try {
      const res = await fetch(`/api/kid-profiles/${kidId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        setMessage(`🎉 Success! ${data.productName} has been unlocked for ${kidProfile?.name}!`);
        setCode("");
        
        // Update local profile data
        if (kidProfile && data.productId) {
          setKidProfile({
            ...kidProfile,
            unlockedProducts: [...kidProfile.unlockedProducts, data.productId],
          });
        }
      } else {
        setIsSuccess(false);
        setMessage(data.error || "Invalid or expired code. Please try again.");
      }
    } catch (err) {
      console.error("Unlock error:", err);
      setIsSuccess(false);
      setMessage("An error occurred. Please try again.");
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return <p className="text-center p-12">Loading...</p>;
  }

  if (!kidProfile) {
    return <p className="text-center p-12">Profile not found</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 mb-4"
          >
            ← Back to Profile
          </Link>
          <h1 className="text-3xl font-bold">Unlock Content</h1>
        </div>

        {/* Kid Info Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: kidProfile.avatarColor }}
            >
              {kidProfile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{kidProfile.name}</h2>
              <p className="text-slate-500">
                {kidProfile.unlockedProducts.length} items unlocked
              </p>
            </div>
          </div>
        </div>

        {/* Unlock Form */}
        <div className="bg-white p-8 rounded-xl shadow-lg border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-2">
                Enter Product Code
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., SCARF_3_A3F2E"
                className="w-full border border-slate-300 rounded-md p-3 text-center font-mono text-lg tracking-wider"
                maxLength={20}
                autoComplete="off"
                required
              />
              <p className="text-xs text-slate-500 mt-2">
                Find the unique code on the card included with your Swago Junior product
              </p>
            </div>

            {/* Message Display */}
            {message && (
              <div
                className={`p-4 rounded-lg text-sm ${
                  isSuccess
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={unlocking}
              className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {unlocking ? "Unlocking..." : "🎁 Unlock Content"}
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg border">
          <h3 className="font-medium mb-2">How it works:</h3>
          <ol className="text-sm text-slate-600 space-y-1">
            <li>1. Purchase a Swago Junior product</li>
            <li>2. Find the unique code card in the package</li>
            <li>3. Enter the code above to unlock digital content</li>
            <li>4. Access games, activities, and learning materials!</li>
          </ol>
        </div>

        {/* Recently Unlocked */}
        {kidProfile.unlockedProducts.length > 0 && (
          <div className="mt-6 p-4 bg-white rounded-lg border">
            <h3 className="font-medium mb-2">Recently Unlocked</h3>
            <p className="text-sm text-slate-600">
              {kidProfile.name} has unlocked {kidProfile.unlockedProducts.length} product{kidProfile.unlockedProducts.length === 1 ? "" : "s"}. 
              Keep collecting to unlock more content!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}