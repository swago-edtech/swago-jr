"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSharedContext } from "@/context/SharedContext";

const avatarColors = [
  "#8B5CF6", // Purple
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
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
  const [form, setForm] = useState({
    name: "",
    age: "",
    grade: "",
    avatarColor: avatarColors[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push("/login?redirect=/profile/kids/new");
      return;
    }

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
          avatarColor: form.avatarColor,
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
    setError(""); // Clear error when user types
  };

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
          <h1 className="text-3xl font-bold">Create Kid Profile</h1>
          <p className="text-slate-600 mt-2">
            Add a kid profile to unlock digital content with your product codes
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
                placeholder="Enter kid's name"
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
                  placeholder="Age (3-18)"
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
            
            <p className="text-xs text-slate-500 -mt-3">
              Content recommendations will be based on age and grade
            </p>

            {/* Avatar Color Selector */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Choose Avatar Color
              </label>
              <div className="flex gap-3 flex-wrap">
                {avatarColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, avatarColor: color })}
                    className={`w-12 h-12 rounded-full border-2 transition-all ${
                      form.avatarColor === color
                        ? "border-slate-800 scale-110 shadow-lg"
                        : "border-slate-300 hover:border-slate-500"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color} color`}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-600 mb-3">Preview</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: form.avatarColor }}
                >
                  {form.name ? form.name.charAt(0).toUpperCase() : "?"}
                </div>
                <div>
                  <p className="font-medium">{form.name || "Kid's Name"}</p>
                  <p className="text-sm text-slate-500">
                    {form.age ? `${form.age} years old` : "Age not set"}
                    {form.grade && ` • ${form.grade}`}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[hsl(var(--swago-purple))] text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Profile..." : "Create Profile"}
            </button>
          </form>
        </div>

        {/* Info Box */}
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