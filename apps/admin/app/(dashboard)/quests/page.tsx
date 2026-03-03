"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Edit2, Image as ImageIcon, Coins, Tag } from "lucide-react";

type Quest = {
    _id: string;
    title: string;
    description: string;
    image: string;
    reward: number;
    frequency: string;
    productId: {
        _id: string;
        name: string;
    };
    isActive: boolean;
    tags: { name: string; color: string; iconName: string }[];
};

type Product = {
    _id: string;
    name: string;
};

export default function QuestsPage() {
    const [quests, setQuests] = useState<Quest[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        image: "",
        reward: 50,
        frequency: "Once per box",
        productId: "",
        tags: [
            { name: "Growth", color: "bg-[#4ADE80]", iconName: "Target" }
        ]
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [questsRes, productsRes] = await Promise.all([
                fetch("/api/quests"),
                fetch("/api/products")
            ]);

            const questsData = await questsRes.json();
            const productsData = await productsRes.json();

            if (questsData.success) setQuests(questsData.quests);
            if (productsData.success) setProducts(productsData.products);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const res = await fetch("/api/quests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setShowAddModal(false);
                fetchData();
                setFormData({
                    title: "",
                    description: "",
                    image: "",
                    reward: 50,
                    frequency: "Once per box",
                    productId: "",
                    tags: [{ name: "Growth", color: "bg-[#4ADE80]", iconName: "Target" }]
                });
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error("Error saving quest:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this quest?")) return;
        try {
            const res = await fetch(`/api/quests/${id}`, { method: "DELETE" });
            if (res.ok) fetchData();
        } catch (error) {
            console.error("Error deleting quest:", error);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Quest Management</h1>
                    <p className="text-slate-500">Add tasks and rewards for specific products</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                    <Plus className="w-5 h-5" /> New Quest
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center text-slate-400 font-bold">Loading Quests...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quests.map((quest) => (
                        <div key={quest._id} className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                            <div className="flex gap-4 mb-4">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 relative shrink-0">
                                    <img src={quest.image} alt={quest.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-black text-slate-800 leading-tight mb-1 truncate">{quest.title}</h3>
                                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">{quest.productId?.name}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1">
                                            <Coins className="w-3 h-3" /> {quest.reward} SD
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed font-medium">
                                {quest.description}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{quest.frequency}</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleDelete(quest._id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-8 overflow-hidden relative">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">Create New Quest</h2>

                        <form onSubmit={handleSave} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Connect to Product</label>
                                <select
                                    required
                                    value={formData.productId}
                                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a Product</option>
                                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Quest Title</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Focus Freeze Reel"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500 h-24"
                                    placeholder="What should the kid do?"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Reward (SD)</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.reward}
                                        onChange={(e) => setFormData({ ...formData, reward: parseInt(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.frequency}
                                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Image URL</label>
                                <div className="flex gap-2">
                                    <input
                                        required
                                        type="text"
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. /images/test/quest_ice_clock.png"
                                    />
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                        {formData.image ? <img src={formData.image} className="w-full h-full object-cover rounded-xl" /> : <ImageIcon className="text-slate-300 w-5 h-5" />}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                                    {saving ? "Saving..." : "Create Quest"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
