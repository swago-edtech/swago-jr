"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CREATOR_PLACEMENTS,
  buildFullUtmCreatorLink,
  buildShortCreatorLink,
  getSiteOrigin,
} from "@/lib/creatorLinks";
import Link from "next/link";
import { Check, Copy, ExternalLink, Link2 } from "lucide-react";

type Creator = {
  _id: string;
  creatorId: string;
  handle: string;
  displayName?: string;
  platform: string;
  feeInr: number;
  productCostInr: number;
  defaultCampaign?: string;
  notes?: string;
  isActive: boolean;
};

const emptyForm = {
  creatorId: "",
  handle: "",
  displayName: "",
  platform: "instagram",
  feeInr: 0,
  productCostInr: 0,
  defaultCampaign: "",
  notes: "",
  isActive: true,
};

const fieldClass =
  "w-full h-10 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

export default function InfluencersPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkCreator, setLinkCreator] = useState<Creator | null>(null);
  const [placement, setPlacement] = useState("story");
  const [copiedKey, setCopiedKey] = useState("");

  const siteOrigin = useMemo(() => getSiteOrigin("https://swagojr.com"), []);

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/influencers");
      const data = await res.json();
      if (data.success) setCreators(data.creators || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.handle.trim()) {
      setMessage("Handle is required");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const url = editingId ? `/api/influencers/${editingId}` : "/api/influencers";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Save failed");
      setMessage(editingId ? "Creator updated" : "Creator created");
      resetForm();
      fetchCreators();
    } catch (e: any) {
      setMessage(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c: Creator) => {
    setEditingId(c._id);
    setForm({
      creatorId: c.creatorId,
      handle: c.handle,
      displayName: c.displayName || "",
      platform: c.platform || "instagram",
      feeInr: c.feeInr || 0,
      productCostInr: c.productCostInr || 0,
      defaultCampaign: c.defaultCampaign || "",
      notes: c.notes || "",
      isActive: c.isActive !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, handle: string) => {
    if (!confirm(`Delete creator @${handle}?`)) return;
    await fetch(`/api/influencers/${id}`, { method: "DELETE" });
    if (linkCreator?._id === id) setLinkCreator(null);
    fetchCreators();
  };

  const shortLink = (c: Creator, place = placement) =>
    buildShortCreatorLink({
      creatorId: c.creatorId,
      platform: c.platform,
      defaultCampaign: c.defaultCampaign,
      placement: place,
      siteOrigin,
    });

  const fullLink = (c: Creator, place = placement) =>
    buildFullUtmCreatorLink({
      creatorId: c.creatorId,
      platform: c.platform,
      defaultCampaign: c.defaultCampaign,
      placement: place,
      siteOrigin,
    });

  const copyText = async (text: string, key: string, okMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setMessage(okMsg);
      setTimeout(() => setCopiedKey(""), 1800);
    } catch {
      setMessage("Could not copy — select the link manually");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Influencer Creators</h1>
          <p className="mt-1.5 text-sm font-medium text-gray-700 max-w-2xl leading-relaxed">
            Register creators, set fees for ROAS, and share{" "}
            <span className="font-bold text-gray-900">short masked links</span> like{" "}
            <code className="text-xs bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded font-mono">
              {siteOrigin.replace(/^https?:\/\//, "")}/r/annie_ig/reel
            </code>
            . The storefront expands them to full UTMs automatically.
          </p>
        </div>
        <a
          href="/analytics/influencers"
          className="text-sm font-bold text-gray-800 hover:underline shrink-0"
        >
          Open leaderboard →
        </a>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-gray-50 text-gray-800 text-sm font-semibold border border-gray-200">
          {message}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
            <Link2 className="w-5 h-5" />
          </div>
          <div className="space-y-2 min-w-0">
            <h2 className="text-base font-bold text-gray-900">How creator links work</h2>
            <ol className="text-sm font-medium text-gray-800 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                You share a short link:{" "}
                <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-900 text-xs font-mono">
                  /r/&#123;creatorId&#125;/reel
                </code>
              </li>
              <li>
                Web redirects to home with full UTMs (
                <span className="font-semibold">source · medium=influencer · campaign · content · term</span>
                ).
              </li>
              <li>
                Browser stores <span className="font-semibold">first + last touch</span> for 7 days (marketing
                consent / pre-decision).
              </li>
              <li>
                Signup stamps <span className="font-semibold">User.acquisition</span>; checkout attaches the same
                to the order for admin P&amp;L.
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">
          {editingId ? "Edit creator" : "Add creator"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Handle *</label>
            <input
              className={fieldClass}
              value={form.handle}
              onChange={(e) => setForm({ ...form, handle: e.target.value })}
              placeholder="@swago_creator"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Creator ID (utm_content / short path)
            </label>
            <input
              className={fieldClass}
              value={form.creatorId}
              disabled={!!editingId}
              onChange={(e) => setForm({ ...form, creatorId: e.target.value })}
              placeholder="auto from handle if empty"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Display name</label>
            <input
              className={fieldClass}
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Platform</label>
            <select
              className={fieldClass}
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
            >
              {["instagram", "youtube", "whatsapp", "facebook", "other"].map((p) => (
                <option key={p} value={p} className="text-gray-900 bg-white">
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Fee (INR)</label>
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={form.feeInr}
              onChange={(e) => setForm({ ...form, feeInr: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Product cost override (INR)</label>
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={form.productCostInr}
              onChange={(e) => setForm({ ...form, productCostInr: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Default campaign</label>
            <input
              className={fieldClass}
              value={form.defaultCampaign}
              onChange={(e) => setForm({ ...form, defaultCampaign: e.target.value })}
              placeholder="mar2026_launch"
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="active"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-gray-400 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="active" className="text-sm font-semibold text-gray-900 cursor-pointer">
              Active
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-600 mb-1">Notes</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
          >
            {saving ? "Saving..." : editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-900 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {linkCreator && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Link builder</p>
              <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                @{linkCreator.handle}{" "}
                <span className="text-sm font-mono font-semibold text-gray-600">
                  · {linkCreator.creatorId}
                </span>
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setLinkCreator(null)}
              className="text-sm font-bold text-gray-700 hover:text-gray-900"
            >
              Close
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">Placement (utm_term)</label>
            <div className="flex flex-wrap gap-2">
              {CREATOR_PLACEMENTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlacement(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
                    placement === p.id
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase text-gray-700">Short link (share this)</p>
                <button
                  type="button"
                  onClick={() => copyText(shortLink(linkCreator), "short", "Short link copied")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:underline"
                >
                  {copiedKey === "short" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </button>
              </div>
              <p className="font-mono text-sm font-bold text-gray-900 break-all leading-relaxed">
                {shortLink(linkCreator)}
              </p>
              <p className="text-xs font-medium text-gray-600">
                Clean for bios, stories, WhatsApp. Expands server-side to full UTMs.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase text-gray-700">Full UTM (expanded)</p>
                <button
                  type="button"
                  onClick={() => copyText(fullLink(linkCreator), "full", "Full UTM link copied")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:underline"
                >
                  {copiedKey === "full" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </button>
              </div>
              <p className="font-mono text-xs font-semibold text-gray-800 break-all leading-relaxed">
                {fullLink(linkCreator)}
              </p>
              <a
                href={shortLink(linkCreator)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-gray-800 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open short link
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {CREATOR_PLACEMENTS.map((p) => (
              <button
                key={`quick-${p.id}`}
                type="button"
                onClick={() =>
                  copyText(shortLink(linkCreator, p.id), `p-${p.id}`, `${p.label} short link copied`)
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-900 hover:bg-gray-50"
              >
                {copiedKey === `p-${p.id}` ? (
                  <Check className="w-3 h-3 text-gray-700" />
                ) : (
                  <Copy className="w-3 h-3 text-gray-500" />
                )}
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-gray-900">Creators</h2>
          <span className="text-xs font-semibold text-gray-600">{creators.length} total</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-gray-700 text-sm font-semibold">Loading...</div>
        ) : creators.length === 0 ? (
          <div className="p-10 text-center text-gray-600 text-sm font-semibold">No creators yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  {["Creator", "ID", "Fee", "Short link", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-800 ${
                        h === "Actions" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {creators.map((c) => {
                  const link = shortLink(c, "story");
                  const display = link.replace(/^https?:\/\//, "");
                  return (
                    <tr key={c._id} className="hover:bg-slate-50/80">
<td className="px-4 py-3.5">
                        <Link
                          href={`/influencers/${encodeURIComponent(c.creatorId)}`}
                          className="font-bold text-gray-900 hover:underline"
                        >
                          @{c.handle}
                        </Link>
                        <div className="text-xs font-medium text-gray-600 capitalize">
                          {c.platform}
                          {c.displayName ? ` · ${c.displayName}` : ""}
                        </div>
                        <Link
                          href={`/influencers/${encodeURIComponent(c.creatorId)}`}
                          className="text-[11px] font-bold text-gray-700 hover:text-gray-800 hover:underline mt-0.5 inline-block"
                        >
                          Open full details →
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-900">
                        {c.creatorId}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-900">₹{c.feeInr || 0}</td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="flex flex-col items-start gap-1.5">
                          <code className="text-xs font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded break-all">
                            {display}
                          </code>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="text-xs font-bold text-gray-800 hover:underline"
                              onClick={() => copyText(link, `row-${c._id}`, `Copied ${display}`)}
                            >
                              {copiedKey === `row-${c._id}` ? "Copied" : "Copy short"}
                            </button>
                            <button
                              type="button"
                              className="text-xs font-bold text-gray-800 hover:underline"
                              onClick={() => {
                                setLinkCreator(c);
                                setPlacement("story");
                              }}
                            >
                              All placements
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            c.isActive
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {c.isActive ? "Active" : "Off"}
                        </span>
                      </td>
<td className="px-4 py-3.5 text-right space-x-3">
                        <Link
                          href={`/influencers/${encodeURIComponent(c.creatorId)}`}
                          className="text-xs font-bold text-gray-800 hover:underline"
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => startEdit(c)}
                          className="text-xs font-bold text-gray-800 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c._id, c.handle)}
                          className="text-xs font-bold text-gray-800 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
