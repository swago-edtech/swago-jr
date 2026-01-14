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
  hasPin: boolean;
  pinHint: string;
  isLocked: boolean;
  unlockedProducts: string[];
  createdAt: string;
}

interface ProfileUpdateData {
  name: string;
  age: number;
  grade?: string;
  avatarColor: string;
  removePin?: boolean;
  pin?: string;
  pinHint?: string | null;
}

// ✅ UPDATED: Character images instead of colors
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
  const [showPinSection, setShowPinSection] = useState(false);
  const [pinAction, setPinAction] = useState<"none" | "change" | "remove">("none");
  
  const [form, setForm] = useState({
    name: "",
    age: "",
    grade: "",
    avatarColor: avatarOptions[0].image, // ✅ NOW stores image path
    pin: "",
    confirmPin: "",
    pinHint: "",
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
          
          // ✅ Handle both old (hex color) and new (image path) data
          let avatarValue = data.profile.avatarColor;
          if (avatarValue?.startsWith('#')) {
            // Old hex color - set default image
            avatarValue = avatarOptions[0].image;
          }
          
          setForm({
            name: data.profile.name,
            age: data.profile.age.toString(),
            grade: data.profile.grade || "",
            avatarColor: avatarValue,
            pin: "",
            confirmPin: "",
            pinHint: data.profile.pinHint || "",
          });
          // If profile has PIN, show the section but don't enable changing by default
          if (data.profile.hasPin) {
            setShowPinSection(true);
          }
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

    // PIN validation if changing
    if (pinAction === "change" && form.pin) {
      if (!/^\d{4}$/.test(form.pin)) {
        setError("PIN must be exactly 4 digits");
        return;
      }
      if (form.pin !== form.confirmPin) {
        setError("PINs don't match");
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      const updateData: ProfileUpdateData = {
        name: form.name.trim(),
        age: age,
        grade: form.grade || undefined,
        avatarColor: form.avatarColor, // Sends image path
      };

      // Handle PIN updates based on action
      if (pinAction === "remove") {
        updateData.removePin = true;
      } else if (pinAction === "change" && form.pin) {
        updateData.pin = form.pin;
        updateData.pinHint = form.pinHint || null;
      } else if (showPinSection && !profileData?.hasPin && form.pin) {
        // Setting PIN for first time
        updateData.pin = form.pin;
        updateData.pinHint = form.pinHint || null;
      } else if (profileData?.hasPin && form.pinHint !== profileData.pinHint) {
        // Just updating the hint
        updateData.pinHint = form.pinHint;
      }

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
                This name will be used to log into their profile
              </p>
            </div>

            {/* Age and Grade - Side by side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Age Input */}
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

              {/* Grade Select */}
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

            {/* ✅ NEW: Avatar Character Selector */}
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

            {/* PIN Protection Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium">
                    🔐 PIN Protection
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    {profileData?.hasPin 
                      ? "This profile is PIN protected" 
                      : "Protect this profile with a 4-digit PIN"}
                  </p>
                </div>
                
                {!profileData?.hasPin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPinSection(!showPinSection);
                      if (!showPinSection) {
                        setForm({ ...form, pin: "", confirmPin: "", pinHint: "" });
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showPinSection ? "bg-purple-600" : "bg-gray-200"
                    }`}
                    aria-label={showPinSection ? "Disable PIN setup" : "Enable PIN setup"}
                    title={showPinSection ? "Click to disable PIN setup" : "Click to enable PIN setup"}
                  >
                    <span className="sr-only">
                      {showPinSection ? "PIN setup enabled" : "PIN setup disabled"}
                    </span>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showPinSection ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                )}
              </div>

              {/* PIN Status for existing PIN */}
              {profileData?.hasPin && (
                <div className="bg-purple-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-purple-800">
                      PIN is currently active
                    </span>
                    {profileData.isLocked && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                        🔒 Locked
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPinAction(pinAction === "change" ? "none" : "change");
                        setForm({ ...form, pin: "", confirmPin: "" });
                      }}
                      className={`text-sm px-3 py-1.5 rounded-md mr-2 ${
                        pinAction === "change" 
                          ? "bg-purple-600 text-white" 
                          : "bg-white text-purple-600 border border-purple-300"
                      }`}
                    >
                      {pinAction === "change" ? "Cancel Change" : "Change PIN"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Are you sure you want to remove PIN protection?")) {
                          setPinAction("remove");
                        }
                      }}
                      className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-600 border border-red-300 hover:bg-red-100"
                    >
                      Remove PIN
                    </button>
                  </div>

                  {/* Current PIN Hint */}
                  <div className="mt-3">
                    <label htmlFor="pinHint" className="block text-sm font-medium mb-1">
                      PIN Hint
                    </label>
                    <input
                      type="text"
                      id="pinHint"
                      name="pinHint"
                      value={form.pinHint}
                      onChange={handleChange}
                      placeholder="e.g., Your favorite number, Your age twice"
                      className="w-full border border-slate-300 rounded-md p-2 text-sm"
                      maxLength={100}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Update the hint that shows after 3 wrong attempts
                    </p>
                  </div>
                </div>
              )}

              {/* PIN Setup/Change Fields */}
              {((showPinSection && !profileData?.hasPin) || pinAction === "change") && (
                <div className="space-y-4 bg-purple-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pin" className="block text-sm font-medium mb-1">
                        {pinAction === "change" ? "New PIN" : "4-Digit PIN"}
                      </label>
                      <input
                        type="text"
                        id="pin"
                        name="pin"
                        value={form.pin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                          setForm({ ...form, pin: value });
                        }}
                        placeholder="0000"
                        className="w-full border border-slate-300 rounded-md p-3 text-center font-mono text-lg"
                        maxLength={4}
                        pattern="\d{4}"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPin" className="block text-sm font-medium mb-1">
                        Confirm PIN
                      </label>
                      <input
                        type="text"
                        id="confirmPin"
                        name="confirmPin"
                        value={form.confirmPin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                          setForm({ ...form, confirmPin: value });
                        }}
                        placeholder="0000"
                        className="w-full border border-slate-300 rounded-md p-3 text-center font-mono text-lg"
                        maxLength={4}
                        pattern="\d{4}"
                      />
                    </div>
                  </div>
                  
                  {!profileData?.hasPin && (
                    <div>
                      <label htmlFor="newPinHint" className="block text-sm font-medium mb-1">
                        PIN Hint (Optional)
                      </label>
                      <input
                        type="text"
                        id="newPinHint"
                        name="pinHint"
                        value={form.pinHint}
                        onChange={handleChange}
                        placeholder="e.g., Your favorite number, Your age twice"
                        className="w-full border border-slate-300 rounded-md p-3"
                        maxLength={100}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        This hint will be shown after 3 wrong attempts
                      </p>
                    </div>
                  )}

                  {form.pin && form.confirmPin && form.pin !== form.confirmPin && (
                    <p className="text-xs text-red-600">PINs don&apos;t match</p>
                  )}
                </div>
              )}

              {/* PIN Removal Confirmation */}
              {pinAction === "remove" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 mb-2">
                    ⚠️ Are you sure you want to remove PIN protection?
                  </p>
                  <p className="text-xs text-red-600 mb-3">
                    Anyone will be able to access this profile without a PIN.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPinAction("none")}
                    className="text-sm px-3 py-1.5 rounded-md bg-white text-slate-600 border border-slate-300 mr-2"
                  >
                    Cancel
                  </button>
                  <span className="text-sm text-red-600">
                    PIN will be removed when you save changes
                  </span>
                </div>
              )}
            </div>

            {/* ✅ UPDATED: Preview with Image */}
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
                  <p className="font-medium">{form.name || "Kid&apos;s Name"}</p>
                  <p className="text-sm text-slate-500">
                    {form.age ? `${form.age} years old` : "Age not set"}
                    {form.grade && ` • ${form.grade}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {(profileData?.hasPin && pinAction !== "remove") && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        🔐 Protected
                      </span>
                    )}
                    {pinAction === "remove" && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                        🔓 PIN will be removed
                      </span>
                    )}
                    {((showPinSection && !profileData?.hasPin && form.pin) || 
                      (pinAction === "change" && form.pin)) && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        🔐 Will be protected
                      </span>
                    )}
                  </div>
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

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>💡 PIN Protection Tips:</strong>
          </p>
          <ul className="text-sm text-blue-900 mt-2 space-y-1 list-disc list-inside">
            <li>Use a PIN your kid can remember easily</li>
            <li>The PIN will be required every time they log in</li>
            <li>After 5 wrong attempts, the profile will be temporarily locked</li>
            <li>You can always remove or reset the PIN from your parent profile</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
