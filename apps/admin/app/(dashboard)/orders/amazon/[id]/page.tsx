import { connectDB, ChannelOrder } from "@swago/database";
import { formatPrice } from "@swago/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AmazonOrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  await connectDB();
  const order = await ChannelOrder.findById(id).lean();
  if (!order) notFound();

  const data = JSON.parse(JSON.stringify(order));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link href="/orders?channel=amazon" className="text-sm text-indigo-600 hover:underline">
            ← Amazon orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{data.orderId}</h1>
          <p className="text-sm text-gray-500">
            Amazon marketplace order · estimated from catalog prices
          </p>
        </div>
        <span
          className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
            data.status === "Cancelled"
              ? "bg-rose-50 text-rose-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {data.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
          <h2 className="font-semibold text-gray-900">Details</h2>
          <p>
            <span className="text-gray-500">Amazon order id:</span>{" "}
            <span className="font-mono">{data.externalOrderId || "—"}</span>
          </p>
          <p>
            <span className="text-gray-500">From:</span> {data.fromEmail || "—"}
          </p>
          <p>
            <span className="text-gray-500">Subject:</span> {data.subject || "—"}
          </p>
          <p>
            <span className="text-gray-500">Email received:</span>{" "}
            {data.receivedAt
              ? new Date(data.receivedAt).toLocaleString("en-IN")
              : data.createdAt
                ? new Date(data.createdAt).toLocaleString("en-IN")
                : "—"}
          </p>
          <p>
            <span className="text-gray-500">Confirmed:</span>{" "}
            {data.confirmedAt ? new Date(data.confirmedAt).toLocaleString("en-IN") : "—"}
          </p>
          {data.status === "Cancelled" && data.cancelledAt && (
            <p>
              <span className="text-gray-500">Cancelled:</span>{" "}
              {new Date(data.cancelledAt).toLocaleString("en-IN")}
            </p>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
          <h2 className="font-semibold text-gray-900">Totals</h2>
          <p>
            <span className="text-gray-500">Units:</span> {data.itemCount || 0}
          </p>
          <p>
            <span className="text-gray-500">Estimated total:</span>{" "}
            <span className="font-semibold">{formatPrice(data.total || 0)}</span>
          </p>
          <p className="text-xs text-gray-500">
            Amount uses current catalog product prices × quantity (Amazon payout may differ).
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">
          Products
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left">Product</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Unit</th>
              <th className="px-4 py-2 text-right">Line</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data.items || []).map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="px-4 py-2.5">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  {item.extractedTitle && item.extractedTitle !== item.name && (
                    <p className="text-xs text-gray-500">Email: {item.extractedTitle}</p>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">{item.quantity}</td>
                <td className="px-4 py-2.5 text-right">{formatPrice(item.price || 0)}</td>
                <td className="px-4 py-2.5 text-right font-medium">
                  {formatPrice((item.price || 0) * (item.quantity || 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!!data.inventorySnapshot?.length && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-semibold text-gray-900 mb-2">BOM units moved</h2>
          <ul className="text-sm space-y-1 text-gray-700">
            {data.inventorySnapshot.map((line: any, idx: number) => (
              <li key={idx}>
                {line.inventoryItemName || "Unit"} × {line.quantity}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
