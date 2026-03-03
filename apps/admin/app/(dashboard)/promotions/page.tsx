// apps/admin/app/(dashboard)/promotions/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Loader2, Gift, TrendingUp, Info } from "lucide-react";

interface RedemptionTier {
    target: number;
    off: number;
}

interface BonusItem {
    threshold: number;
    label: string;
    slug: string;
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
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [promoRes, prodRes] = await Promise.all([
                fetch("/api/promotion"),
                fetch("/api/products?isActive=true")
            ]);

            if (promoRes.ok) {
                const data = await promoRes.json();
                if (data.success) {
                    setRedemptionTiers(data.promotion.redemptionTiers || []);
                    setBonusItems(data.promotion.bonusItems || []);
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
            const res = await fetch("/api/promotion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ redemptionTiers, bonusItems })
            });

            if (res.ok) {
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

    const addTier = () => {
        setRedemptionTiers([...redemptionTiers, { target: 0, off: 0 }]);
    };

    const removeTier = (index: number) => {
        setRedemptionTiers(redemptionTiers.filter((_, i) => i !== index));
    };

    const updateTier = (index: number, field: keyof RedemptionTier, value: number) => {
        const newTiers = [...redemptionTiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setRedemptionTiers(newTiers);
    };

    const addBonusItem = () => {
        setBonusItems([...bonusItems, { threshold: 0, label: "", slug: "" }]);
    };

    const removeBonusItem = (index: number) => {
        setBonusItems(bonusItems.filter((_, i) => i !== index));
    };

    const updateBonusItem = (index: number, field: keyof BonusItem, value: any) => {
        const newItems = [...bonusItems];
        if (field === "slug") {
            const product = products.find(p => p.slug === value);
            newItems[index] = { ...newItems[index], slug: value, label: product?.name || "" };
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }
        setBonusItems(newItems);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm font-medium text-gray-500">Loading Configuration...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Checkout Strategy</h1>
                    <p className="text-gray-500 text-sm mt-1">Configure automated upsells and redemption tiers.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-bold shadow-lg shadow-blue-200"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Saving Changes..." : "Apply Strategy"}
                </button>
            </div>

            {message && (
                <div
                    className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === "success"
                            ? "bg-green-50 text-green-800 border-2 border-green-100"
                            : "bg-red-50 text-red-800 border-2 border-red-100"
                        }`}
                >
                    <div className={`h-2 w-2 rounded-full ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`} />
                    <p className="text-sm font-bold">{message.text}</p>
                </div>
            )}

            {/* Redemption Tiers Section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100 overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="font-black text-gray-900">Redemption Growth Indicator</h2>
                            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Progress Bar Logic</p>
                        </div>
                    </div>
                    <button
                        onClick={addTier}
                        className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-3 w-3" /> New Tier
                    </button>
                </div>

                <div className="p-6">
                    <div className="bg-blue-50/50 p-4 rounded-xl flex items-start gap-3 mb-8 border border-blue-100">
                        <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-800 leading-relaxed font-medium">
                            These tiers control the &quot;Add ₹X more to unlock ₹Y off&quot; progress bar in the cart.
                            The <strong>Target Amount</strong> is the cart total required, and <strong>Max Off</strong> is the redemption limit allowed at that level.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {redemptionTiers.length === 0 && (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <TrendingUp className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm font-bold">No tiers configured yet.</p>
                            </div>
                        )}

                        {redemptionTiers
                            .sort((a, b) => a.target - b.target)
                            .map((tier, index) => (
                                <div key={index} className="flex items-center gap-6 bg-white p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-100 transition-all group shadow-sm">
                                    <div className="flex-1 grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Order Target (₹)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    value={tier.target}
                                                    onChange={(e) => updateTier(index, "target", Number(e.target.value))}
                                                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-black text-gray-800"
                                                    placeholder="e.g. 799"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Max Redemption (₹)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    value={tier.off}
                                                    onChange={(e) => updateTier(index, "off", Number(e.target.value))}
                                                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-black text-green-600"
                                                    placeholder="e.g. 50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeTier(index)}
                                        className="mt-6 p-2.5 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm active:scale-90"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* Bonus Items Section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100 overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Gift className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="font-black text-gray-900">₹1 Bonus Items Unlocker</h2>
                            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Milestone Gifts</p>
                        </div>
                    </div>
                    <button
                        onClick={addBonusItem}
                        className="text-xs font-black text-purple-600 hover:text-purple-700 flex items-center gap-1 bg-purple-50 px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-3 w-3" /> New Item
                    </button>
                </div>

                <div className="p-6">
                    <div className="bg-purple-50/50 p-4 rounded-xl flex items-start gap-3 mb-8 border border-purple-100">
                        <Info className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-purple-800 leading-relaxed font-medium">
                            Configure gifts that users can add for just ₹1 once they reach a spend milestone.
                            The backend ensures users can&apos;t bypass these thresholds.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {bonusItems.length === 0 && (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <Gift className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm font-bold">No bonus items added yet.</p>
                            </div>
                        )}

                        {bonusItems
                            .sort((a, b) => a.threshold - b.threshold)
                            .map((item, index) => (
                                <div key={index} className="bg-white p-6 rounded-2xl border-2 border-gray-100 hover:border-purple-100 transition-all group shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Spend Milestone (₹)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    value={item.threshold}
                                                    onChange={(e) => updateBonusItem(index, "threshold", Number(e.target.value))}
                                                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none font-black text-gray-800"
                                                    placeholder="e.g. 999"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black text-purple-400 tracking-wider">Gift Product</label>
                                            <select
                                                value={item.slug}
                                                onChange={(e) => updateBonusItem(index, "slug", e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none font-black bg-white"
                                            >
                                                <option value="">Choose a product...</option>
                                                {products.map(p => (
                                                    <option key={p._id} value={p.slug}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${item.slug ? "bg-green-500 shadow-sm shadow-green-200" : "bg-gray-300"}`} />
                                            <span className="text-[11px] font-bold text-gray-500">
                                                {item.slug ? `Live Gift: ${item.label}` : "Waiting for configuration..."}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removeBonusItem(index)}
                                            className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all active:scale-95"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center pt-8 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-[0.2em] mb-2">
                    Strategy Intelligence Engine
                </p>
                <p className="text-[11px] text-gray-500 italic">
                    &ldquo;Higher thresholds with better gifts increase Average Order Value (AOV).&rdquo;
                </p>
            </div>
        </div>
    );
}
