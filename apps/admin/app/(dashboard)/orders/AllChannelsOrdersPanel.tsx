import { connectDB, Order, ChannelOrder, ensureChannelOrdersBackfilled } from "@swago/database";
import { formatPrice } from "@swago/utils";
import Link from "next/link";
import OrderDateCell from "./OrderDateCell";
import { marketplaceChannelFilter } from "@/lib/sales-query";

type UnifiedRow = {
  key: string;
  kind: "website" | "amazon" | "flipkart";
  orderId: string;
  href: string;
  customerOrMarketId: string;
  products: { quantity: number; name: string }[];
  total: number;
  status: string;
  date: string | Date | null;
};

async function getUnifiedOrders(searchParams: { [key: string]: string | undefined }) {
  await connectDB();
  await ensureChannelOrdersBackfilled(2000);

  const page = parseInt(searchParams.page || "1", 10) || 1;
  const limit = 25;
  const q = searchParams.q || "";

  const websiteQuery: any = {
    status: { $nin: [/^abandoned$/i, /^failed$/i, /^pending$/i] },
  };
  const marketQuery: any = {};

  if (q) {
    const searchRegex = new RegExp(q, "i");
    websiteQuery.$or = [
      { orderId: searchRegex },
      { name: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
    ];
    marketQuery.$or = [
      { orderId: searchRegex },
      { externalOrderId: searchRegex },
      { subject: searchRegex },
      { "items.name": searchRegex },
    ];
  }

  const [websiteOrders, marketOrders, websiteCount, amazonCount, flipkartCount] =
    await Promise.all([
      Order.find(websiteQuery)
        .select("orderId name phone total status createdAt items paymentMethod")
        .sort({ createdAt: -1 })
        .limit(80)
        .lean(),
      ChannelOrder.find(marketQuery)
        .select("orderId externalOrderId total status createdAt receivedAt items channel")
        .sort({ receivedAt: -1, createdAt: -1 })
        .limit(80)
        .lean(),
      Order.countDocuments(websiteQuery),
      ChannelOrder.countDocuments(marketplaceChannelFilter("amazon")),
      ChannelOrder.countDocuments(marketplaceChannelFilter("flipkart")),
    ]);

  const rows: UnifiedRow[] = [];

  for (const o of websiteOrders as any[]) {
    rows.push({
      key: `web-${o._id}`,
      kind: "website",
      orderId: o.orderId || String(o._id).slice(-8),
      href: `/orders/${o._id}`,
      customerOrMarketId: o.name || o.phone || "—",
      products: (o.items || []).map((i: any) => ({
        quantity: i.quantity || 0,
        name: i.name || "Item",
      })),
      total: o.total || 0,
      status: o.status || "—",
      date: o.createdAt,
    });
  }

  for (const o of marketOrders as any[]) {
    // Legacy rows without channel are Amazon
    const kind = o.channel === "flipkart" ? "flipkart" : "amazon";
    rows.push({
      key: `ch-${o._id}`,
      kind,
      orderId: o.orderId,
      href: `/orders/channel/${o._id}`,
      customerOrMarketId: o.externalOrderId || "—",
      products: (o.items || []).map((i: any) => ({
        quantity: i.quantity || 0,
        name: i.name || "Item",
      })),
      total: o.total || 0,
      status: o.status || "—",
      date: o.receivedAt || o.createdAt,
    });
  }

  rows.sort((a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : 0;
    const tb = b.date ? new Date(b.date).getTime() : 0;
    return tb - ta;
  });

  const totalCount = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const slice = rows.slice((page - 1) * limit, page * limit);

  return {
    rows: slice,
    pagination: { currentPage: page, totalPages, totalCount },
    summary: {
      websiteCount,
      amazonCount,
      flipkartCount,
      combined: websiteCount + amazonCount + flipkartCount,
    },
  };
}

const channelBadge: Record<string, string> = {
  website: "bg-slate-100 text-slate-800",
  amazon: "bg-orange-100 text-orange-900",
  flipkart: "bg-yellow-100 text-yellow-900",
};

export default async function AllChannelsOrdersPanel(props: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { rows, pagination, summary } = await getUnifiedOrders(props.searchParams);
  const q = props.searchParams.q || "";

  function pageHref(page: number) {
    const params = new URLSearchParams();
    params.set("channel", "all");
    if (q) params.set("q", q);
    if (page > 1) params.set("page", String(page));
    return `/orders?${params.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">All channels</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summary.combined}</p>
        </div>
        <Link
          href="/orders?channel=website"
          className="rounded-xl border border-gray-200 bg-white p-4 hover:border-slate-300 transition-colors"
        >
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Website</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.websiteCount}</p>
        </Link>
        <Link
          href="/orders?channel=amazon"
          className="rounded-xl border border-orange-100 bg-orange-50/50 p-4 hover:border-orange-200 transition-colors"
        >
          <p className="text-xs font-medium text-orange-700/80 uppercase tracking-wide">Amazon</p>
          <p className="text-2xl font-bold text-orange-900 mt-1">{summary.amazonCount}</p>
        </Link>
        <Link
          href="/orders?channel=flipkart"
          className="rounded-xl border border-yellow-100 bg-yellow-50/50 p-4 hover:border-yellow-200 transition-colors"
        >
          <p className="text-xs font-medium text-yellow-800/80 uppercase tracking-wide">Flipkart</p>
          <p className="text-2xl font-bold text-yellow-900 mt-1">{summary.flipkartCount}</p>
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 bg-white border border-gray-200 rounded-xl p-3">
        <input type="hidden" name="channel" value="all" />
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Order ID, customer, marketplace ID, product…"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
        >
          Search
        </button>
        {q && (
          <Link
            href="/orders?channel=all"
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            Clear
          </Link>
        )}
      </form>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Channel", "Order", "Customer / Market ID", "Products", "Amount", "Status", "Date", ""].map(
                  (h) => (
                    <th
                      key={h || "actions"}
                      className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center text-sm text-gray-500">
                    No orders match this search
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.key} className="hover:bg-gray-50/80">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${channelBadge[row.kind]}`}
                      >
                        {row.kind}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {row.orderId}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-800 max-w-[160px] truncate">
                      {row.customerOrMarketId}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-0.5 max-w-[200px]">
                        {row.products.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="text-sm text-gray-800 flex gap-1.5 items-center">
                            <span className="font-semibold whitespace-nowrap bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-700">
                              {item.quantity}x
                            </span>
                            <span className="truncate text-gray-800">
                              {item.name.slice(0, 28)}
                              {item.name.length > 28 ? "…" : ""}
                            </span>
                          </div>
                        ))}
                        {row.products.length > 2 && (
                          <span className="text-xs text-gray-500">+{row.products.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                      {formatPrice(row.total)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          row.status === "Cancelled" || row.status === "RTO"
                            ? "bg-rose-50 text-rose-700"
                            : row.status === "Delivered" || row.status === "Confirmed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                      <OrderDateCell
                        date={row.date ? new Date(row.date).toISOString() : new Date(0).toISOString()}
                      />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Link
                        href={row.href}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
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
              href={pageHref(pagination.currentPage - 1)}
              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 text-gray-800"
            >
              Previous
            </Link>
          )}
          <span className="px-3 py-1.5 text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          {pagination.currentPage < pagination.totalPages && (
            <Link
              href={pageHref(pagination.currentPage + 1)}
              className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 text-gray-800"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
