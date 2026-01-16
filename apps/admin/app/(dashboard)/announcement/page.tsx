// apps/admin/app/(dashboard)/announcement/page.tsx

"use client";

import { useState, useEffect } from "react";

type Announcement = {
  _id?: string;
  text: string;
  isActive: boolean;
  backgroundColor: string;
};

const BACKGROUND_OPTIONS = {
  gradient: "Purple to Pink Gradient",
  purple: "Solid Purple",
  pink: "Solid Pink",
  teal: "Solid Teal",
  orange: "Solid Orange",
};

export default function AnnouncementPage() {
  const [announcement, setAnnouncement] = useState<Announcement>({
    text: "",
    isActive: true,
    backgroundColor: "gradient",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch current announcement
  const fetchAnnouncement = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/announcement");
      const data = await res.json();

      if (data.success && data.announcement) {
        setAnnouncement(data.announcement);
      }
    } catch (error) {
      console.error("Error fetching announcement:", error);
      showMessage("error", "Failed to load announcement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  // Save announcement
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!announcement.text.trim()) {
      showMessage("error", "Announcement text is required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(announcement),
      });

      const data = await res.json();

      if (data.success) {
        showMessage("success", "Announcement saved successfully!");
        setAnnouncement(data.announcement);
      } else {
        showMessage("error", data.error || "Failed to save announcement");
      }
    } catch (error) {
      console.error("Error saving announcement:", error);
      showMessage("error", "Error saving announcement");
    } finally {
      setSaving(false);
    }
  };

  // Show message helper
  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Preview background color
  const getPreviewBackground = () => {
    const colors: Record<string, string> = {
      gradient: "bg-gradient-to-r from-purple-500 to-pink-500",
      purple: "bg-purple-600",
      pink: "bg-pink-600",
      teal: "bg-teal-600",
      orange: "bg-orange-600",
    };
    return colors[announcement.backgroundColor] || colors.gradient;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading announcement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Announcement Banner</h1>
        <p className="text-gray-600 mt-1">Manage the site-wide announcement shown at the top of pages</p>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Announcement Text */}
        <div>
          <label htmlFor="announcement-text" className="block text-sm font-medium text-gray-700 mb-2">
            Announcement Text *
          </label>
          <textarea
            id="announcement-text"
            value={announcement.text}
            onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
            placeholder="e.g., Use code SHARKFUN for 10% off! For new users only!"
            rows={3}
            maxLength={200}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            {announcement.text.length}/200 characters
          </p>
        </div>

        {/* Background Color */}
        <div>
          <label htmlFor="background-color" className="block text-sm font-medium text-gray-700 mb-2">
            Background Style
          </label>
          <select
            id="background-color"
            value={announcement.backgroundColor}
            onChange={(e) => setAnnouncement({ ...announcement, backgroundColor: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(BACKGROUND_OPTIONS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is-active"
            checked={announcement.isActive}
            onChange={(e) => setAnnouncement({ ...announcement, isActive: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="is-active" className="text-sm font-medium text-gray-700">
            Show announcement on website
          </label>
        </div>

        {/* Preview */}
        {announcement.text && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div className={`${getPreviewBackground()} text-white text-center py-3 px-4 rounded-md text-sm`}>
              {announcement.text}
            </div>
            {!announcement.isActive && (
              <p className="text-xs text-orange-600 mt-2">
                ⚠️ Announcement is currently disabled. Enable it to show on the website.
              </p>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !announcement.text.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Announcement"}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Important Notes</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>The announcement appears at the top of all pages except the Kids section</li>
          <li>Keep text concise (max 200 characters) for best mobile display</li>
          <li>Changes take effect immediately after saving</li>
          <li>Toggle the checkbox to enable/disable without deleting the text</li>
        </ul>
      </div>
    </div>
  );
}
