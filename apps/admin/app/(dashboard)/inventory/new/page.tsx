
"use client";
import React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewInventoryItem() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    unit: "pcs",
    currentStock: 0,
    lowStockThreshold: 10,
    targetQuantity: 100,
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["currentStock", "lowStockThreshold", "targetQuantity"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/inventory");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create item");
      }
    } catch (error) {
      console.error(error);
      alert("Error creating item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 w-full max-w-5xl mx-auto">
      <Link href="/inventory" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Inventory
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create New Item</h1>
          <p className="text-sm text-gray-500 mt-1">Add a new raw material or component to track.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name *</label>
              <input
                type="text"
                name="name"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Deluxe Wooden Board"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">SKU Code</label>
              <input
                type="text"
                name="sku"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all uppercase"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. BD-002"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief details about this component..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Unit of Measure</label>
              <select
                name="unit"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all bg-white"
                value={formData.unit}
                onChange={handleChange}
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="sets">Sets</option>
                <option value="packs">Packs</option>
                <option value="pairs">Pairs</option>
                <option value="box">Boxes</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Stock Quantity</label>
              <input
                type="number"
                name="currentStock"
                min="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
                value={formData.currentStock}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Low Stock Threshold</label>
              <input
                type="number"
                name="lowStockThreshold"
                min="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
                value={formData.lowStockThreshold}
                onChange={handleChange}
              />
              <p className="mt-1.5 text-xs text-gray-500">Alert triggers when stock falls to this level</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Target Quantity</label>
              <input
                type="number"
                name="targetQuantity"
                min="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
                value={formData.targetQuantity}
                onChange={handleChange}
              />
              <p className="mt-1.5 text-xs text-gray-500">Optimal restock target level</p>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Creating Item..." : "Create Inventory Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
