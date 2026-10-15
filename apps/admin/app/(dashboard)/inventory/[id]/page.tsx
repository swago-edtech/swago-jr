
"use client";
import React from "react";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Ban, RotateCcw, Trash2, History } from "lucide-react";

export default function EditInventoryItem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [currentStock, setCurrentStock] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    unit: "pcs",
    lowStockThreshold: 10,
    targetQuantity: 100,
    isActive: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemRes, txRes] = await Promise.all([
          fetch(`/api/inventory/${id}`),
          fetch(`/api/inventory/${id}/transactions?limit=10`)
        ]);

        if (itemRes.ok) {
          const data = await itemRes.json();
          const item = data.item;
          setFormData({
            name: item.name,
            sku: item.sku || "",
            description: item.description || "",
            unit: item.unit,
            lowStockThreshold: item.lowStockThreshold,
            targetQuantity: item.targetQuantity,
            isActive: item.isActive,
          });
          setCurrentStock(item.currentStock ?? 0);
        }

        if (txRes.ok) {
          const txData = await txRes.json();
          setTransactions(txData.transactions || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox"
        ? checked
        : ["lowStockThreshold", "targetQuantity"].includes(name)
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Item updated successfully!");
        router.push("/inventory");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update item");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating item");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    const next = !formData.isActive;
    const label = next ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${label} this item?`)) return;

    setToggling(true);
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, isActive: next }),
      });
      const data = await res.json();
      if (res.ok) {
        setFormData((prev) => ({ ...prev, isActive: next }));
      } else {
        alert(data.error || `Failed to ${label} item`);
      }
    } catch (error) {
      console.error(error);
      alert(`Error trying to ${label} item`);
    } finally {
      setToggling(false);
    }
  };

  const handleHardDelete = async () => {
    if (
      !confirm(
        `Permanently delete "${formData.name}"? This cannot be undone. Stock must be 0 and the item must not be used in any product config.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push("/inventory");
      } else {
        alert(data.error || "Failed to delete item");
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting item");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500 py-24"><div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-4"></div><p>Loading item details...</p></div>;
  }

  return (
    <div className="p-6 w-full grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      <div className="lg:col-span-2 xl:col-span-3">
        <Link href="/inventory" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Inventory
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Item</h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                {formData.name}
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    formData.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {formData.isActive ? "Active" : "Inactive"}
                </span>
                <span className="text-gray-400">Stock: {currentStock}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={toggling}
                className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                  formData.isActive
                    ? "border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100"
                    : "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                }`}
              >
                {formData.isActive ? (
                  <><Ban className="w-4 h-4 mr-1.5" /> Deactivate</>
                ) : (
                  <><RotateCcw className="w-4 h-4 mr-1.5" /> Activate</>
                )}
              </button>
              <button
                type="button"
                onClick={handleHardDelete}
                disabled={deleting}
                className="inline-flex items-center px-3 py-1.5 border border-red-200 text-sm font-medium rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Delete
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
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

              <div className="flex items-center pt-8">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <label htmlFor="isActive" className="ml-3 block text-sm font-medium text-gray-700">
                  Active (Available for Product Config)
                </label>
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
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-1 pt-[72px]">
        <div id="history" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <History className="w-5 h-5 mr-2 text-gray-400" /> Recent History
            </h3>
            <Link href="/inventory/transactions" className="text-xs text-indigo-600 hover:underline font-medium">
              View All
            </Link>
          </div>
          <div className="p-0">
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-500 p-6 text-center">No transactions found.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {transactions.map((tx: any) => (
                  <li key={tx._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        tx.type === 'addition' ? 'bg-green-100 text-green-800' :
                        tx.type === 'deduction' ? 'bg-red-100 text-red-800' :
                        tx.type === 'discard' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {tx.type === 'addition' ? '+' : tx.type === 'deduction' || tx.type === 'discard' ? '-' : ''}{tx.quantity}{tx.type === 'discard' ? ' discarded' : ''}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{tx.reason}</p>
                    <p className="text-xs text-gray-400 mt-1">By {tx.performedBy}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
