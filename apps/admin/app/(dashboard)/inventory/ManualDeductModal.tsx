"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

type ComponentPreview = {
  inventoryItemId: string;
  name: string;
  unit: string;
  perUnit: number;
  currentStock: number;
  missing: boolean;
  inactive: boolean;
};

type ConfiguredProduct = {
  productId: string;
  productName: string;
  unitsAvailable: number;
  limitingComponent: string | null;
  incomplete: boolean;
  components: ComponentPreview[];
};

export default function ManualDeductModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (summary: string) => void;
}) {
  const [products, setProducts] = useState<ConfiguredProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setProductId("");
    setQuantity("1");
    setReason("");
    setError("");
    setLoading(true);
    fetch("/api/inventory/manual-deduct")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok) setProducts(data.products || []);
        else setError(data.error || "Failed to load products");
      })
      .catch(() => setError("Failed to load products"))
      .finally(() => setLoading(false));
  }, [open]);

  const selected = products.find((product) => product.productId === productId) || null;
  const qty = Number(quantity);
  const qtyValid = Number.isInteger(qty) && qty >= 1;

  const preview = useMemo(() => {
    if (!selected || !qtyValid) return [];
    return selected.components.map((component) => ({
      ...component,
      deduct: component.perUnit * qty,
      after: component.currentStock - component.perUnit * qty,
    }));
  }, [selected, qty, qtyValid]);

  const goesNegative = preview.some((line) => line.after < 0);
  const available = products.filter((product) => !product.incomplete && product.unitsAvailable > 0);
  const unavailable = products.filter((product) => product.incomplete || product.unitsAvailable <= 0);

  const stockTerm = (product: ConfiguredProduct) => {
    if (product.incomplete) return "setup incomplete";
    if (product.unitsAvailable > 0) return `${product.unitsAvailable} can be made`;
    if (product.unitsAvailable === 0) return "none left";
    return `${Math.abs(product.unitsAvailable)} short`;
  };

  const recommendation = () => {
    if (!selected) {
      return "Only active products with an inventory setup are listed. “Can be made” is how many of that product the current components can still assemble.";
    }
    if (selected.incomplete) {
      return "This product’s setup is incomplete, so stock can’t be deducted until every component exists.";
    }
    const limit = selected.limitingComponent ? ` ${selected.limitingComponent} runs out first.` : "";
    const stockLine =
      selected.unitsAvailable > 0
        ? `Current components can make ${selected.unitsAvailable} of ${selected.productName}.${limit}`
        : selected.unitsAvailable === 0
          ? `Current components cannot make another ${selected.productName}.${limit}`
          : `${selected.productName} is already ${Math.abs(selected.unitsAvailable)} short.${limit}`;
    const action =
      qtyValid && qty > Math.max(selected.unitsAvailable, 0)
        ? ` This entry of ${qty} is more than what can be made, so stock will go negative.`
        : " Enter the number sold offline. Selling more than what can be made is allowed.";
    return stockLine + action;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selected || !qtyValid || selected.incomplete) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/inventory/manual-deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selected.productId,
          quantity: qty,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to deduct stock");
        return;
      }
      onSaved(`${data.quantity} × ${data.productName}`);
    } catch {
      setError("Failed to deduct stock");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold text-gray-900">Manual Deduction</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-5 pb-5 border-b border-gray-100">
          Record an offline sale. Component stock is reduced from the product setup, and the change is saved in Transactions with the reason and your name.
        </p>

        {loading ? (
          <p className="text-sm text-gray-500">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-600">
            No active products have an inventory setup yet. Set one up from the inventory dashboard first.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Active product</label>
              <select
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">Choose an active product</option>
                {available.length > 0 && (
                  <optgroup label="Can still be made">
                    {available.map((product) => (
                      <option key={product.productId} value={product.productId}>
                        {product.productName} — {stockTerm(product)}
                      </option>
                    ))}
                  </optgroup>
                )}
                {unavailable.length > 0 && (
                  <optgroup label="None left">
                    {unavailable.map((product) => (
                      <option key={product.productId} value={product.productId}>
                        {product.productName} — {stockTerm(product)}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mt-3">
                {recommendation()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product quantity</label>
              <input
                type="number"
                required
                min="1"
                step="1"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              {quantity !== "" && !qtyValid && (
                <p className="text-xs text-red-600 mt-1.5">Enter a whole number of at least 1.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason (optional)</label>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Offline sale at the stall"
              />
            </div>

            {preview.length > 0 && (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Per product</th>
                      <th className="px-4 py-3">Deduct</th>
                      <th className="px-4 py-3">Now</th>
                      <th className="px-4 py-3">After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.map((line) => (
                      <tr key={line.inventoryItemId}>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {line.name}
                          {line.missing ? " (missing)" : line.inactive ? " (inactive)" : ""}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{line.perUnit} {line.unit}</td>
                        <td className="px-4 py-3 text-gray-900">{line.deduct}</td>
                        <td className="px-4 py-3 text-gray-600">{line.currentStock}</td>
                        <td className={`px-4 py-3 font-semibold ${line.after < 0 ? "text-red-600" : "text-gray-900"}`}>
                          {line.after}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {goesNegative && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                Stock will go negative. The sale is still recorded, and you can restock later.
              </p>
            )}

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium rounded-xl text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selected || !qtyValid || Boolean(selected?.incomplete)}
                className="px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {submitting ? "Saving..." : "Deduct stock"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
