"use client";

import { useState, useEffect } from "react";

type PopupConfig = {
  isActive: boolean;
  title: string;
  description: string;
  buttonText: string;
  redirectUrl: string;
  couponCode: string;
};

type Coupon = {
  _id: string;
  code: string;
  description: string;
};

export default function HomePopupPage() {
  const [config, setConfig] = useState<PopupConfig>({
    isActive: false,
    title: "",
    description: "",
    buttonText: "Claim Now",
    redirectUrl: "/products",
    couponCode: "",
  });
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [popupRes, couponsRes] = await Promise.all([
        fetch("/api/home-popup"),
        fetch("/api/coupons")
      ]);
      
      const popupData = await popupRes.json();
      if (popupData.success && popupData.config) {
        setConfig(popupData.config);
      }
      
      const couponsData = await couponsRes.json();
      if (couponsData.success && couponsData.coupons) {
        setCoupons(couponsData.coupons);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showMessage("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (config.isActive && (!config.title.trim() || !config.description.trim())) {
      showMessage("error", "Title and description are required when active");
      return;
    }

    // Determine final coupon code to save
    // If user typed in couponCode, use it. Otherwise use selectedCoupon.
    const payload = {
      ...config,
      couponCode: config.couponCode.trim() || selectedCoupon
    };

    try {
      setSaving(true);
      const res = await fetch("/api/home-popup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        showMessage("success", "Popup configuration saved successfully!");
        setConfig(data.config);
      } else {
        showMessage("error", data.message || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      showMessage("error", "Error saving configuration");
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Homepage Pop-up Settings</h1>
        <p className="text-gray-600 mt-1">Configure the promotional pop-up shown on the main homepage.</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
            }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b">
          <input
            type="checkbox"
            id="is-active"
            checked={config.isActive}
            onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
          />
          <label htmlFor="is-active" className="text-lg font-bold text-gray-900">
            Enable Homepage Pop-up
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="e.g. Special Offer!"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
            <input
              type="text"
              value={config.buttonText}
              onChange={(e) => setConfig({ ...config, buttonText: e.target.value })}
              placeholder="e.g. Claim Now"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            placeholder="e.g. Get 20% off your first masterclass."
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Redirect URL (Where the button takes them)</label>
          <input
            type="text"
            value={config.redirectUrl}
            onChange={(e) => setConfig({ ...config, redirectUrl: e.target.value })}
            placeholder="e.g. /products or /masterclass"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-md font-bold text-gray-800 mb-4">Coupon Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manual Coupon Code</label>
              <input
                type="text"
                value={config.couponCode}
                onChange={(e) => setConfig({ ...config, couponCode: e.target.value.toUpperCase() })}
                placeholder="Type a coupon code here..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to use an existing coupon below.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Or Select Existing Coupon</label>
              <select
                value={selectedCoupon}
                onChange={(e) => setSelectedCoupon(e.target.value)}
                disabled={!!config.couponCode.trim()}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
              >
                <option value="">-- None --</option>
                {coupons.map((c) => (
                  <option key={c._id} value={c.code}>{c.code} - {c.description}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
