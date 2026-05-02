"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import SuccessModal from "./SuccessModal";

type ReelUploadFormProps = {
  onSuccess: () => void;
};

export default function ReelUploadForm({ onSuccess }: ReelUploadFormProps) {
  const [reelUrl, setReelUrl] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!reelUrl.trim()) {
      setError("Please enter your Instagram reel URL");
      return;
    }

    if (!instagramUsername.trim()) {
      setError("Please enter your Instagram username");
      return;
    }

    if (instagramUsername.includes('@') || instagramUsername.includes(' ')) {
      setError("Instagram username should not contain @ or spaces");
      return;
    }

    const isValidInstagram = /instagram\.com\/(reel|p)\//.test(reelUrl);
    if (!isValidInstagram) {
      setError("Please provide a valid Instagram reel or post URL");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/ambassador/reel-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reelUrl: reelUrl.trim(),
          instagramUsername: instagramUsername.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        
        
        setShowSuccess(true);
      } else {
        setError(data.error || "Failed to submit reel");
      }
    } catch (err) {
      console.error("Reel submission error:", err);
      setError("Failed to submit reel. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h3 className="text-2xl font-bold text-slate-800 mb-2 text-center">
        🎬 Upload Your Entry Challenge Reel
      </h3>
      <p className="text-slate-600 text-center mb-6">
        Complete your Swago Ambassador First Challenge!
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Instagram Username Field */}
        <div>
          <label htmlFor="instagramUsername" className="block text-sm font-medium text-slate-700 mb-2">
            Your Instagram Username * <span className="text-xs text-slate-500">(without @)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-slate-500 font-medium text-lg">@</span>
            <input
              id="instagramUsername"
              type="text"
              value={instagramUsername}
              onChange={(e) => setInstagramUsername(e.target.value.replace('@', '').replace(' ', ''))}
              disabled={isSubmitting}
              className="w-full p-3 pl-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent disabled:bg-slate-100"
              placeholder="your_username"
              required
            />
          </div>
        </div>

        {/* Reel URL Field */}
        <div>
          <label htmlFor="reelUrl" className="block text-sm font-medium text-slate-700 mb-2">
            Instagram Reel URL *
          </label>
          <input
            id="reelUrl"
            type="url"
            value={reelUrl}
            onChange={(e) => setReelUrl(e.target.value)}
            disabled={isSubmitting}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--swago-purple))] focus:border-transparent disabled:bg-slate-100"
            placeholder="https://www.instagram.com/reel/ABC123..."
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            💡 Copy the link from Instagram → Share → Copy Link
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[hsl(var(--swago-purple))] text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Submit Reel 🚀"}
        </button>
      </form>

      <SuccessModal 
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          onSuccess();
        }}
        message="Congratulations, your reel has been sent for review and your amount will be added after approval."
      />
    </div>
  );
}
