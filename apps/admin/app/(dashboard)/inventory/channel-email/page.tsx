"use client";

import { Suspense, useCallback, useEffect, useState, Fragment } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Link2,
  Loader2,
  Mail,
  RefreshCw,
  Save,
  Settings2,
  Tags,
  Unlink,
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

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending_review: {
    label: "Review",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  applied: {
    label: "Stock cut",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  restored: {
    label: "Stock returned",
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

const TYPE_LABEL: Record<string, string> = {
  order: "New order",
  cancel: "Cancel",
  unknown: "Other",
};

/** Strip Amazon noise like [ACTION REQUIRED] from the subject we show. */
function cleanSubject(subject?: string): string {
  const cleaned = String(subject || "")
    .replace(/^\[[^\]]*\]\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "(no subject)";
}

function productLines(event: ChannelEvent): string[] {
  const raw = event.matchedItems?.length
    ? event.matchedItems.map((i) => ({
        name: String(i.productName || i.extractedTitle || "").trim(),
        quantity: Math.max(1, Number(i.quantity) || 1),
      }))
    : (event.extracted?.items || []).map((i) => ({
        name: String(i.title || "").trim(),
        quantity: Math.max(1, Number(i.quantity) || 1),
      }));

  const totals = new Map<string, { name: string; quantity: number }>();
  for (const item of raw) {
    if (!item.name) continue;
    const key = item.name.toLowerCase().replace(/\s+/g, " ");
    const existing = totals.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      totals.set(key, { name: item.name, quantity: item.quantity });
    }
  }

  return Array.from(totals.values()).map((item) => `${item.quantity}× ${item.name}`);
}

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aliasesOpen, setAliasesOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
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
        fetch(`/api/channel-email/events?status=${statusFilter}&page=${page}&limit=20`),
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
      if (eventsData.success) {
        setEvents(eventsData.events || []);
        if (eventsData.pagination) setPagination(eventsData.pagination);
        if (eventsData.statusCounts) setStatusCounts(eventsData.statusCounts);
      }
    } finally {
      setLoading(false);
    }
  }, [applyConfig, statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    const oauthErrors: Record<string, string> = {
      missing_code:
        "Google did not return an authorization code. Close any popup and try Connect Gmail again.",
      oauth_failed:
        "Gmail connection failed. Confirm GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and that the redirect URI in Google Console matches this admin callback URL.",
    };

    if (searchParams.get("connected") === "1") {
      showMessage("Gmail connected. Confirm Amazon sender emails below, then check mail.", "success");
      setSettingsOpen(true);
    } else {
      const error = searchParams.get("error");
      if (error) {
        showMessage(
          oauthErrors[error] || `Gmail connection failed (${error}). Try connecting again.`,
          "error"
        );
        setSettingsOpen(true);
      }
    }
  }, [searchParams, showMessage]);

  const isSetupComplete = Boolean(config.isConnected && config.senderAllowlist.length > 0);

  useEffect(() => {
    if (!loading && !isSetupComplete) setSettingsOpen(true);
  }, [loading, isSetupComplete]);

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
        setSettingsOpen(true);
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
      showMessage(action === "apply" ? "Inventory updated." : "Event ignored.", "success");
    }
    await load();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 w-full">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Channel Email Sync
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Amazon mail updates BOM inventory. Website orders are unchanged.
            {config.lastSyncedAt && (
              <>
                {" "}
                Last checked{" "}
                <span className="text-slate-700">
                  {new Date(config.lastSyncedAt).toLocaleString("en-IN")}
                </span>
                .
              </>
            )}
            {" "}
            Auto-check runs with the app worker on the server; use Check mail now anytime.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSettingsOpen((o) => !o)}
            className="inline-flex items-center gap-2 border border-slate-300 bg-white text-slate-800 px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-slate-50"
          >
            <Settings2 className="h-4 w-4" />
            {settingsOpen ? "Hide settings" : "Settings"}
          </button>
          <button
            onClick={runSync}
            disabled={syncing || !config.isConnected}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3.5 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
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

      {!isSetupComplete && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          <p className="font-semibold">Finish setup to start syncing</p>
          <ol className="mt-2 list-decimal list-inside space-y-1 text-amber-800">
            {!config.isConnected && <li>Connect the Gmail inbox that receives Amazon order mail.</li>}
            {!config.senderAllowlist.length && (
              <li>Add Amazon sender addresses (e.g. auto-confirm@amazon.in).</li>
            )}
            <li>Optionally add product aliases, then click Check mail now.</li>
          </ol>
        </div>
      )}

      {/* Tracked emails — primary */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 md:px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900">Tracked emails</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Amazon messages that may change stock — open a row for details
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["pending_review", "ignored", "applied", "restored"] as const).map((status) =>
              statusCounts[status] ? (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                    STATUS_META[status].className
                  } ${statusFilter === status ? "ring-2 ring-indigo-300" : ""}`}
                >
                  {STATUS_META[status].label} {statusCounts[status]}
                </button>
              ) : null
            )}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-900"
            >
              <option value="all">All</option>
              <option value="pending_review">Review</option>
              <option value="applied">Stock cut</option>
              <option value="restored">Stock returned</option>
              <option value="ignored">Ignored</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>
        </div>

        {!isSetupComplete ? (
          <div className="px-5 py-14 text-center text-slate-500 text-sm">
            Complete setup in Settings below, then check mail to see tracked emails here.
          </div>
        ) : events.length === 0 ? (
          <div className="px-5 py-14 text-center text-slate-500 text-sm">
            No emails yet. Click <strong>Check mail now</strong> to scan the connected inbox.
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-2.5 font-semibold w-8" />
                  <th className="px-2 py-2.5 font-semibold">Message</th>
                  <th className="px-2 py-2.5 font-semibold w-28">Kind</th>
                  <th className="px-2 py-2.5 font-semibold">Products</th>
                  <th className="px-2 py-2.5 font-semibold w-32">Status</th>
                  <th className="px-2 py-2.5 font-semibold w-36">When</th>
                  <th className="px-4 py-2.5 font-semibold w-44 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const meta = STATUS_META[event.status] || {
                    label: event.status,
                    className: "bg-slate-100 text-slate-600 border-slate-200",
                  };
                  const open = expandedId === event._id;
                  const lines = productLines(event);
                  const canApplyOrder =
                    event.status === "pending_review" &&
                    event.eventType !== "cancel" &&
                    !!event.matchedItems?.length;
                  const canRestore =
                    event.status === "pending_review" &&
                    event.eventType === "cancel" &&
                    !!event.externalOrderId;

                  return (
                    <Fragment key={event._id}>
                      <tr className="border-b border-slate-100 hover:bg-slate-50/70 align-top">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedId(open ? null : event._id)}
                            className="text-slate-400 hover:text-slate-700"
                            aria-label={open ? "Collapse" : "Expand"}
                          >
                            {open ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-2 py-3 min-w-0">
                          <p className="font-medium text-slate-900 line-clamp-2 max-w-lg">
                            {cleanSubject(event.subject)}
                          </p>
                          {event.externalOrderId && (
                            <p className="text-xs text-slate-500 mt-0.5 font-mono">
                              {event.externalOrderId}
                            </p>
                          )}
                        </td>
                        <td className="px-2 py-3 text-slate-700">
                          {TYPE_LABEL[event.eventType] || "Other"}
                        </td>
                        <td className="px-2 py-3 text-slate-700 max-w-[280px]">
                          {lines.length === 0 ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <ul className="space-y-0.5">
                              {lines.slice(0, 3).map((line, i) => (
                                <li key={i} className="line-clamp-1">
                                  {line}
                                </li>
                              ))}
                              {lines.length > 3 && (
                                <li className="text-xs text-slate-500">+{lines.length - 3} more</li>
                              )}
                            </ul>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          <span
                            className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${meta.className}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(event.receivedAt || event.createdAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {event.status === "pending_review" ? (
                            <div className="inline-flex flex-wrap items-center justify-end gap-2">
                              {canApplyOrder && (
                                <button
                                  type="button"
                                  onClick={() => eventAction(event._id, "apply")}
                                  className="inline-flex cursor-pointer items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98]"
                                >
                                  Cut stock
                                </button>
                              )}
                              {canRestore && (
                                <button
                                  type="button"
                                  onClick={() => eventAction(event._id, "apply")}
                                  className="inline-flex cursor-pointer items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98]"
                                >
                                  Return stock
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => eventAction(event._id, "ignore")}
                                className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98]"
                              >
                                Ignore
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                              Done
                            </span>
                          )}
                        </td>
                      </tr>
                      {open && (
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <td colSpan={7} className="px-4 md:px-8 py-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                  From
                                </p>
                                <p className="text-slate-800 break-all">{event.fromEmail}</p>
                                <p className="text-xs text-slate-500 mt-2">Original subject</p>
                                <p className="text-slate-700 text-xs mt-0.5">{event.subject || "—"}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                  Products
                                </p>
                                <ul className="space-y-0.5 text-slate-800">
                                  {(lines.length ? lines : ["No products found"]).map((line, i) => (
                                    <li key={i}>{line}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                                  Notes
                                </p>
                                {event.inventorySnapshot?.length ? (
                                  <ul className="space-y-0.5 text-slate-800">
                                    {event.inventorySnapshot.map((line, i) => (
                                      <li key={i}>
                                        {line.inventoryItemName || "Unit"} × {line.quantity}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-slate-600">
                                    {event.error || event.extracted?.reasoning || "—"}
                                  </p>
                                )}
                                {event.error && event.inventorySnapshot?.length ? (
                                  <p className="text-xs text-amber-700 mt-1">{event.error}</p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-3 border-t border-slate-100 text-sm text-slate-600">
            <span>
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} emails
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
          </>
        )}
      </section>

      {/* One-time settings — lower / collapsible */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setSettingsOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 px-4 md:px-5 py-4 text-left hover:bg-slate-50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Settings2 className="h-4 w-4 text-indigo-600 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900">Connection & settings</h2>
              <p className="text-xs text-slate-500 truncate">
                {config.isConnected
                  ? `Gmail · ${config.connectedEmail}`
                  : "Gmail not connected"}
                {" · "}
                {config.senderAllowlist.length} sender
                {config.senderAllowlist.length === 1 ? "" : "s"}
                {" · "}
                {config.productAliases.length} alias
                {config.productAliases.length === 1 ? "" : "es"}
              </p>
            </div>
          </div>
          {settingsOpen ? (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {settingsOpen && (
          <div className="border-t border-slate-100 px-4 md:px-5 py-5 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-600" />
                  <h3 className="font-medium text-slate-900">Gmail</h3>
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
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={connectGmail}
                    className="inline-flex items-center gap-2 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                  >
                    <Link2 className="h-4 w-4" />
                    {config.isConnected ? "Reconnect" : "Connect Gmail"}
                  </button>
                  {config.isConnected && (
                    <button
                      onClick={disconnectGmail}
                      disabled={disconnecting}
                      className="inline-flex items-center gap-2 border border-rose-200 text-rose-700 rounded-xl px-3.5 py-2 text-sm font-medium hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Unlink className="h-4 w-4" />
                      {disconnecting ? "…" : "Disconnect"}
                    </button>
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={config.isEnabled}
                    onChange={(e) => toggleEnabled(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Enable automatic checking (when worker is running)
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-slate-900">Amazon sender emails</h3>
                  <button
                    onClick={saveAll}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </button>
                </div>
                <p className="text-xs text-slate-500">One address or domain per line.</p>
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
                  rows={6}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder={"auto-confirm@amazon.in\norder-update@amazon.in"}
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setAliasesOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <Tags className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium text-slate-900">
                    Product aliases ({config.productAliases.length})
                  </span>
                </div>
                {aliasesOpen ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
              </button>
              {aliasesOpen && (
                <div className="border-t border-slate-100 px-4 py-4 space-y-3">
                  <div className="flex flex-col md:flex-row gap-2">
                    <input
                      value={newAlias.alias}
                      onChange={(e) => setNewAlias((prev) => ({ ...prev, alias: e.target.value }))}
                      placeholder="Amazon product title"
                      className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                    />
                    <select
                      value={newAlias.productId}
                      onChange={(e) =>
                        setNewAlias((prev) => ({ ...prev, productId: e.target.value }))
                      }
                      className="md:w-64 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900"
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
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                    >
                      Add & save
                    </button>
                  </div>
                  {config.productAliases.length === 0 ? (
                    <p className="text-sm text-slate-500">No aliases yet.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100 max-h-56 overflow-y-auto rounded-xl border border-slate-100">
                      {config.productAliases.map((alias, index) => (
                        <li
                          key={`${alias.alias}-${alias.productId}-${index}`}
                          className="px-3 py-2.5 flex justify-between gap-3 text-sm"
                        >
                          <span>
                            <span className="font-medium text-slate-900">{alias.alias}</span>
                            <span className="text-slate-500">
                              {" "}
                              → {alias.productName || alias.productId}
                            </span>
                          </span>
                          <button
                            className="text-rose-600 shrink-0"
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
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
