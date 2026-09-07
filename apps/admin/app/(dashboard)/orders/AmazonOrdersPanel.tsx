import { connectDB, ChannelOrder, ensureChannelOrdersBackfilled } from "@swago/database";
import { formatPrice } from "@swago/utils";
import Link from "next/link";
import OrderDateCell from "./OrderDateCell";

async function getAmazonOrders(searchParams: { [key: string]: string | undefined }) {
  await connectDB();
  await ensureChannelOrdersBackfilled(2000);

  const query: any = { channel: "amazon" };
  if (searchParams.q) {
    const searchRegex = new RegExp(searchParams.q, "i");
    query.$or = [
      { orderId: searchRegex },
      { externalOrderId: searchRegex },
      { subject: searchRegex },
      { "items.name": searchRegex },
    ];
  }
  if (searchParams.status === "Confirmed" || searchParams.status === "Cancelled") {
    query.status = searchParams.status;
  }

  const page = parseInt(searchParams.page || "1", 10) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const [orders, totalCount] = await Promise.all([
    ChannelOrder.find(query).sort({ receivedAt: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    ChannelOrder.countDocuments(query),
  ]);

  return {
    orders: JSON.parse(JSON.stringify(orders)),
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      totalCount,
    },
  };
}

function buildAmazonHref(
  searchParams: { [key: string]: string | undefined },
  overrides: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  params.set("channel", "amazon");
  const next = { ...searchParams, ...overrides };
  if (next.q) params.set("q", next.q);
  if (next.status) params.set("status", next.status);
  if (next.page && next.page !== "1") params.set("page", next.page);
  return `/orders?${params.toString()}`;
}

export default async function AmazonOrdersPanel(props: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { orders, pagination } = await getAmazonOrders(props.searchParams);
  const q = props.searchParams.q || "";
  const status = props.searchParams.status || "";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
        <p>
          Amazon marketplace orders synced from channel email (catalog price × qty for estimated
          value).
        </p>
        <p>Total: {pagination.totalCount}</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 bg-white border border-gray-200 rounded-xl p-3">
        <input type="hidden" name="channel" value="amazon" />
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Order ID, Amazon ID, product…"
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
            href="/orders?channel=amazon"
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
                  Amazon ID
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
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No Amazon orders yet. Apply inventory from Channel Email for confirmed sales.
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-sm text-gray-900">
                      {order.orderId}
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
                        href={`/orders/amazon/${order._id}`}
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
              href={buildAmazonHref(props.searchParams, {
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
              href={buildAmazonHref(props.searchParams, {
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
