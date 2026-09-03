"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Link2,
  Loader2,
  Mail,
  Package,
  RefreshCw,
  Save,
  Tags,
  Unlink,
  XCircle,
} from "lucide-react";

type Alias = { alias: string; productId: string; productName?: string };
type ProductOption = { _id: string; name: string };
type ChannelEvent = {
  _id: string;
  subject: string;
  fromEmail: string;
  eventType: string;
  status: string;
  externalOrderId?: string;
  receivedAt?: string;
  createdAt: string;
  extracted?: {
    confidence?: number;
    reasoning?: string;
    items?: Array<{ title: string; quantity: number }>;
  };
  matchedItems?: Array<{
    productName: string;
    quantity: number;
    extractedTitle?: string;
    matchType?: string;
  }>;
  inventorySnapshot?: Array<{ inventoryItemName?: string; quantity?: number }>;
  error?: string;
};

type ConfigState = {
  isEnabled: boolean;
  isConnected: boolean;
  connectedEmail: string;
  senderAllowlist: string[];
  productAliases: Alias[];
  lastSyncedAt: string | null;
};

const STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  pending_review: {
    label: "Needs review",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  applied: {
    label: "Inventory deducted",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  restored: {
    label: "Inventory restored",
    className: "bg-sky-50 text-sky-800 border-sky-200",
  },
  ignored: {
    label: "Ignored",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  failed: {
    label: "Failed",
    className: "bg-rose-50 text-rose-800 border-rose-200",
  },
  skipped: {
    label: "Skipped",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export default function ChannelEmailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500">Loading...</div>}>
      <ChannelEmailPageInner />
    </Suspense>
  );
}

function ChannelEmailPageInner() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [aliasesOpen, setAliasesOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info");
  const [config, setConfig] = useState<ConfigState>({
    isEnabled: true,
    isConnected: false,
    connectedEmail: "",
    senderAllowlist: [],
    productAliases: [],
    lastSyncedAt: null,
  });
  const [senderText, setSenderText] = useState("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [events, setEvents] = useState<ChannelEvent[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [newAlias, setNewAlias] = useState({ alias: "", productId: "" });

  const showMessage = useCallback((text: string, type: "info" | "success" | "error" = "info") => {
    setMessage(text);
    setMessageType(type);
  }, []);

  const applyConfig = useCallback((next: any) => {
    const aliases = (next.productAliases || []).map((alias: any) => ({
      alias: alias.alias,
      productId: String(alias.productId?._id || alias.productId || ""),
      productName: alias.productName || "",
    }));
    setConfig({
      isEnabled: Boolean(next.isEnabled),
      isConnected: Boolean(next.isConnected),
      connectedEmail: next.connectedEmail || "",
      senderAllowlist: next.senderAllowlist || [],
      productAliases: aliases,
      lastSyncedAt: next.lastSyncedAt || null,
    });
    setSenderText((next.senderAllowlist || []).join("\n"));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, productsRes, eventsRes] = await Promise.all([
        fetch("/api/channel-email/config"),
        fetch("/api/products"),
        fetch(`/api/channel-email/events?status=${statusFilter}`),
      ]);
      const configData = await configRes.json();
      const productsData = await productsRes.json();
      const eventsData = await eventsRes.json();

      if (configData.success) applyConfig(configData.config);
      if (productsData.success) {
        setProducts(
          (productsData.products || []).map((p: any) => ({
            _id: String(p._id),
            name: p.name,
          }))
        );
      }
      if (eventsData.success) setEvents(eventsData.events || []);
    } finally {
      setLoading(false);
    }
  }, [applyConfig, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const oauthErrors: Record<string, string> = {
      missing_code:
        "Google did not return an authorization code. Close any popup and try Connect Gmail again.",
      oauth_failed:
        "Gmail connection failed. Confirm GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and that the redirect URI in Google Console matches this admin callback URL.",
    };

    if (searchParams.get("connected") === "1") {
      showMessage("Gmail connected successfully. Add Amazon sender addresses and run a sync.", "success");
    } else {
      const error = searchParams.get("error");
      if (error) {
        showMessage(oauthErrors[error] || `Gmail connection failed (${error}). Try connecting again.`, "error");
      }
    }
  }, [searchParams, showMessage]);

  const persistSettings = async (overrides?: {
    isEnabled?: boolean;
    senderAllowlist?: string[];
    productAliases?: Alias[];
  }) => {
    setSaving(true);
    try {
      const payload = {
        isEnabled: overrides?.isEnabled ?? config.isEnabled,
        senderAllowlist:
          overrides?.senderAllowlist ??
          senderText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        productAliases: overrides?.productAliases ?? config.productAliases,
      };

      const res = await fetch("/api/channel-email/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        showMessage(data.error || "Failed to save settings", "error");
        return false;
      }
      applyConfig(data.config);
      return true;
    } catch {
      showMessage("Failed to save settings", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const connectGmail = async () => {
    const res = await fetch("/api/channel-email/google");
    const data = await res.json();
    if (data.success && data.url) {
      window.location.href = data.url;
    } else {
      showMessage(data.error || "Could not start Gmail connect", "error");
    }
  };

  const disconnectGmail = async () => {
    if (!window.confirm("Disconnect Gmail? Automatic checking will stop until you connect again.")) {
      return;
    }
    setDisconnecting(true);
    try {
      const res = await fetch("/api/channel-email/config", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        applyConfig(data.config);
        showMessage("Gmail disconnected.", "success");
      } else {
        showMessage(data.error || "Failed to disconnect Gmail", "error");
      }
    } finally {
      setDisconnecting(false);
    }
  };

  const saveAll = async () => {
    const ok = await persistSettings();
    if (ok) showMessage("Settings saved.", "success");
  };

  const runSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/channel-email/sync", { method: "POST" });
      const data = await res.json();
      showMessage(data.message || data.error || "Sync finished", data.success ? "info" : "error");
      await load();
    } finally {
      setSyncing(false);
    }
  };

  const addAlias = async () => {
    if (!newAlias.alias.trim() || !newAlias.productId) {
      showMessage("Enter an Amazon title and select a Swago product.", "error");
      return;
    }
    const product = products.find((p) => p._id === newAlias.productId);
    const nextAliases = [
      ...config.productAliases,
      {
        alias: newAlias.alias.trim(),
        productId: newAlias.productId,
        productName: product?.name,
      },
    ];
    const ok = await persistSettings({ productAliases: nextAliases });
    if (ok) {
      setNewAlias({ alias: "", productId: "" });
      setAliasesOpen(true);
      showMessage("Alias saved.", "success");
    }
  };

  const removeAlias = async (index: number) => {
    const nextAliases = config.productAliases.filter((_, i) => i !== index);
    const ok = await persistSettings({ productAliases: nextAliases });
    if (ok) showMessage("Alias removed.", "success");
  };

  const toggleEnabled = async (checked: boolean) => {
    setConfig((prev) => ({ ...prev, isEnabled: checked }));
    const ok = await persistSettings({ isEnabled: checked });
    if (ok) {
      showMessage(checked ? "Automatic checking enabled." : "Automatic checking disabled.", "success");
    }
  };

  const eventAction = async (id: string, action: "apply" | "ignore") => {
    const res = await fetch(`/api/channel-email/events/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!data.success) {
      showMessage(data.error || "Action failed", "error");
    } else {
      showMessage(action === "apply" ? "Inventory applied." : "Event ignored.", "success");
    }
    await load();
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of events) {
      counts[event.status] = (counts[event.status] || 0) + 1;
    }
    return counts;
  }, [events]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Channel Email Sync</h1>
          <p className="text-slate-600 mt-1 max-w-2xl">
            Amazon order emails update the same BOM inventory pool as the website. No storefront
            orders are created — only unit stock moves.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Local: use <strong>Check mail now</strong>. Production: run the{" "}
            <code className="bg-slate-100 px-1 rounded">worker:channel-email</code> process on your
            VPS (interval sync).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={saveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </button>
          <button
            onClick={runSync}
            disabled={syncing || !config.isConnected}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Check mail now
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm border ${
            messageType === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : messageType === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-indigo-50 text-indigo-800 border-indigo-200"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-indigo-600" />
            <h2 className="font-semibold text-slate-900">Gmail</h2>
          </div>
          <div
            className={`rounded-xl border px-3 py-3 text-sm ${
              config.isConnected
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            {config.isConnected ? (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Connected</p>
                  <p className="text-xs mt-0.5 break-all">{config.connectedEmail}</p>
                </div>
              </div>
            ) : (
              "No Gmail account linked yet."
            )}
          </div>
          {config.lastSyncedAt && (
            <p className="text-xs text-slate-500">
              Last checked: {new Date(config.lastSyncedAt).toLocaleString("en-IN")}
            </p>
          )}
          <button
            onClick={connectGmail}
            className="w-full inline-flex items-center justify-center gap-2 border border-slate-300 rounded-xl py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            <Link2 className="h-4 w-4" />
            {config.isConnected ? "Reconnect Gmail" : "Connect Gmail"}
          </button>
          {config.isConnected && (
            <button
              onClick={disconnectGmail}
              disabled={disconnecting}
              className="w-full inline-flex items-center justify-center gap-2 border border-rose-200 text-rose-700 rounded-xl py-2.5 text-sm font-medium hover:bg-rose-50 disabled:opacity-50"
            >
              <Unlink className="h-4 w-4" />
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-700 pt-1">
            <input
              type="checkbox"
              checked={config.isEnabled}
              onChange={(e) => toggleEnabled(e.target.checked)}
              className="rounded border-slate-300"
            />
            Enable automatic checking (worker / cron)
          </label>
        </section>

        <section className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">Amazon sender emails</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                One address or domain per line. Only these senders are analyzed.
              </p>
            </div>
            <button
              onClick={saveAll}
              disabled={saving}
              className="shrink-0 text-sm font-medium text-indigo-700 hover:text-indigo-900 disabled:opacity-50"
            >
              Save emails
            </button>
          </div>
          <textarea
            value={senderText}
            onChange={(e) => setSenderText(e.target.value)}
            onBlur={() => {
              const next = senderText
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);
              const prev = config.senderAllowlist || [];
              const changed =
                next.length !== prev.length || next.some((email, i) => email !== prev[i]);
              if (changed) void persistSettings({ senderAllowlist: next });
            }}
            rows={7}
            className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder={"auto-confirm@amazon.in\norder-update@amazon.in"}
          />
        </section>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setAliasesOpen((open) => !open)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <Tags className="h-4 w-4 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-900">Product aliases</h2>
              <p className="text-sm text-slate-500">
                Map Amazon titles to Swago products when names differ.{" "}
                <span className="font-medium text-slate-700">
                  {config.productAliases.length} saved
                </span>
              </p>
            </div>
          </div>
          {aliasesOpen ? (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {aliasesOpen && (
          <div className="border-t border-slate-100 px-5 py-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <input
                value={newAlias.alias}
                onChange={(e) => setNewAlias((prev) => ({ ...prev, alias: e.target.value }))}
                placeholder="Amazon product title"
                className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
              />
              <select
                value={newAlias.productId}
                onChange={(e) => setNewAlias((prev) => ({ ...prev, productId: e.target.value }))}
                className="md:w-72 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900"
              >
                <option value="">Select Swago product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <button
                onClick={addAlias}
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
              >
                Add & save
              </button>
            </div>

            {config.productAliases.length === 0 ? (
              <p className="text-sm text-slate-500 py-2">No aliases yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto rounded-xl border border-slate-100">
                {config.productAliases.map((alias, index) => (
                  <li
                    key={`${alias.alias}-${alias.productId}-${index}`}
                    className="px-4 py-3 flex justify-between gap-3 text-sm"
                  >
                    <span>
                      <span className="font-medium text-slate-900">{alias.alias}</span>
                      <span className="text-slate-500">
                        {" "}
                        → {alias.productName || alias.productId}
                      </span>
                    </span>
                    <button
                      className="text-rose-600 hover:text-rose-800 shrink-0"
                      onClick={() => removeAlias(index)}
                      disabled={saving}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-900">Tracked emails</h2>
              <p className="text-sm text-slate-500">
                AI-extracted Amazon mail and inventory outcomes
              </p>
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900"
          >
            <option value="all">All statuses</option>
            <option value="pending_review">Needs review</option>
            <option value="applied">Inventory deducted</option>
            <option value="restored">Inventory restored</option>
            <option value="ignored">Ignored</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>

        {statusFilter === "all" && events.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <span
                key={status}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  STATUS_META[status]?.className || "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {STATUS_META[status]?.label || status}: {count}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {events.map((event) => {
            const meta = STATUS_META[event.status] || {
              label: event.status,
              className: "bg-slate-100 text-slate-600 border-slate-200",
            };
            const productLines = event.matchedItems?.length
              ? event.matchedItems.map(
                  (item) =>
                    `${item.productName} × ${item.quantity}${
                      item.matchType ? ` (${item.matchType})` : ""
                    }`
                )
              : event.extracted?.items?.map((item) => `${item.title} × ${item.quantity}`) || [];

            return (
              <article
                key={event._id}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-slate-900 truncate">
                      {event.subject || "(no subject)"}
                    </p>
                    <p className="text-xs text-slate-500 break-all">{event.fromEmail}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 capitalize">
                        {event.eventType}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                      {event.externalOrderId && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                          Order {event.externalOrderId}
                        </span>
                      )}
                      {typeof event.extracted?.confidence === "number" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                          Confidence {Math.round(event.extracted.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 shrink-0">
                    {new Date(event.receivedAt || event.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                      Products
                    </p>
                    {productLines.length ? (
                      <ul className="space-y-1 text-slate-800">
                        {productLines.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500">No products extracted</p>
                    )}
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                      Inventory / notes
                    </p>
                    {event.inventorySnapshot?.length ? (
                      <ul className="space-y-1 text-slate-800">
                        {event.inventorySnapshot.map((line, i) => (
                          <li key={i}>
                            {line.inventoryItemName || "Unit"} × {line.quantity}
                          </li>
                        ))}
                      </ul>
                    ) : event.extracted?.reasoning ? (
                      <p className="text-slate-600">{event.extracted.reasoning}</p>
                    ) : (
                      <p className="text-slate-500">—</p>
                    )}
                    {event.error && (
                      <p className="text-xs text-amber-700 mt-2 flex items-start gap-1">
                        <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        {event.error}
                      </p>
                    )}
                  </div>
                </div>

                {event.status === "pending_review" && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(!!event.matchedItems?.length || event.eventType === "cancel") && (
                      <button
                        onClick={() => eventAction(event._id, "apply")}
                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                      >
                        {event.eventType === "cancel" ? "Restore inventory" : "Apply inventory"}
                      </button>
                    )}
                    <button
                      onClick={() => eventAction(event._id, "ignore")}
                      className="border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white"
                    >
                      Ignore
                    </button>
                  </div>
                )}
              </article>
            );
          })}

          {events.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-500 text-sm">
              No emails processed yet. Connect Gmail, save senders, then click Check mail now.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
