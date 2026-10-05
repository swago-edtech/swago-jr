
"use client";
import React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Minus, Edit, X, Package, RotateCcw, Trash2 } from "lucide-react";
import ManualDeductModal from "./ManualDeductModal";

export default function InventoryStockItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [deductOpen, setDeductOpen] = useState(false);
  const [deductNotice, setDeductNotice] = useState("");
  const [addStockModal, setAddStockModal] = useState<any>(null);
  const [addStockQty, setAddStockQty] = useState("");
  const [addStockReason, setAddStockReason] = useState("");
  const [submittingStock, setSubmittingStock] = useState(false);
  const [stockMode, setStockMode] = useState<"restock" | "discard">("restock");
  const [stockError, setStockError] = useState("");
  const [stockNotice, setStockNotice] = useState("");

  const openStockModal = (item: any) => {
    setAddStockModal({ id: item._id, name: item.name, currentStock: item.currentStock ?? 0, unit: item.unit || "pcs" });
    setAddStockQty("");
    setAddStockReason("");
    setStockMode("restock");
    setStockError("");
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (stockStatus) query.append("stockStatus", stockStatus);
      if (activeFilter !== "") query.append("isActive", activeFilter);
      const res = await fetch(`/api/inventory?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchItems(), 300);
    return () => clearTimeout(delay);
  }, [search, stockStatus, activeFilter]);

  const handleAddStock = async (e: any) => {
    e.preventDefault();
    if (!addStockModal || !addStockQty) return;
    setSubmittingStock(true);
    setStockError("");
    try {
      const res = await fetch(`/api/inventory/${addStockModal.id}/add-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(addStockQty),
          reason: addStockReason,
          mode: stockMode,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const qty = Number(addStockQty);
        setDeductNotice("");
        setStockNotice(
          `${stockMode === "discard" ? "Discarded" : "Added"} ${qty} ${addStockModal.unit} ${stockMode === "discard" ? "from" : "to"} ${addStockModal.name}.`
        );
        setAddStockModal(null);
        setAddStockQty("");
        setAddStockReason("");
        fetchItems();
      } else {
        setStockError(data.error || (stockMode === "discard" ? "Failed to discard stock" : "Failed to add stock"));
      }
    } catch (error) {
      console.error(error);
      setStockError("Something went wrong. Please try again.");
    } finally {
      setSubmittingStock(false);
    }
  };

  const toggleActive = async (item: any) => {
    const next = !item.isActive;
    const label = next ? "activate" : "deactivate";
    if (!confirm(`${next ? "Activate" : "Deactivate"} "${item.name}"?`)) return;
    setBusyId(item._id);
    try {
      const res = await fetch(`/api/inventory/${item._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          sku: item.sku || "",
          description: item.description || "",
          unit: item.unit,
          lowStockThreshold: item.lowStockThreshold,
          targetQuantity: item.targetQuantity,
          isActive: next,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        fetchItems();
      } else {
        alert(data.error || `Failed to ${label}`);
      }
    } catch (error) {
      console.error(error);
      alert(`Error trying to ${label}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: any) => {
    if (
      !confirm(
        `Permanently delete "${item.name}"? Stock must be 0 and it must not be used in any product config.`
      )
    ) {
      return;
    }
    setBusyId(item._id);
    try {
      const res = await fetch(`/api/inventory/${item._id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        fetchItems();
      } else {
        alert(data.error || "Failed to delete item");
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting item");
    } finally {
      setBusyId(null);
    }
  };

  const isDiscard = stockMode === "discard";
  const qtyNum = Number(addStockQty) || 0;
  const resultingStock = addStockModal
    ? (addStockModal.currentStock ?? 0) + (isDiscard ? -qtyNum : qtyNum)
    : 0;

  const getStockBadge = (current: number, low: number, target: number) => {
    if (current <= 0) return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">Out of Stock</span>;
    if (current <= low) return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>;
    if (current >= target) return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">Optimal</span>;
    return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">In Stock</span>;
  };

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Stock Items</h1>
          <p className="text-gray-500 mt-1">Manage unit-level stock for raw materials and components</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setDeductNotice("");
              setStockNotice("");
              setDeductOpen(true);
            }}
            className="bg-white text-gray-800 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition font-medium inline-flex items-center shadow-sm border border-gray-200"
          >
            Manual Deduction
          </button>
          <Link
            href="/inventory/new"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition font-medium inline-flex items-center shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" /> New Item
          </Link>
        </div>
      </div>

      {deductNotice && (
        <p className="mb-6 text-sm text-green-800 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          Deducted {deductNotice}. Stock on this page is updated, and the change is in Transactions.
        </p>
      )}

      {stockNotice && (
        <p className="mb-6 text-sm text-green-800 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          {stockNotice} The change is in Transactions.
        </p>
      )}

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search items by name or SKU..."
              className="w-full pl-10 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white"
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
            >
              <option value="">All stock levels</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="below-target">Below Target</option>
            </select>
          </div>
          <div>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => { setSearch(""); setStockStatus(""); setActiveFilter(""); }}
              className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition px-2 py-1 rounded-md hover:bg-indigo-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16"><div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-4"></div><p className="text-gray-500 font-medium">Loading inventory...</p></div>
        ) : items.length === 0 ? (
          <div className="bg-white p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">No items found</p>
            <p className="text-gray-500">Try adjusting your filters or create a new item.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Level</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Low / Target</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {items.map((item: any) => {
                  const inactive = item.isActive === false;
                  return (
                  <tr key={item._id} className={`hover:bg-gray-50/80 transition-colors ${inactive ? "bg-gray-50/60" : ""}`}>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-semibold max-w-[200px] sm:max-w-xs md:max-w-md truncate ${inactive ? "text-gray-500" : "text-gray-900"}`} title={item.name}>{item.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-900">{item.currentStock}</span>
                        {getStockBadge(item.currentStock, item.lowStockThreshold, item.targetQuantity)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                      <span className="text-amber-600">{item.lowStockThreshold}</span> <span className="mx-1 text-gray-300">/</span> <span className="text-green-600">{item.targetQuantity}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-2">
                      {inactive ? (
                        <>
                          <button
                            type="button"
                            disabled={busyId === item._id}
                            onClick={() => toggleActive(item)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-green-200 text-xs rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors shadow-sm disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Activate
                          </button>
                          <Link href={`/inventory/${item._id}`} className="inline-flex items-center px-2.5 py-1.5 border border-gray-200 text-xs rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm">
                            <Edit className="w-3.5 h-3.5 mr-1 text-blue-600" /> Edit
                          </Link>
                          <button
                            type="button"
                            disabled={busyId === item._id}
                            onClick={() => handleDelete(item)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-red-200 text-xs rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => openStockModal(item)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-200 text-xs rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1 text-green-600" /> Restock
                          </button>
                          <Link href={`/inventory/${item._id}`} className="inline-flex items-center px-2.5 py-1.5 border border-gray-200 text-xs rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm">
                            <Edit className="w-3.5 h-3.5 mr-1 text-blue-600" /> Edit
                          </Link>
                          <button
                            type="button"
                            disabled={busyId === item._id}
                            onClick={() => toggleActive(item)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-200 text-xs rounded-lg text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm disabled:opacity-50"
                          >
                            Deactivate
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ManualDeductModal
        open={deductOpen}
        onClose={() => setDeductOpen(false)}
        onSaved={(summary) => {
          setDeductOpen(false);
          setStockNotice("");
          setDeductNotice(summary);
          fetchItems();
        }}
      />

      {addStockModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{isDiscard ? "Discard Stock" : "Restock Item"}</h3>
              <button onClick={() => setAddStockModal(null)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 p-1 mb-4 bg-gray-100 rounded-xl">
              {(["restock", "discard"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setStockMode(m); setStockError(""); }}
                  className={`inline-flex items-center justify-center py-2 text-sm font-semibold rounded-lg transition ${
                    stockMode === m
                      ? `bg-white shadow-sm ${m === "discard" ? "text-red-600" : "text-green-700"}`
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {m === "discard" ? <Minus className="w-4 h-4 mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                  {m === "discard" ? "Discard" : "Restock"}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mb-5 pb-5 border-b border-gray-100">
              {isDiscard ? "Removing faulty / damaged units from" : "Adding stock to"}{" "}
              <strong className="text-gray-900 break-words">{addStockModal.name}</strong>
              <span className="block mt-1 text-gray-500">
                In stock: <strong className="text-gray-900">{addStockModal.currentStock}</strong> {addStockModal.unit}
              </span>
            </p>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isDiscard ? "Quantity to Discard" : "Quantity to Add"}</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  max={isDiscard ? Math.max(0, addStockModal.currentStock) : undefined}
                  inputMode="numeric"
                  className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 ${isDiscard ? "focus:ring-red-500" : "focus:ring-indigo-500"} focus:border-transparent transition-all outline-none`}
                  value={addStockQty}
                  onChange={(e) => { setAddStockQty(e.target.value); setStockError(""); }}
                  placeholder={isDiscard ? "e.g. 2" : "e.g. 50"}
                />
                {qtyNum > 0 && (
                  <p className={`mt-1.5 text-xs ${resultingStock < 0 ? "text-red-600 font-medium" : "text-gray-500"}`}>
                    {resultingStock < 0
                      ? `Only ${Math.max(0, addStockModal.currentStock)} ${addStockModal.unit} in stock`
                      : `${resultingStock} ${addStockModal.unit} after ${isDiscard ? "discard" : "restock"}`}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason / Notes (Optional)</label>
                <textarea
                  className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 ${isDiscard ? "focus:ring-red-500" : "focus:ring-indigo-500"} focus:border-transparent transition-all outline-none`}
                  rows={isDiscard ? 2 : 3}
                  value={addStockReason}
                  onChange={(e) => setAddStockReason(e.target.value)}
                  placeholder={isDiscard ? "e.g. Not working / damaged in transit" : "e.g. New shipment received"}
                />
              </div>
              {stockError && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{stockError}</p>
              )}
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => setAddStockModal(null)}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStock || (isDiscard && resultingStock < 0)}
                  className={`px-5 py-2.5 text-sm font-medium rounded-xl text-white transition-colors disabled:opacity-50 shadow-sm ${
                    isDiscard ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {submittingStock ? "Saving..." : isDiscard ? "Discard" : "Add Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
