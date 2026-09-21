"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, Settings, Search, AlertTriangle, Target, Box } from "lucide-react";

type ItemSnap = {
  name: string;
  currentStock: number;
  lowStockThreshold?: number;
  targetQuantity?: number;
};

type DashboardProduct = {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  stock: number;
  hasConfig: boolean;
  componentCount: number;
  boxesPossible: number;
  limitingComponent?: string | null;
  lowStockItems: ItemSnap[];
  belowTargetItems: ItemSnap[];
  belowOptimalItems: ItemSnap[];
  productHealth: "out" | "low" | "ok";
  lowStockThreshold: number;
};

const PAGE_SIZE = 10;

function needsAttention(p: DashboardProduct) {
  if (!p.hasConfig) return false;
  return (
    p.productHealth !== "ok" ||
    p.lowStockItems.length > 0 ||
    p.belowTargetItems.length > 0 ||
    p.belowOptimalItems.length > 0
  );
}

function attentionRank(p: DashboardProduct) {
  if (p.productHealth === "out" || p.lowStockItems.length) return 0;
  if (p.productHealth === "low" || p.belowTargetItems.length) return 1;
  return 2;
}

function shortfall(have: number, need: number) {
  return Math.max(0, need - have);
}

function ChipList({
  items,
  mode,
}: {
  items: ItemSnap[];
  mode: "low" | "target";
}) {
  if (!items.length) return null;
  return (
    <div className="mt-1.5 space-y-1 max-h-24 overflow-y-auto">
      {items.slice(0, 5).map((item) => {
        const need =
          mode === "low"
            ? Number(item.lowStockThreshold) || 0
            : Number(item.targetQuantity) || 0;
        const have = Number(item.currentStock) || 0;
        const gap = shortfall(have, need);

        return (
          <div
            key={item.name}
            className="flex items-center gap-1.5 rounded-md bg-white/90 border border-black/5 px-1.5 py-0.5 text-[10px] leading-none min-w-0"
            title={`${item.name}: ${have}/${need || "—"} · need ${gap}`}
          >
            <span className="font-semibold text-slate-900 truncate min-w-0">{item.name}</span>
            <span className="ml-auto shrink-0 tabular-nums text-slate-700">
              <span className="font-bold text-slate-900">{have}</span>
              <span className="text-slate-400">/</span>
              <span>{need || "—"}</span>
              {gap > 0 ? <span className="ml-1 font-bold text-rose-700">need {gap}</span> : null}
            </span>
          </div>
        );
      })}
      {items.length > 5 && (
        <p className="text-[10px] font-semibold text-slate-600">+{items.length - 5} more</p>
      )}
    </div>
  );
}

function MiniCard({
  label,
  count,
  tone,
  icon: Icon,
  items,
  itemMode,
  limiter,
}: {
  label: string;
  count: number | string;
  tone: "ok" | "warn" | "danger" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  items?: ItemSnap[];
  itemMode?: "low" | "target";
  limiter?: string | null;
}) {
  const tones = {
    ok: "border-emerald-200 bg-emerald-50",
    warn: "border-amber-200 bg-amber-50",
    danger: "border-rose-200 bg-rose-50",
    neutral: "border-slate-200 bg-slate-50",
  };
  const nums = {
    ok: "text-emerald-800",
    warn: "text-amber-800",
    danger: "text-rose-800",
    neutral: "text-slate-800",
  };
  return (
    <div className={`rounded-lg border px-2.5 py-2 ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          {label}
        </span>
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <p className={`text-lg font-bold tabular-nums leading-none mt-0.5 ${nums[tone]}`}>{count}</p>
      {limiter ? (
        <p className="text-[10px] text-slate-600 mt-1 truncate" title={limiter}>
          Limited by <span className="font-bold text-slate-900">{limiter}</span>
        </p>
      ) : null}
      {items && itemMode ? <ChipList items={items} mode={itemMode} /> : null}
    </div>
  );
}

export default function InventoryDashboardPage() {
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/inventory/config");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = useMemo(
    () => products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const attentionRows = useMemo(
    () =>
      filtered
        .filter(needsAttention)
        .sort((a, b) => attentionRank(a) - attentionRank(b) || a.name.localeCompare(b.name)),
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  return (
    <div className="p-6 w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inventory Dashboard</h1>
        <p className="text-gray-500 mt-1">Map e-commerce products to their raw inventory components</p>
      </div>

      {/* Attention strip — only products with issues */}
      {!loading && attentionRows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-900">Needs attention</h2>
            <span className="text-xs font-semibold text-slate-500">{attentionRows.length}</span>
          </div>
          <div className="space-y-2.5">
            {attentionRows.map((product) => (
              <div
                key={product._id}
                className="rounded-xl border border-rose-100 bg-white shadow-sm px-3 py-2.5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="flex items-center gap-2.5 lg:w-44 shrink-0 min-w-0">
                    {product.images?.[0] ? (
                      <div className="relative h-9 w-9 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      </div>
                    ) : (
                      <div className="h-9 w-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate" title={product.name}>
                        {product.name}
                      </p>
                      <Link
                        href={`/inventory/config/${product._id}`}
                        className="text-[11px] font-semibold text-indigo-600 hover:underline"
                      >
                        Configure
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 min-w-0">
                    <MiniCard
                      label="Boxes in stock"
                      count={product.boxesPossible}
                      tone={
                        product.productHealth === "out"
                          ? "danger"
                          : product.productHealth === "low"
                            ? "warn"
                            : "ok"
                      }
                      icon={Box}
                      limiter={product.limitingComponent}
                    />
                    {product.lowStockItems.length > 0 && (
                      <MiniCard
                        label="Low stock items"
                        count={product.lowStockItems.length}
                        tone="danger"
                        icon={AlertTriangle}
                        items={product.lowStockItems}
                        itemMode="low"
                      />
                    )}
                    {product.belowTargetItems.length > 0 && (
                      <MiniCard
                        label="Below target"
                        count={product.belowTargetItems.length}
                        tone="warn"
                        icon={Target}
                        items={product.belowTargetItems}
                        itemMode="target"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Original configuration table */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mb-4" />
            <p className="text-gray-500 font-medium">Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">No products found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Store Stock
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Configuration Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {pageRows.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {product.images?.[0] ? (
                            <div className="flex-shrink-0 h-14 w-14 relative rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shadow-sm">
                              <Package className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div
                              className="text-sm font-bold text-gray-900 max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md truncate"
                              title={product.name}
                            >
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">₹{product.price}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {product.hasConfig ? (
                          <span>{product.stock ?? product.boxesPossible} units</span>
                        ) : (
                          <span className="text-gray-400">0 units</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.hasConfig ? (
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                              Configured
                            </span>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                              {product.componentCount} items
                            </span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                            Unmapped
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <Link
                          href={`/inventory/config/${product._id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-200 transition-colors shadow-sm"
                        >
                          <Settings className="w-4 h-4 mr-1.5" /> Configure
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 border-t border-gray-100 text-sm text-gray-600">
                <span>
                  Page {pageSafe} of {totalPages} · {filtered.length} products
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pageSafe <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={pageSafe >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
