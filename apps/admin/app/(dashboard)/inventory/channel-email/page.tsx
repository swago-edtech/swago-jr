"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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
  extracted?: { confidence?: number; reasoning?: string; items?: Array<{ title: string; quantity: number }> };
  matchedItems?: Array<{ productName: string; quantity: number; extractedTitle?: string; matchType?: string }>;
  error?: string;
};

export default function ChannelEmailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading...</div>}>
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
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info");
  const [config, setConfig] = useState({
    isEnabled: true,
    isConnected: false,
    connectedEmail: "",
    senderAllowlist: [] as string[],
    productAliases: [] as Alias[],
    lastSyncedAt: null as string | null,
  });
  const [senderText, setSenderText] = useState("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [events, setEvents] = useState<ChannelEvent[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [newAlias, setNewAlias] = useState({ alias: "", productId: "" });

  const load = async () => {
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

      if (configData.success) {
        setConfig(configData.config);
        setSenderText((configData.config.senderAllowlist || []).join("\n"));
      }
      if (productsData.success) {
        setProducts(
          (productsData.products || []).map((p: any) => ({
            _id: p._id,
            name: p.name,
          }))
        );
      }
      if (eventsData.success) {
        setEvents(eventsData.events || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  useEffect(() => {
    const oauthErrors: Record<string, string> = {
      missing_code:
        "Google did not return an authorization code. Close any popup and try Connect Gmail again.",
      oauth_failed:
        "Gmail connection failed. Confirm GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and that the redirect URI in Google Console matches this admin callback URL.",
    };

    if (searchParams.get("connected") === "1") {
      setMessageType("success");
      setMessage("Gmail connected successfully. Add Amazon sender addresses and run a sync.");
    } else {
      const error = searchParams.get("error");
      if (error) {
        setMessageType("error");
        setMessage(oauthErrors[error] || `Gmail connection failed (${error}). Try connecting again.`);
      }
    }
  }, [searchParams]);

  const connectGmail = async () => {
    const res = await fetch("/api/channel-email/google");
    const data = await res.json();
    if (data.success && data.url) {
      window.location.href = data.url;
    } else {
      setMessage(data.error || "Could not start Gmail connect");
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/channel-email/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled: config.isEnabled,
          senderAllowlist: senderText.split("\n").map((s) => s.trim()).filter(Boolean),
          productAliases: config.productAliases,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setMessageType("success");
        setMessage("All settings saved.");
      } else {
        setMessageType("error");
        setMessage(data.error || "Failed to save settings");
      }
    } finally {
      setSaving(false);
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
        setConfig(data.config);
        setMessageType("success");
        setMessage("Gmail disconnected.");
      } else {
        setMessageType("error");
        setMessage(data.error || "Failed to disconnect Gmail");
      }
    } finally {
      setDisconnecting(false);
    }
  };

  const runSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/channel-email/sync", { method: "POST" });
      const data = await res.json();
      setMessageType(data.success ? "info" : "error");
      setMessage(data.message || data.error || "Sync finished");
      await load();
    } finally {
      setSyncing(false);
    }
  };

  const addAlias = () => {
    if (!newAlias.alias || !newAlias.productId) return;
    const product = products.find((p) => p._id === newAlias.productId);
    setConfig((prev) => ({
      ...prev,
      productAliases: [
        ...prev.productAliases,
        { alias: newAlias.alias, productId: newAlias.productId, productName: product?.name },
      ],
    }));
    setNewAlias({ alias: "", productId: "" });
  };

  const eventAction = async (id: string, action: "apply" | "ignore") => {
    const res = await fetch(`/api/channel-email/events/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!data.success) {
      setMessageType("error");
      setMessage(data.error || "Action failed");
    }
    await load();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Channel Email Sync</h1>
          <p className="text-gray-600 mt-1">
            Watch a linked Gmail inbox for Amazon order emails, identify products, and keep BOM inventory in sync.
            These events are not storefront orders.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Local dev: cron does not run automatically — use <strong>Check mail now</strong> after connecting Gmail.
            Production uses a scheduled job on the web app; no cron setup needed locally.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save all settings"}
          </button>
          <button
            onClick={runSync}
            disabled={syncing || !config.isConnected}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium disabled:opacity-50"
          >
            {syncing ? "Checking mail..." : "Check mail now"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            messageType === "error"
              ? "bg-red-50 text-red-800"
              : messageType === "success"
                ? "bg-green-50 text-green-800"
                : "bg-indigo-50 text-indigo-800"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-1 bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Gmail account</h2>
          <p className="text-sm text-gray-600">
            {config.isConnected
              ? `Connected as ${config.connectedEmail}`
              : "No Gmail account linked yet."}
          </p>
          {config.lastSyncedAt && (
            <p className="text-xs text-gray-500">
              Last checked: {new Date(config.lastSyncedAt).toLocaleString("en-IN")}
            </p>
          )}
          <button
            onClick={connectGmail}
            className="w-full border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            {config.isConnected ? "Reconnect Gmail" : "Connect Gmail"}
          </button>
          {config.isConnected && (
            <button
              onClick={disconnectGmail}
              disabled={disconnecting}
              className="w-full border border-red-200 text-red-700 rounded-xl py-2.5 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              {disconnecting ? "Disconnecting..." : "Disconnect Gmail"}
            </button>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={config.isEnabled}
              onChange={(e) => setConfig((prev) => ({ ...prev, isEnabled: e.target.checked }))}
            />
            Enable automatic checking
          </label>
        </section>

        <section className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Amazon / sender emails</h2>
          <p className="text-sm text-gray-600">
            One address or domain per line. Only mail from these senders is analyzed.
          </p>
          <textarea
            value={senderText}
            onChange={(e) => setSenderText(e.target.value)}
            rows={6}
            className="w-full border border-gray-300 rounded-xl p-3 text-sm font-mono text-gray-900 placeholder:text-gray-400"
            placeholder="auto-confirm@amazon.in"
          />
          <p className="text-xs text-gray-500">
            Sender addresses and product aliases are saved together via &ldquo;Save all settings&rdquo; above.
          </p>
        </section>
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Product aliases</h2>
        <p className="text-sm text-gray-600">
          Map Amazon titles to Swago products when names do not match exactly.
        </p>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={newAlias.alias}
            onChange={(e) => setNewAlias((prev) => ({ ...prev, alias: e.target.value }))}
            placeholder="Amazon product title"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
          />
          <select
            value={newAlias.productId}
            onChange={(e) => setNewAlias((prev) => ({ ...prev, productId: e.target.value }))}
            className="md:w-72 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900"
          >
            <option value="">Select Swago product</option>
            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.name}
              </option>
            ))}
          </select>
          <button onClick={addAlias} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-medium">
            Add alias
          </button>
        </div>
        <ul className="divide-y divide-gray-100">
          {config.productAliases.map((alias, index) => (
            <li key={`${alias.alias}-${index}`} className="py-2 flex justify-between gap-3 text-sm">
              <span>
                <span className="font-medium text-gray-900">{alias.alias}</span>
                <span className="text-gray-500"> → {alias.productName || alias.productId}</span>
              </span>
              <button
                className="text-red-600"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    productAliases: prev.productAliases.filter((_, i) => i !== index),
                  }))
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-900">Identified emails</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900"
          >
            <option value="all">All</option>
            <option value="pending_review">Needs review</option>
            <option value="applied">Inventory deducted</option>
            <option value="restored">Inventory restored</option>
            <option value="ignored">Ignored</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b">
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Products</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event._id} className="border-b border-gray-100 align-top">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-black">{event.subject || "(no subject)"}</p>
                    <p className="text-xs text-black">{event.fromEmail}</p>
                    {event.externalOrderId && (
                      <p className="text-xs text-black">Order {event.externalOrderId}</p>
                    )}
                  </td>
                  <td className="py-3 pr-3 capitalize text-black">{event.eventType}</td>
                  <td className="py-3 pr-3 text-black">
                    {(event.matchedItems?.length
                      ? event.matchedItems.map((item) => `${item.productName} × ${item.quantity}`)
                      : event.extracted?.items?.map((item) => `${item.title} × ${item.quantity}`)
                    )?.join(", ") || "—"}
                    {event.error && <p className="text-xs text-amber-700 mt-1">{event.error}</p>}
                  </td>
                  <td className="py-3 pr-3 text-black">{event.status.replace("_", " ")}</td>
                  <td className="py-3 space-x-2 whitespace-nowrap text-black">
                    {event.status === "pending_review" && event.matchedItems?.length ? (
                      <button
                        onClick={() => eventAction(event._id, "apply")}
                        className="text-indigo-700 font-medium"
                      >
                        Apply inventory
                      </button>
                    ) : null}
                    {event.status === "pending_review" && (
                      <button
                        onClick={() => eventAction(event._id, "ignore")}
                        className="text-black font-medium"
                      >
                        Ignore
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-black text-sm">
                    No emails processed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
