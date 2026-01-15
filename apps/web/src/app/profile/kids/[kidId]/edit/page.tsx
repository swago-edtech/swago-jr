"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSharedContext } from "@/context/SharedContext";

// Define types for the profile data
interface KidProfileData {
  _id: string;
  name: string;
  age: number;
  grade?: string;
  avatarColor: string;
  gender?: string;
  createdAt: string;
}

interface ProfileUpdateData {
  name: string;
  age: number;
  grade?: string;
  avatarColor: string;
  gender?: string;
}

const avatarOptions = [
  { name: "Swoo", image: "/images/swoo.png" },
  { name: "William", image: "/images/william.png" },
  { name: "Aron", image: "/images/aron.png" },
  { name: "Gibbson", image: "/images/gibbson.png" },
  { name: "Oswald", image: "/images/oswald.png" },
  { name: "Boy Hero", image: "/images/kid_boy1.png" },
  { name: "Girl Hero", image: "/images/kid_girl1.png" },
];

const gradeOptions = [
  "Pre-K",
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
];

export default function EditKidProfilePage({ 
  params 
}: { 
  params: Promise<{ kidId: string }> 
}) {
  const { kidId } = use(params);
  const { user } = useSharedContext();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [profileData, setProfileData] = useState<KidProfileData | null>(null);
  
  const [form, setForm] = useState({
    name: "",
    age: "",
    grade: "",
    gender: "boy",
    avatarColor: avatarOptions[0].image,
  });

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
          setProfileData(data.profile);
          
          // Handle both old (hex color) and new (image path) data
          let avatarValue = data.profile.avatarColor;
          if (avatarValue?.startsWith('#')) {
            // Old hex color - set default image
            avatarValue = avatarOptions[0].image;
          }
          
          setForm({
            name: data.profile.name,
            age: data.profile.age.toString(),
            grade: data.profile.grade || "",
            gender: data.profile.gender || "boy",
            avatarColor: avatarValue,
          });
        } else if (res.status === 404) {
          setError("Profile not found");
          setTimeout(() => router.push("/profile"), 2000);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    
    fetchKidProfile();
  }, [user, kidId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.name.trim()) {
      setError("Please enter the kid's name");
      return;
    }

    const age = parseInt(form.age);
    if (isNaN(age) || age < 3 || age > 18) {
      setError("Please enter a valid age between 3 and 18");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updateData: ProfileUpdateData = {
        name: form.name.trim(),
        age: age,
        grade: form.grade || undefined,
        avatarColor: form.avatarColor,
        gender: form.gender,
      };

      const res = await fetch(`/api/kid-profiles/${kidId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/profile");
      } else {
        setError(data.error || "Failed to update profile. Please try again.");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  if (loading) {
    return <p className="text-center p-12">Loading profile...</p>;
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
          <h1 className="text-3xl font-bold">Edit Kid Profile</h1>
          <p className="text-slate-600 mt-2">
            Update profile information for {form.name || "this kid"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-8 rounded-xl shadow-lg border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Kid&apos;s Name (Username)
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter kid&apos;s name"
                className="w-full border border-slate-300 rounded-md p-3"
                maxLength={50}
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                This name will be used to select their profile
              </p>
            </div>

            {/* Age and Grade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className="block text-sm font-medium mb-2">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Age"
                  className="w-full border border-slate-300 rounded-md p-3"
                  min="3"
                  max="18"
                  required
                />
              </div>

              <div>
                <label htmlFor="grade" className="block text-sm font-medium mb-2">
                  Grade (Optional)
                </label>
                <select
                  id="grade"
                  name="grade"
                  value={form.grade}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-md p-3"
                >
                  <option value="">Select Grade</option>
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Gender
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, gender: "boy" })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    form.gender === "boy"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-300 bg-white text-slate-700 hover:border-blue-300"
                  }`}
                >
                  <div className="text-3xl mb-2">👦</div>
                  <p className="text-sm font-semibold">Boy</p>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, gender: "girl" })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    form.gender === "girl"
                      ? "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-slate-300 bg-white text-slate-700 hover:border-pink-300"
                  }`}
                >
                  <div className="text-3xl mb-2">👧</div>
                  <p className="text-sm font-semibold">Girl</p>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                This helps us personalize their avatar and content
              </p>
            </div>

            {/* Avatar Character Selector */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Choose Your Character
              </label>
              <div className="grid grid-cols-4 gap-3">
                {avatarOptions.map((avatar) => (
                  <button
                    key={avatar.image}
                    type="button"
                    onClick={() => setForm({ ...form, avatarColor: avatar.image })}
                    className={`relative p-2 rounded-xl border-2 transition-all hover:scale-105 ${
                      form.avatarColor === avatar.image
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

            {/* Preview */}
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-600 mb-3">Preview</p>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center relative">
                  <Image
                    src={form.avatarColor || "/images/swoo.png"}
                    alt={form.name || "Avatar"}
                    width={56}
                    height={56}
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/swoo.png";
                    }}
                  />
                </div>
                <div>
                  <p className="font-medium">{form.name || "Kid's Name"}</p>
                  <p className="text-sm text-slate-500">
                    {form.age ? `${form.age} years old` : "Age not set"}
                    {form.grade && ` • ${form.grade}`}
                    {form.gender && ` • ${form.gender === "boy" ? "👦" : "👧"}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <Link
                href="/profile"
                className="flex-1 text-center border border-slate-300 py-3 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[hsl(var(--swago-purple))] text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
