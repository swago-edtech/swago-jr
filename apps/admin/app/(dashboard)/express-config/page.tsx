"use client";

import { useState, useEffect } from "react";

export default function ExpressConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [config, setConfig] = useState({
    isTimerEnabled: false,
    timerText: "⚡ EXPRESS CHECKOUT — FREE SHIPPING ON ONLINE ORDERS",
    timerMinutes: 10,
    allowPublicCoupons: false,
  });

  useEffect(() => {
    fetch("/api/express-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setConfig(data.config);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await fetch("/api/express-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Express Checkout settings updated!" });
        setConfig(data.config);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update settings" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while saving." });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Express Checkout Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Configure the top banner and rush timer for the Express Checkout flow.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Top Banner Configuration</h3>
          <p className="mt-1 text-sm text-gray-500">
            This banner displays on mobile and desktop Express Checkout. You can enable a countdown timer to increase urgency.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Toggle Rush Timer */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-base font-medium text-gray-900">Enable Rush Timer</label>
              <p className="text-sm text-gray-500">When enabled, the banner turns into a countdown timer.</p>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, isTimerEnabled: !config.isTimerEnabled })}
              className={`${
                config.isTimerEnabled ? "bg-blue-600" : "bg-gray-200"
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2`}
            >
              <span
                className={`${
                  config.isTimerEnabled ? "translate-x-5" : "translate-x-0"
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          {/* Banner Text */}
          <div>
            <label htmlFor="timerText" className="block text-sm font-medium text-gray-700">
              {config.isTimerEnabled ? "Timer Prefix Text" : "Static Banner Text"}
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="timerText"
                value={config.timerText}
                onChange={(e) => setConfig({ ...config, timerText: e.target.value })}
                className="block w-full text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 border"
                placeholder={config.isTimerEnabled ? "🔥 FLASH SALE ENDS IN" : "⚡ EXPRESS CHECKOUT — FREE SHIPPING ON ONLINE ORDERS"}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {config.isTimerEnabled 
                ? "This text appears right before the countdown (e.g., '🔥 FLASH SALE ENDS IN 10:00')" 
                : "This text displays statically across the top bar."}
            </p>
          </div>

          {/* Timer Minutes (Only show if enabled) */}
          {config.isTimerEnabled && (
            <div className="pt-4 border-t border-gray-100">
              <label htmlFor="timerMinutes" className="block text-sm font-medium text-gray-700">
                Timer Duration (Minutes)
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  id="timerMinutes"
                  min="1"
                  max="60"
                  value={config.timerMinutes}
                  onChange={(e) => setConfig({ ...config, timerMinutes: parseInt(e.target.value) || 10 })}
                  className="block w-32 text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 border"
                />
                <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                  minutes
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                The countdown will restart to this duration every time the user refreshes the page.
              </p>
            </div>
          )}

          {/* Toggle Public Coupons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <label className="text-base font-medium text-gray-900">Allow Public Coupons</label>
              <p className="text-sm text-gray-500">Allow general website coupons to be used in Express Checkout.</p>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, allowPublicCoupons: !config.allowPublicCoupons })}
              className={`${
                config.allowPublicCoupons ? "bg-blue-600" : "bg-gray-200"
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2`}
            >
              <span
                className={`${
                  config.allowPublicCoupons ? "translate-x-5" : "translate-x-0"
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
      
    </div>
  );
}
