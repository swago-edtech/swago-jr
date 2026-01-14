"use client";

import { useState } from "react";
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

export default function NewKidProfilePage() {
  const { user } = useSharedContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPinSection, setShowPinSection] = useState(false);

  const [form, setForm] = useState({
    name: "",
    age: "",
    grade: "",
    gender: "boy",
    avatarColor: avatarOptions[0].image, // ✅ NOW stores image path
    pin: "",
    confirmPin: "",
    pinHint: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push("/login?redirect=/profile/kids/new");
      return;
    }

    if (!form.name.trim()) {
      setError("Please enter the kid's name");
      return;
    }

    const age = parseInt(form.age);
    if (isNaN(age) || age < 3 || age > 18) {
      setError("Please enter a valid age between 3 and 18");
      return;
    }

    if (showPinSection && form.pin) {
      if (!/^\d{4}$/.test(form.pin)) {
        setError("PIN must be exactly 4 digits");
        return;
      }
      if (form.pin !== form.confirmPin) {
        setError("PINs don't match");
        return;
      }
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
          grade: form.grade || undefined,
          gender: form.gender,
          avatarColor: form.avatarColor, // Sends image path
          pin: showPinSection ? form.pin : null,
          pinHint: showPinSection && form.pin ? form.pinHint : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/profile");
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <Link
            href="/profile"
            className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 mb-4"
          >
            ← Back to Profile
          </Link>
          <h1 className="text-3xl font-bold">Create Kid Profile</h1>
          <p className="text-slate-600 mt-2">
            Add a kid profile to unlock digital content with your product codes
          </p>
        </div>

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
                placeholder="Enter kid's name"
                className="w-full border border-slate-300 rounded-md p-3"
                maxLength={50}
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                This name will be used to log into their profile
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
                  placeholder="Age (3-18)"
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

            <p className="text-xs text-slate-500 -mt-3">
              Content recommendations will be based on age and grade
            </p>

            {/* Gender Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Gender
              </label>
              <div className="grid grid-cols-3 gap-3">
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

                <button
                  type="button"
                  onClick={() => setForm({ ...form, gender: "other" })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    form.gender === "other"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-slate-300 bg-white text-slate-700 hover:border-purple-300"
                  }`}
                >
                  <div className="text-3xl mb-2">🧒</div>
                  <p className="text-sm font-semibold">Other</p>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                This helps us personalize their avatar and content
              </p>
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

            {/* PIN Protection Toggle */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-sm font-medium">
                    🔐 PIN Protection (Optional)
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    Protect this profile with a 4-digit PIN
                  </p>
                </div>
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
                  aria-label={showPinSection ? "Disable PIN protection" : "Enable PIN protection"}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showPinSection ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {showPinSection && (
                <div className="space-y-4 bg-purple-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pin" className="block text-sm font-medium mb-1">
                        4-Digit PIN
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
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="pinHint" className="block text-sm font-medium mb-1">
                      PIN Hint (Optional)
                    </label>
                    <input
                      type="text"
                      id="pinHint"
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

                  {form.pin && form.confirmPin && form.pin !== form.confirmPin && (
                    <p className="text-xs text-red-600">PINs don&apos;t match</p>
                  )}
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-600 mb-3">Preview</p>
              <div className="flex items-center gap-3">
                {/* ✅ NEW: Image preview */}
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
                    {form.gender && ` • ${form.gender === "boy" ? "👦" : form.gender === "girl" ? "👧" : "🧒"}`}
                    {showPinSection && form.pin && " • 🔐 Protected"}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[hsl(var(--swago-purple))] text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Profile..." : "Create Profile"}
            </button>
          </form>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>💡 Note:</strong> The username must be unique for each kid in your account.
            Kids will use this name to select their profile when playing games.
          </p>
        </div>
      </div>
    </div>
  );
}
