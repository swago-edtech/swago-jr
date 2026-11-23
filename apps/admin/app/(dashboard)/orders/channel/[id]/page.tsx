import type { ComponentType, ReactNode } from "react";
import { connectDB, ChannelOrder } from "@swago/database";
import { formatPrice } from "@swago/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Store,
  Calendar,
  Hash,
  Mail,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function formatIst(value?: string | Date | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChannelNavTabs({ active }: { active: "amazon" | "flipkart" }) {
  const tabs = [
    { key: "all", label: "All", href: "/orders?channel=all" },
    { key: "website", label: "Website", href: "/orders?channel=website" },
    { key: "amazon", label: "Amazon", href: "/orders?channel=amazon" },
    { key: "flipkart", label: "Flipkart", href: "/orders?channel=flipkart" },
  ] as const;

  return (
    <div className="flex bg-gray-100 p-1 rounded-lg">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? active === "amazon"
                  ? "bg-white text-orange-700 shadow-sm"
                  : "bg-white text-yellow-800 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p
          className={`mt-0.5 text-sm font-semibold text-gray-900 break-words ${
            mono ? "font-mono text-[13px]" : ""
          }`}
        >
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default async function ChannelOrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  await connectDB();
  const order = await ChannelOrder.findById(id).lean();
  if (!order) notFound();

  const data = JSON.parse(JSON.stringify(order));
  const channel: "amazon" | "flipkart" =
    data.channel === "flipkart" ? "flipkart" : "amazon";
  const label = channel === "flipkart" ? "Flipkart" : "Amazon";
  const isCancelled = data.status === "Cancelled";
  const accent =
    channel === "flipkart"
      ? {
          soft: "bg-yellow-50",
          text: "text-yellow-900",
          ring: "ring-yellow-200",
          badge: "bg-yellow-100 text-yellow-900",
          bar: "bg-yellow-500",
        }
      : {
          soft: "bg-orange-50",
          text: "text-orange-900",
          ring: "ring-orange-200",
          badge: "bg-orange-100 text-orange-900",
          bar: "bg-orange-500",
        };

  const items = Array.isArray(data.items) ? data.items : [];
  const received =
    data.receivedAt || data.createdAt
      ? formatIst(data.receivedAt || data.createdAt)
      : "—";

  return (
    <div className="space-y-6">
      {/* Top bar: back + channel tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/orders?channel=${channel}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {label} orders
        </Link>
        <ChannelNavTabs active={channel} />
      </div>

      {/* Hero header */}
      <div
        className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ${accent.ring}`}
      >
        <div className={`absolute inset-y-0 left-0 w-1.5 ${accent.bar}`} />
        <div className="flex flex-col gap-4 p-6 pl-7 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${accent.badge}`}
              >
                <Store className="h-3.5 w-3.5" />
                {label}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                  isCancelled
                    ? "bg-rose-100 text-rose-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {isCancelled ? (
                  <XCircle className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {data.status}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl break-all">
                {data.orderId}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Marketplace order · catalog estimate (payout may differ)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
            <div className={`rounded-xl ${accent.soft} px-4 py-3`}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Units
              </p>
              <p className={`mt-1 text-2xl font-bold ${accent.text}`}>
                {data.itemCount || 0}
              </p>
            </div>
            <div className={`rounded-xl ${accent.soft} px-4 py-3`}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Est. total
              </p>
              <p className={`mt-1 text-2xl font-bold ${accent.text}`}>
                {formatPrice(data.total || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left: meta */}
        <div className="space-y-6 xl:col-span-1">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-base font-bold text-gray-900">Order details</h2>
            <p className="mb-2 text-xs text-gray-500">Source identifiers & timestamps (IST)</p>
            <MetaRow icon={Store} label="Channel" value={label} />
            <MetaRow
              icon={Hash}
              label={`${label} order id`}
              value={data.externalOrderId || "—"}
              mono
            />
            {channel === "amazon" && (
              <>
                <MetaRow icon={Mail} label="From" value={data.fromEmail || "—"} />
                <MetaRow
                  icon={Mail}
                  label="Subject"
                  value={data.subject || "—"}
                />
              </>
            )}
            <MetaRow
              icon={Calendar}
              label={channel === "amazon" ? "Email / API received" : "API received"}
              value={received}
            />
            <MetaRow
              icon={CheckCircle2}
              label="Confirmed"
              value={formatIst(data.confirmedAt)}
            />
            {isCancelled && (
              <MetaRow
                icon={XCircle}
                label="Cancelled"
                value={formatIst(data.cancelledAt)}
              />
            )}
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">Returns & stock</h3>
                <p className="mt-1 text-sm leading-relaxed text-amber-800">
                  Returns / replacements are review-only. Stock is not auto-restored from
                  marketplace returns. Amount uses current catalog prices × quantity.
                </p>
              </div>
            </div>
          </section>

          {!!data.inventorySnapshot?.length && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Boxes className="h-4 w-4 text-gray-500" />
                <h2 className="text-base font-bold text-gray-900">BOM units moved</h2>
              </div>
              <ul className="space-y-2">
                {data.inventorySnapshot.map((line: any, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-gray-900">
                      {line.inventoryItemName || "Unit"}
                    </span>
                    <span className="font-bold text-gray-700">× {line.quantity}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Right: products */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm xl:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-500" />
              <div>
                <h2 className="text-base font-bold text-gray-900">Products</h2>
                <p className="text-xs text-gray-500">
                  {items.length} line{items.length === 1 ? "" : "s"} · catalog estimate
                </p>
              </div>
            </div>
            <p className="text-sm font-bold text-gray-900">{formatPrice(data.total || 0)}</p>
          </div>

          {items.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-500">
              No line items on this order
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3 text-right">Qty</th>
                    <th className="px-5 py-3 text-right">Unit</th>
                    <th className="px-5 py-3 text-right">Line</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item: any, idx: number) => {
                    const qty = item.quantity || 0;
                    const unit = item.price || 0;
                    const line = unit * qty;
                    return (
                      <tr key={idx} className="hover:bg-gray-50/80">
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image}
                                alt=""
                                className="h-12 w-12 rounded-lg object-cover border border-gray-200 bg-white"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900">
                                {item.name || "Unknown product"}
                              </p>
                              {item.extractedTitle &&
                                item.extractedTitle !== item.name && (
                                  <p className="mt-0.5 text-xs text-gray-600">
                                    Listing: {item.extractedTitle}
                                  </p>
                                )}
                              {item.matchType && (
                                <span className="mt-1 inline-flex rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                                  Match: {item.matchType}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900">
                          {qty}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-medium text-gray-800">
                          {formatPrice(unit)}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-bold text-gray-900">
                          {formatPrice(line)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td
                      colSpan={3}
                      className="px-5 py-3.5 text-right text-sm font-semibold text-gray-600"
                    >
                      Estimated total
                    </td>
                    <td className="px-5 py-3.5 text-right text-base font-bold text-gray-900">
                      {formatPrice(data.total || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
