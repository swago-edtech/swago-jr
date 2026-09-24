"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Gift,
  TrendingUp,
  Info,
  ShieldAlert,
  ToggleLeft,
  MapPin,
  Hash,
  X,
} from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep", "Puducherry",
];

interface RedemptionTier {
  target: number;
  off: number;
}

interface BonusItem {
  threshold: number;
  label: string;
  slug: string;
  rewardType?: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
}

export default function PromotionsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [redemptionTiers, setRedemptionTiers] = useState<RedemptionTier[]>([]);
  const [bonusItems, setBonusItems] = useState<BonusItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [blockedCodStates, setBlockedCodStates] = useState<string[]>([]);
  const [blockedCodPincodes, setBlockedCodPincodes] = useState<string[]>([]);
  const [pincodeInput, setPincodeInput] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [promoRes, prodRes] = await Promise.all([
        fetch("/api/promotion"),
        fetch("/api/products?isActive=true"),
      ]);

      if (promoRes.ok) {
        const data = await promoRes.json();
        if (data.success) {
          setRedemptionTiers(data.promotion.redemptionTiers || []);
          setBonusItems(data.promotion.bonusItems || []);
          setIsActive(data.promotion.isActive ?? true);
          setBlockedCodStates(data.promotion.blockedCodStates || []);
          setBlockedCodPincodes(data.promotion.blockedCodPincodes || []);
        }
      }

      if (prodRes.ok) {
        const data = await prodRes.json();
        if (data.success) {
          setProducts(data.products || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showMessage("error", "Failed to load promotion data");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const validTiers = redemptionTiers.filter((t) => t.target > 0 && t.off > 0);
      const validItems = bonusItems.filter((b) => b.threshold > 0 && b.label && b.slug);

      const res = await fetch("/api/promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redemptionTiers: validTiers,
          bonusItems: validItems,
          isActive,
          blockedCodStates,
          blockedCodPincodes,
        }),
      });

      if (res.ok) {
        setRedemptionTiers(validTiers);
        setBonusItems(validItems);
        setHasUnsavedChanges(false);
        showMessage("success", "Promotions updated successfully!");
      } else {
        const data = await res.json();
        showMessage("error", data.error || "Failed to update promotions");
      }
    } catch (error) {
      console.error("Save error:", error);
      showMessage("error", "An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleIsActive = async (checked: boolean) => {
    setIsActive(checked);
    try {
      const res = await fetch("/api/promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: checked }),
      });

      if (res.ok) {
        showMessage("success", `Progress bar ${checked ? "enabled" : "disabled"}`);
      } else {
        setIsActive(!checked);
        showMessage("error", "Failed to save toggle state");
      }
    } catch (error) {
      setIsActive(!checked);
      showMessage("error", "Network error while saving toggle state");
    }
  };

  const handlePincodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = pincodeInput.trim().replace(/,/g, "");
      if (!val) return;

      if (!/^\d{6}$/.test(val)) {
        showMessage("error", "Pin code must be exactly 6 digits");
        return;
      }

      if (!blockedCodPincodes.includes(val)) {
        setBlockedCodPincodes([...blockedCodPincodes, val]);
        setPincodeInput("");
        setHasUnsavedChanges(true);
      } else {
        setPincodeInput("");
      }
    }
  };

  const removePincode = (pincodeToRemove: string) => {
    setBlockedCodPincodes(blockedCodPincodes.filter((p) => p !== pincodeToRemove));
    setHasUnsavedChanges(true);
  };

  const addTier = () => {
    setRedemptionTiers([...redemptionTiers, { target: 0, off: 0 }]);
    setHasUnsavedChanges(true);
  };

  const removeTier = (index: number) => {
    setRedemptionTiers(redemptionTiers.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const updateTier = (index: number, field: keyof RedemptionTier, value: number) => {
    const newTiers = [...redemptionTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setRedemptionTiers(newTiers);
    setHasUnsavedChanges(true);
  };

  const addBonusItem = () => {
    setBonusItems([...bonusItems, { threshold: 0, label: "", slug: "", rewardType: "gift" }]);
    setHasUnsavedChanges(true);
  };

  const removeBonusItem = (index: number) => {
    setBonusItems(bonusItems.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const updateBonusItem = (index: number, field: keyof BonusItem, value: any) => {
    const newItems = [...bonusItems];
    if (field === "slug" && newItems[index].rewardType !== "coupon") {
      const product = products.find((p) => p.slug === value);
      newItems[index] = { ...newItems[index], slug: value, label: product?.name || "" };
    } else if (field === "rewardType") {
      newItems[index] = { ...newItems[index], rewardType: value, slug: "", label: "" };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setBonusItems(newItems);
    setHasUnsavedChanges(true);
  };

  const toggleBlockedState = (state: string) => {
    setBlockedCodStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
    setHasUnsavedChanges(true);
  };

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all bg-white";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading strategy configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900">Checkout Strategy</h1>
            {isActive ? (
              <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
                Active
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold border border-gray-200">
                Disabled
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure automated upsell milestones, bonus item rules, and COD restrictions
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {hasUnsavedChanges && (
            <div className="text-amber-600 text-xs font-bold flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Unsaved
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-xs"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Apply Strategy"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl flex items-center gap-2.5 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div
            className={`h-2 w-2 rounded-full flex-none ${
              message.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Redemption Growth Tiers</span>
                <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full normal-case tracking-normal">
                  {redemptionTiers.length} tiers
                </span>
              </div>
              <button
                onClick={addTier}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Tier
              </button>
            </div>

            <div className="bg-blue-50/50 p-3.5 rounded-lg flex items-start gap-2.5 border border-blue-100">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-none" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Controls the &quot;Add ₹X more to unlock ₹Y off&quot; progress bar in the cart.
                <strong> Target Amount</strong> is the required cart total, and
                <strong> Max Off</strong> is the redemption cap at that level.
              </p>
            </div>

            <div className="space-y-3">
              {redemptionTiers.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <TrendingUp className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm font-medium">No tiers configured yet.</p>
                  <button
                    onClick={addTier}
                    className="mt-3 text-blue-600 font-bold text-xs uppercase tracking-wider hover:underline"
                  >
                    + Add First Tier
                  </button>
                </div>
              ) : (
                redemptionTiers
                  .sort((a, b) => a.target - b.target)
                  .map((tier, index) => (
                    <div
                      key={index}
                      className="flex items-end gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:border-blue-200 transition-all group"
                    >
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">
                            Order Target (₹)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-medium pointer-events-none">
                              ₹
                            </span>
                            <input
                              type="number"
                              value={tier.target}
                              onChange={(e) => updateTier(index, "target", Number(e.target.value))}
                              className={`${inputClass} pl-7 font-semibold`}
                              placeholder="e.g. 799"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">
                            Max Redemption (₹)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-emerald-500 text-sm font-medium pointer-events-none">
                              ₹
                            </span>
                            <input
                              type="number"
                              value={tier.off}
                              onChange={(e) => updateTier(index, "off", Number(e.target.value))}
                              className={`${inputClass} pl-7 font-semibold text-emerald-700`}
                              placeholder="e.g. 50"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeTier(index)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Gift className="w-4 h-4 text-purple-600" />
                <span>₹1 Bonus Items Unlocker</span>
                <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full normal-case tracking-normal">
                  {bonusItems.length} items
                </span>
              </div>
              <button
                onClick={addBonusItem}
                className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold hover:bg-purple-100 transition-all flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Item
              </button>
            </div>

            <div className="bg-purple-50/50 p-3.5 rounded-lg flex items-start gap-2.5 border border-purple-100">
              <Info className="h-4 w-4 text-purple-500 mt-0.5 flex-none" />
              <p className="text-xs text-purple-700 leading-relaxed">
                Configure gifts or coupons users can unlock for just ₹1 once they reach a spend milestone.
                The backend enforces threshold validation.
              </p>
            </div>

            <div className="space-y-4">
              {bonusItems.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Gift className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm font-medium">No bonus items added yet.</p>
                  <button
                    onClick={addBonusItem}
                    className="mt-3 text-purple-600 font-bold text-xs uppercase tracking-wider hover:underline"
                  >
                    + Add First Item
                  </button>
                </div>
              ) : (
                bonusItems
                  .sort((a, b) => a.threshold - b.threshold)
                  .map((item, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:border-purple-200 transition-all group space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={item.rewardType !== "coupon"}
                              onChange={() => updateBonusItem(index, "rewardType", "gift")}
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                            />
                            <span className="text-xs font-semibold text-gray-700">Gift Product</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={item.rewardType === "coupon"}
                              onChange={() => updateBonusItem(index, "rewardType", "coupon")}
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                            />
                            <span className="text-xs font-semibold text-gray-700">Coupon Code</span>
                          </label>
                        </div>
                        <button
                          onClick={() => removeBonusItem(index)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">
                            Spend Milestone (₹)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-medium pointer-events-none">
                              ₹
                            </span>
                            <input
                              type="number"
                              value={item.threshold}
                              onChange={(e) =>
                                updateBonusItem(index, "threshold", Number(e.target.value))
                              }
                              className={`${inputClass} pl-7 font-semibold`}
                              placeholder="e.g. 999"
                            />
                          </div>
                        </div>

                        {item.rewardType === "coupon" ? (
                          <div>
                            <label className="block text-xs font-semibold text-purple-500 mb-1">
                              Coupon Code & Description
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={item.slug}
                                onChange={(e) => updateBonusItem(index, "slug", e.target.value)}
                                className={`${inputClass} w-1/2 font-mono font-semibold uppercase`}
                                placeholder="e.g. FREE20"
                              />
                              <input
                                type="text"
                                value={item.label}
                                onChange={(e) => updateBonusItem(index, "label", e.target.value)}
                                className={`${inputClass} w-1/2`}
                                placeholder="e.g. 20% OFF"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-semibold text-purple-500 mb-1">
                              Gift Product
                            </label>
                            <select
                              value={item.slug}
                              onChange={(e) => updateBonusItem(index, "slug", e.target.value)}
                              className={inputClass}
                            >
                              <option value="">Select a product...</option>
                              {products.map((p) => (
                                <option key={p._id} value={p.slug}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.slug ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                        <span className="text-[11px] text-gray-500 font-medium">
                          {item.slug
                            ? `Configured: ${item.rewardType === "coupon" ? "Coupon" : "Gift"} — ${item.label || item.slug}`
                            : "Awaiting configuration..."}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-4 lg:self-start">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <ToggleLeft className="w-4 h-4 text-blue-600" />
              <span>General Settings</span>
            </div>

            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50/80 transition-colors cursor-pointer">
              <div>
                <span className="text-sm font-semibold text-gray-900 block">Enable Progress Bar</span>
                <span className="text-xs text-gray-400 block">
                  Milestone progress bar on cart & checkout
                </span>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isActive}
                  onChange={(e) => handleToggleIsActive(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
          </div>

          <div className="bg-white rounded-xl border border-red-100 p-5 space-y-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>COD Restrictions</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Block by State</h3>
                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                  {blockedCodStates.length} blocked
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Customers from selected states must prepay.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                {INDIAN_STATES.sort().map((state) => {
                  const isBlocked = blockedCodStates.includes(state);
                  return (
                    <label
                      key={state}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all text-xs font-medium ${
                        isBlocked
                          ? "bg-red-50 border-red-200 text-red-800"
                          : "bg-white border-gray-100 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        checked={isBlocked}
                        onChange={() => toggleBlockedState(state)}
                      />
                      <span className="truncate" title={state}>
                        {state}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-3.5 h-3.5 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Block by Pin Code</h3>
                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-red-50 text-red-500 rounded-full">
                  {blockedCodPincodes.length} blocked
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Type a 6-digit pin code and press{" "}
                <kbd className="bg-gray-100 border border-gray-200 px-1 rounded text-gray-600 font-mono text-[10px]">
                  Enter
                </kbd>{" "}
                to add.
              </p>

              <input
                type="text"
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value)}
                onKeyDown={handlePincodeKeyDown}
                placeholder="Enter 6-digit pin code..."
                maxLength={6}
                className={`${inputClass} font-mono mb-3`}
              />

              {blockedCodPincodes.length > 0 && (
                <>
                  <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                    <div className="flex flex-wrap gap-1.5">
                      {blockedCodPincodes.map((pincode) => (
                        <div
                          key={pincode}
                          className="flex items-center gap-1 bg-red-50 text-red-800 px-2.5 py-1 rounded-lg border border-red-100 text-xs"
                        >
                          <span className="font-mono font-bold tracking-wide">{pincode}</span>
                          <button
                            onClick={() => removePincode(pincode)}
                            className="text-red-400 hover:text-red-600 rounded-full transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {blockedCodPincodes.length} pin codes blocked
                    </p>
                    <button
                      onClick={() => {
                        setBlockedCodPincodes([]);
                        setHasUnsavedChanges(true);
                      }}
                      className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
