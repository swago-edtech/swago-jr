"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSharedContext } from "@/context/SharedContext";

const avatarOptions = [
  { name: "Swoo", image: "/images/swoo.png" },
  { name: "William", image: "/images/william.png" },
  { name: "Aron", image: "/images/aron.png" },
  { name: "Gibbson", image: "/images/gibbson.png" },
  { name: "Oswald", image: "/images/oswald.png" },
  { name: "Boy Hero", image: "/images/kid_boy1.png" },
  { name: "Girl Hero", image: "/images/kid_girl1.png" },
];

export default function NewKidProfilePage() {
  const { user, isLoadingUser } = useSharedContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [createdProfile, setCreatedProfile] = useState<{
    name: string;
    swagoMoney: number;
    badges: string[];
  } | null>(null);

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "boy",
    city: "",
    avatarColor: avatarOptions[0].image,
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoadingUser && !user) {
      router.push("/login?redirect=/profile/kids/new");
    }
  }, [user, isLoadingUser, router]);

  // Pre-fill city from user address
  useEffect(() => {
    if (user?.address) {
      setForm(prev => ({ ...prev, city: user.address || "" }));
    }
  }, [user?.address]);

  // Auto-redirect after success
  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => {
        router.push("/kids/dashboard");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Please enter the kid's name");
      return;
    }

    const age = parseInt(form.age);
    if (isNaN(age) || age < 3 || age > 18) {
      setError("Please enter a valid age between 3 and 18");
      return;
    }

    if (!form.city.trim()) {
      setError("Please enter your city");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/kid-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          age: age,
          gender: form.gender,
          city: form.city.trim(),
          avatarColor: form.avatarColor,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Auto-select the created profile
        if (data.profile) {
          localStorage.setItem("selectedKidProfile", JSON.stringify({
            _id: data.profile._id,
            name: data.profile.name,
            age: data.profile.age,
            avatarColor: data.profile.avatarColor,
          }));

          setCreatedProfile({
            name: data.profile.name,
            swagoMoney: data.profile.ambassador?.swagoMoney || 20,
            badges: data.profile.ambassador?.badges || ["Swago Saviour"],
          });
        }
        setStep("success");
      } else {
        setError(data.error || "Failed to create profile. Please try again.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  // Success Screen
  if (step === "success" && createdProfile) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Welcome to the Swagoverse! 🎉</h2>
            <p className="text-lg text-slate-600 mb-4">
              Profile created successfully!
            </p>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
              <p className="text-lg font-semibold text-slate-800 mb-2">
                🎁 {createdProfile.name} received:
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2 text-yellow-600 font-bold">
                  <span className="text-2xl">💰</span>
                  <span className="text-xl">{createdProfile.swagoMoney} Swago Dollars</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-purple-600 font-bold">
                  <span className="text-2xl">🦸</span>
                  <span className="text-lg">{createdProfile.badges[0]} Badge</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Redirecting to Kids Dashboard in 3 seconds...
            </p>
            <button
              onClick={() => router.push("/kids/dashboard")}
              className="inline-block bg-[hsl(var(--swago-orange))] text-white font-bold px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              Go to Dashboard Now →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <Link
              href="/profile"
              className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 mb-4"
            >
              ← Back to Profile
            </Link>
            <h1 className="text-3xl font-bold text-slate-800">Create Kid Profile 🌟</h1>
            <p className="text-slate-600 mt-2">
              Create a profile and enter the Swagoverse!
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg">
            {/* Parent Info Section (Pre-filled, Read-only) */}
            <div className="border-b pb-6 mb-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                👨‍👩‍👧 Parent Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Name</label>
                  <p className="p-3 bg-slate-50 rounded-lg text-slate-700 font-medium">
                    {user.name || "Not set"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Phone</label>
                  <p className="p-3 bg-slate-50 rounded-lg text-slate-700 font-medium">
                    {user.phone || "Not set"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
                  <p className="p-3 bg-slate-50 rounded-lg text-slate-700 font-medium">
                    {user.email || "Not set"}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* City Input */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Enter your city"
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Child Details Section */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  🧒 Child Details
                </h3>

                {/* Name Input */}
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                    Child&apos;s Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter child's name"
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    maxLength={50}
                    required
                  />
                </div>

                {/* Age and Gender */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-slate-700 mb-2">
                      Age *
                    </label>
                    <select
                      id="age"
                      name="age"
                      value={form.age}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select age</option>
                      {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(age => (
                        <option key={age} value={age}>{age} years</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-2">
                      Gender *
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="boy">Boy 👦</option>
                      <option value="girl">Girl 👧</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Avatar Character Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Choose Your Character
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {avatarOptions.map((avatar) => (
                    <button
                      key={avatar.image}
                      type="button"
                      onClick={() => setForm({ ...form, avatarColor: avatar.image })}
                      className={`relative p-2 rounded-xl border-2 transition-all hover:scale-105 ${form.avatarColor === avatar.image
                          ? "border-purple-500 bg-purple-50 shadow-lg"
                          : "border-slate-300 bg-white hover:border-purple-300"
                        }`}
                    >
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center relative">
                        <Image
                          src={avatar.image}
                          alt={avatar.name}
                          width={80}
                          height={80}
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/images/swoo.png";
                          }}
                        />
                      </div>
                      <p className="text-xs font-medium text-center mt-1 truncate">
                        {avatar.name}
                      </p>
                      {form.avatarColor === avatar.image && (
                        <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rewards Preview */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-600 mb-2">🎁 Your child will receive:</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-yellow-600 font-semibold">
                    <span>💰</span>
                    <span>20 Swago Dollars</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-600 font-semibold">
                    <span>🦸</span>
                    <span>Swago Saviour Badge</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-shine bg-[hsl(var(--swago-purple))] text-white font-bold py-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {loading ? "Creating Profile..." : "🚀 Enter the Swagoverse"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
