import { connectDB, ChannelOrder, ensureChannelOrdersBackfilled } from "@swago/database";
import { formatPrice } from "@swago/utils";
import Link from "next/link";
import OrderDateCell from "./OrderDateCell";
import { marketplaceChannelFilter } from "@/lib/sales-query";

type MarketplaceChannel = "amazon" | "flipkart";

async function getMarketplaceOrders(
  channel: MarketplaceChannel,
  searchParams: { [key: string]: string | undefined }
) {
  await connectDB();
  await ensureChannelOrdersBackfilled(2000);

  const andClauses: Record<string, unknown>[] = [marketplaceChannelFilter(channel)];
  if (searchParams.q) {
    const searchRegex = new RegExp(searchParams.q, "i");
    andClauses.push({
      $or: [
        { orderId: searchRegex },
        { externalOrderId: searchRegex },
        { subject: searchRegex },
        { "items.name": searchRegex },
      ],
    });
  }
  if (searchParams.status === "Confirmed" || searchParams.status === "Cancelled") {
    andClauses.push({ status: searchParams.status });
  }

  const query = andClauses.length === 1 ? andClauses[0] : { $and: andClauses };
  const channelBase = marketplaceChannelFilter(channel);

  const page = parseInt(searchParams.page || "1", 10) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const [orders, totalCount, confirmedCount, cancelledCount] = await Promise.all([
    ChannelOrder.find(query).sort({ receivedAt: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    ChannelOrder.countDocuments(query),
    ChannelOrder.countDocuments({ $and: [channelBase, { status: "Confirmed" }] }),
    ChannelOrder.countDocuments({ $and: [channelBase, { status: "Cancelled" }] }),
  ]);

  return {
    orders: JSON.parse(JSON.stringify(orders)),
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      totalCount,
    },
    summary: { confirmedCount, cancelledCount },
  };
}

function buildMarketplaceHref(
  channel: MarketplaceChannel,
  searchParams: { [key: string]: string | undefined },
  overrides: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  params.set("channel", channel);
  const next = { ...searchParams, ...overrides };
  if (next.q) params.set("q", next.q);
  if (next.status) params.set("status", next.status);
  if (next.page && next.page !== "1") params.set("page", next.page);
  return `/orders?${params.toString()}`;
}

export default async function AmazonOrdersPanel(props: {
  searchParams: { [key: string]: string | undefined };
  channel?: MarketplaceChannel;
}) {
  const channel: MarketplaceChannel = props.channel === "flipkart" ? "flipkart" : "amazon";
  const label = channel === "flipkart" ? "Flipkart" : "Amazon";
  const accent =
    channel === "flipkart"
      ? { badge: "bg-yellow-100 text-yellow-800", ring: "ring-yellow-200" }
      : { badge: "bg-orange-100 text-orange-800", ring: "ring-orange-200" };
  const { orders, pagination, summary } = await getMarketplaceOrders(channel, props.searchParams);
  const q = props.searchParams.q || "";
  const status = props.searchParams.status || "";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`rounded-xl border border-gray-200 bg-white p-4 ring-1 ${accent.ring}`}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label} orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{pagination.totalCount}</p>
          <p className="text-xs text-gray-500 mt-1">Matching current filters</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confirmed</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{summary.confirmedCount}</p>
          <p className="text-xs text-gray-500 mt-1">Catalog estimate · stock applied when matched</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cancelled</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">{summary.cancelledCount}</p>
          <p className="text-xs text-gray-500 mt-1">Ledger restores stock on cancel</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
        <p>
          {label} marketplace sales use catalog price × qty.{" "}
          {channel === "amazon"
            ? "Email sync and SP-API share one stock ledger."
            : "Ingested via Flipkart Seller API into the same stock ledger."}{" "}
          Returns are review-only (no auto-restock).
        </p>
        <Link
          href="/inventory/channel-email"
          className="shrink-0 text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Open Channel Sync →
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 bg-white border border-gray-200 rounded-xl p-3">
        <input type="hidden" name="channel" value={channel} />
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Order ID, marketplace ID, product…"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            name="status"
            defaultValue={status}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
        >
          Filter
        </button>
        {(q || status) && (
          <Link
            href={`/orders?channel=${channel}`}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            Clear
          </Link>
        )}
      </form>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Order ID
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Marketplace ID
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Products
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Est. amount
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${accent.badge} mb-3`}
                    >
                      {label}
                    </span>
                    <p className="text-gray-700 font-medium">No {label} orders yet</p>
                    <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                      {channel === "flipkart"
                        ? "Set FLIPKART_APP_ID / FLIPKART_APP_SECRET and run Sync seller APIs from Channel Sync."
                        : "Connect Gmail and/or Amazon SP-API credentials, then sync from Channel Sync."}
                    </p>
                    <Link
                      href="/inventory/channel-email"
                      className="inline-flex mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                    >
                      Go to Channel Sync
                    </Link>
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="font-mono text-sm text-gray-900">{order.orderId}</div>
                      <span
                        className={`inline-flex mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${accent.badge}`}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-700">
                      {order.externalOrderId || "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-1 max-w-[200px]">
                        {(order.items || []).slice(0, 3).map((item: any, idx: number) => (
                          <div key={idx} className="text-sm text-gray-700 flex gap-1.5 items-center">
                            <span className="font-semibold whitespace-nowrap bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                              {item.quantity}x
                            </span>
                            <span className="truncate" title={item.name}>
                              {(item.name || "Item").slice(0, 28)}
                              {(item.name || "").length > 28 ? "…" : ""}
                            </span>
                          </div>
                        ))}
                        {(order.items || []).length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{order.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(order.total || 0)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.status === "Cancelled"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-600">
                      <OrderDateCell date={order.receivedAt || order.createdAt} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Link
                        href={`/orders/channel/${order._id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {pagination.currentPage > 1 && (
            <Link
              href={buildMarketplaceHref(channel, props.searchParams, {
                page: String(pagination.currentPage - 1),
              })}
              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          <span className="px-3 py-1.5 text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          {pagination.currentPage < pagination.totalPages && (
            <Link
              href={buildMarketplaceHref(channel, props.searchParams, {
                page: String(pagination.currentPage + 1),
              })}
              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
