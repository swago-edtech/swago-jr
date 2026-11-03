'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { formatPrice } from '@swago/utils';
import DateRangeFilter, { DateRange, getDefaultDateRange } from '@/components/DateRangeFilter';
import AnalyticsCard from '@/components/AnalyticsCard';
import {
  getInfluencerAnalytics,
  InfluencerAnalyticsData,
  InfluencerPerfRow,
  SortKey,
} from './actions';
import { exportToCSV } from '@/lib/exportCsv';
import {
  Download,
  IndianRupee,
  Users,
  TrendingUp,
  AlertTriangle,
  Trophy,
  ShoppingBag,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Target,
  Link2,
  Sparkles,
  BarChart3,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'score', label: 'Optimum score' },
  { key: 'lastTouchRevenue', label: 'Last-touch revenue' },
  { key: 'lastTouchOrders', label: 'Successful orders' },
  { key: 'newUsers', label: 'New users' },
  { key: 'newBuyers', label: 'New buyers' },
  { key: 'roasLast', label: 'ROAS' },
  { key: 'contributionLast', label: 'Contribution' },
  { key: 'conversionRate', label: 'Order conversion' },
  { key: 'firstTouchRevenue', label: 'First-touch revenue' },
];

function pct(n: number | null | undefined) {
  if (n == null) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

function MetricCell({
  children,
  align = 'right',
  strong,
  tone,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  strong?: boolean;
  tone?: 'default' | 'good' | 'warn' | 'brand';
}) {
  const toneClass =
    tone === 'brand' ? 'text-indigo-700' : tone === 'good' ? 'text-emerald-700' : tone === 'warn' ? 'text-amber-700' : 'text-gray-900';
  return (
    <td
      className={`px-3 py-3.5 text-sm whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'} ${
        strong ? 'font-bold' : 'font-semibold'
      } ${toneClass}`}
    >
      {children}
    </td>
  );
}

function LeaderboardCard({
  title,
  entries,
  formatMetric,
  accent,
}: {
  title: string;
  entries: { rank: number; handle: string; creatorId: string; label: string; metric: number }[];
  formatMetric?: (n: number) => string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
      <div className={`px-4 py-3 border-b border-gray-100 flex items-center gap-2 ${accent || 'bg-slate-50'}`}>
        <Trophy className="w-4 h-4 text-gray-500 shrink-0" />
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <ol className="divide-y divide-gray-100 flex-1">
        {entries.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm font-medium text-gray-500">No data yet</li>
        ) : (
          entries.slice(0, 5).map((e) => (
            <li key={`${title}-${e.creatorId}`} className="px-4 py-3 flex items-center gap-3">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  e.rank === 1
                    ? 'bg-gray-100 text-gray-900'
                    : e.rank === 2
                      ? 'bg-gray-200 text-gray-800'
                      : e.rank === 3
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {e.rank}
              </span>
              <div className="flex-1 min-w-0">
<Link
                  href={`/influencers/${encodeURIComponent(e.creatorId)}`}
                  className="font-bold text-gray-800 hover:underline truncate text-sm block"
                >
                  @{e.handle}
                </Link>
                <div className="text-[11px] font-medium text-gray-600 font-mono truncate">{e.creatorId}</div>
              </div>
              <div className="text-right font-bold text-gray-900 text-sm whitespace-nowrap">
                {formatMetric ? formatMetric(e.metric) : e.label}
              </div>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}

function FunnelBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const width = total > 0 ? Math.max((value / total) * 100, value > 0 ? 4 : 0) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-900 tabular-nums">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function DetailPanel({ row }: { row: InfluencerPerfRow }) {
  const funnelTotal =
    row.successfulOrders + row.pendingOrders + row.failedOrders + row.rtoOrders || 1;

  return (
    <div className="bg-gray-50 border-t border-b border-gray-200 px-4 sm:px-6 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gray-700" />
            Why this rank
          </h4>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="font-medium text-gray-600">Optimum score</dt>
              <dd className="font-bold text-gray-800">{row.score}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="font-medium text-gray-600">ROAS</dt>
              <dd className="font-bold text-gray-900">{row.roasLast != null ? `${row.roasLast}x` : '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="font-medium text-gray-600">Contribution*</dt>
              <dd className="font-bold text-gray-900">
                {row.contributionLast != null ? formatPrice(row.contributionLast) : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="font-medium text-gray-600">Fee / COGS override</dt>
              <dd className="font-bold text-gray-900">
                {formatPrice(row.feeInr)} / {formatPrice(row.productCostInr)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="font-medium text-gray-600">First-touch rev</dt>
              <dd className="font-bold text-gray-900">{formatPrice(row.firstTouchRevenue)}</dd>
            </div>
<div className="pt-2 border-t border-gray-100 space-y-1.5">
              <Link
                href={`/influencers/${encodeURIComponent(row.creatorId)}`}
                className="text-xs font-bold text-gray-800 hover:underline inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                Open full person funnel →
              </Link>
              <Link
                href="/influencers"
                className="text-xs font-bold text-gray-700 hover:underline inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Link2 className="w-3.5 h-3.5" />
                Manage creator &amp; short links
              </Link>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-3">
            New user acquisition
          </h4>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
              <p className="text-[10px] font-bold uppercase text-gray-700">New users</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{row.newUsers}</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
              <p className="text-[10px] font-bold uppercase text-gray-800">New buyers</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{row.newBuyers}</p>
            </div>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="font-medium text-gray-600">Signup → buyer</dt>
              <dd className="font-bold text-gray-900">
                {row.buyerConversionPct != null ? `${row.buyerConversionPct}%` : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="font-medium text-gray-600">CAC / new user</dt>
              <dd className="font-bold text-gray-900">
                {row.cacNewUser != null ? formatPrice(row.cacNewUser) : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="font-medium text-gray-600">CPA / order</dt>
              <dd className="font-bold text-gray-900">
                {row.cpaLast != null ? formatPrice(row.cpaLast) : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="font-medium text-gray-600">Unique / repeat</dt>
              <dd className="font-bold text-gray-900">
                {row.uniqueCustomers} / {row.repeatCustomers}
              </dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-3">
            Order funnel (last-touch)
          </h4>
          <div className="space-y-3">
            <FunnelBar label="Successful" value={row.successfulOrders} total={funnelTotal} color="bg-indigo-600" />
            <FunnelBar label="Pending" value={row.pendingOrders} total={funnelTotal} color="bg-amber-500" />
            <FunnelBar label="Failed / cancelled" value={row.failedOrders} total={funnelTotal} color="bg-rose-500" />
            <FunnelBar label="RTO / returned" value={row.rtoOrders} total={funnelTotal} color="bg-slate-400" />
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
            <span className="font-medium text-gray-600">COD / Prepaid</span>
            <span className="font-bold text-gray-900">
              {row.codOrders} / {row.prepaidOrders}
            </span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="font-medium text-gray-600">Conversion</span>
            <span className="font-bold text-gray-900">{pct(row.conversionRate)}</span>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-3">
            Placements (utm_term)
          </h4>
          {row.placements.length === 0 ? (
            <p className="text-sm font-medium text-gray-600">No placement tags yet</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase text-gray-700">Term</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-gray-700">Orders</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase text-gray-700">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {row.placements.map((p) => (
                    <tr key={p.term} className="bg-white">
                      <td className="px-3 py-2 font-bold text-gray-900 font-mono text-xs">{p.term}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{p.lastOrders}</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-800">
                        {formatPrice(p.lastRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlacementPivot({
  placements,
  rows,
}: {
  placements: InfluencerAnalyticsData['matrix']['placements'];
  rows: InfluencerPerfRow[];
}) {
  const terms = useMemo(() => {
    const set = new Set<string>();
    for (const p of placements) set.add(p.term || 'unspecified');
    const preferred = ['reel', 'story', 'bio', 'dm', 'post', 'review', 'group', 'status', 'ad'];
    const rest = Array.from(set).filter((t) => !preferred.includes(t)).sort();
    return [...preferred.filter((t) => set.has(t)), ...rest];
  }, [placements]);

  const byCreator = useMemo(() => {
    const map = new Map<
      string,
      { handle: string; cells: Map<string, { orders: number; revenue: number }>; totalRev: number; totalOrders: number }
    >();
    for (const p of placements) {
      if (!map.has(p.creatorId)) {
        map.set(p.creatorId, {
          handle: p.handle,
          cells: new Map(),
          totalRev: 0,
          totalOrders: 0,
        });
      }
      const entry = map.get(p.creatorId)!;
      entry.cells.set(p.term, { orders: p.orders, revenue: p.revenue });
      entry.totalRev += p.revenue;
      entry.totalOrders += p.orders;
    }
    for (const r of rows) {
      if ((r.lastTouchOrders > 0 || r.newUsers > 0) && !map.has(r.creatorId)) {
        map.set(r.creatorId, {
          handle: r.handle,
          cells: new Map(),
          totalRev: r.lastTouchRevenue,
          totalOrders: r.lastTouchOrders,
        });
      }
    }
    return Array.from(map.entries())
      .map(([creatorId, v]) => ({ creatorId, ...v }))
      .sort((a, b) => b.totalRev - a.totalRev);
  }, [placements, rows]);

  const maxCell = useMemo(() => {
    let m = 0;
    for (const p of placements) m = Math.max(m, p.revenue);
    return m || 1;
  }, [placements]);

  if (byCreator.length === 0 || terms.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm font-semibold text-gray-700">No placement-tagged orders yet</p>
        <p className="text-sm font-medium text-gray-600 mt-1">
          Share short links like <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-900">/r/annie_ig/reel</code> so
          utm_term is filled automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-200">
            <th className="sticky left-0 z-10 bg-slate-100 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-800">
              Creator
            </th>
            {terms.map((t) => (
              <th
                key={t}
                className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-800 min-w-[96px]"
              >
                {t}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-800">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {byCreator.map((row) => (
            <tr key={row.creatorId} className="hover:bg-slate-50/80">
              <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-gray-100">
                <div className="font-bold text-gray-900">@{row.handle}</div>
                <div className="text-[11px] font-medium text-gray-600 font-mono">{row.creatorId}</div>
              </td>
              {terms.map((t) => {
                const cell = row.cells.get(t);
                if (!cell || (cell.orders === 0 && cell.revenue === 0)) {
                  return (
                    <td key={t} className="px-3 py-3 text-center text-gray-400 font-medium">
                      —
                    </td>
                  );
                }
                const intensity = Math.min(cell.revenue / maxCell, 1);
                const bg =
                  intensity > 0.66 ? 'bg-gray-100' : intensity > 0.33 ? 'bg-gray-50' : 'bg-white';
                return (
                  <td key={t} className={`px-3 py-3 text-center ${bg}`}>
                    <div className="font-bold text-gray-900 tabular-nums">{formatPrice(cell.revenue)}</div>
                    <div className="text-[11px] font-semibold text-gray-700 mt-0.5">{cell.orders} ord</div>
                  </td>
                );
              })}
              <td className="px-4 py-3 text-right">
                <div className="font-bold text-gray-800 tabular-nums">{formatPrice(row.totalRev)}</div>
                <div className="text-[11px] font-semibold text-gray-700">{row.totalOrders} ord</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InfluencerAnalyticsClient() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [data, setData] = useState<InfluencerAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async (range: DateRange, sort: SortKey) => {
    setLoading(true);
    try {
      setData(await getInfluencerAnalytics(range.from, range.to, sort));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateRange, sortKey);
  }, [dateRange, sortKey, fetchData]);

  const visibleRows = useMemo(() => {
    if (!data) return [];
    let list = data.rows;
    if (showOnlyActive) {
      list = list.filter(
        (r) =>
          r.lastTouchOrders > 0 ||
          r.newUsers > 0 ||
          r.firstTouchOrders > 0 ||
          r.pendingOrders > 0 ||
          r.failedOrders > 0
      );
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.handle.toLowerCase().includes(q) ||
          r.creatorId.toLowerCase().includes(q) ||
          r.displayName?.toLowerCase().includes(q) ||
          r.platform?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, showOnlyActive, search]);

  const topPerformer = data?.leaderboards.byScore?.[0];
  const blendedRoas =
    data && data.totals.feesAllocated > 0
      ? Number((data.totals.lastTouchRevenue / data.totals.feesAllocated).toFixed(2))
      : null;

  const csvRows = useMemo(
    () =>
      visibleRows.map((r) => ({
        rank: r.rank,
        creatorId: r.creatorId,
        handle: r.handle,
        platform: r.platform,
        score: r.score,
        newUsers: r.newUsers,
        newBuyers: r.newBuyers,
        buyerConversionPct: r.buyerConversionPct,
        successfulOrders: r.successfulOrders,
        pendingOrders: r.pendingOrders,
        failedOrders: r.failedOrders,
        rtoOrders: r.rtoOrders,
        lastTouchRevenue: r.lastTouchRevenue,
        firstTouchRevenue: r.firstTouchRevenue,
        aov: r.aovLast,
        feeInr: r.feeInr,
        cpa: r.cpaLast,
        cacNewUser: r.cacNewUser,
        roas: r.roasLast,
        contribution: r.contributionLast,
        conversionRate: r.conversionRate,
        uniqueCustomers: r.uniqueCustomers,
        repeatCustomers: r.repeatCustomers,
        codOrders: r.codOrders,
        prepaidOrders: r.prepaidOrders,
      })),
    [visibleRows]
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Creator P&amp;L · acquisition · placements
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Influencer Leaderboard
            </h1>
            <p className="text-gray-700 text-sm font-medium mt-1.5 leading-relaxed">
              Compare creators on new users, successful orders, ROAS and contribution. Expand any row for
              funnel + placement detail. Manage short links under{' '}
              <Link href="/influencers" className="text-gray-800 font-bold hover:underline">
                Influencer Creators
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-10 px-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key} className="text-gray-900 bg-white">
                  Sort: {o.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 h-10 px-3 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-900 cursor-pointer select-none shadow-sm">
              <input
                type="checkbox"
                checked={showOnlyActive}
                onChange={(e) => setShowOnlyActive(e.target.checked)}
                className="rounded border-gray-400 text-gray-700 focus:ring-gray-400"
              />
              Activity only
            </label>
            <button
              type="button"
              onClick={() => exportToCSV('influencer_leaderboard', csvRows)}
              className="flex items-center gap-2 h-10 px-3 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 hover:bg-gray-50 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-700">Loading creator performance…</p>
        </div>
      ) : data ? (
        <>
          {topPerformer && (
            <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-5 sm:p-6 text-white shadow-md">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
                <div className="flex-1">
                  <p className="text-gray-100 text-xs font-bold uppercase tracking-wider">Top optimum this range</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">@{topPerformer.handle}</p>
                  <p className="text-gray-100 text-sm font-medium mt-1">
                    Score {topPerformer.metric} · {topPerformer.label}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                  <div className="rounded-xl bg-white/15 backdrop-blur px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase text-gray-100">Revenue</p>
                    <p className="text-lg font-bold">{formatPrice(data.totals.lastTouchRevenue)}</p>
                  </div>
                  <div className="rounded-xl bg-white/15 backdrop-blur px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase text-gray-100">New users</p>
                    <p className="text-lg font-bold">{data.totals.newUsers}</p>
                  </div>
                  <div className="rounded-xl bg-white/15 backdrop-blur px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase text-gray-100">Blended ROAS</p>
                    <p className="text-lg font-bold">{blendedRoas != null ? `${blendedRoas}x` : '—'}</p>
                  </div>
                  <div className="rounded-xl bg-white/15 backdrop-blur px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase text-gray-100">Active creators</p>
                    <p className="text-lg font-bold">{data.totals.creatorsWithActivity}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <AnalyticsCard
              title="Successful orders"
              value={data.totals.successfulOrders}
              subtitle="Last-touch · paid statuses"
              icon={ShoppingBag}
              color="bg-gray-800"
            />
            <AnalyticsCard
              title="Last-touch revenue"
              value={formatPrice(data.totals.lastTouchRevenue)}
              subtitle="Finance truth (not GA4)"
              icon={TrendingUp}
              color="bg-gray-800"
              textColor="text-gray-800"
            />
            <AnalyticsCard
              title="New users acquired"
              value={data.totals.newUsers}
              subtitle={`${data.totals.newBuyers} became buyers`}
              icon={UserPlus}
              color="bg-gray-800"
            />
            <AnalyticsCard
              title="Fees on active creators"
              value={formatPrice(data.totals.feesAllocated)}
              subtitle={blendedRoas != null ? `Blended ROAS ${blendedRoas}x` : 'Set fees on creators'}
              icon={IndianRupee}
              color="bg-gray-800"
            />
            <AnalyticsCard
              title="First-touch revenue"
              value={formatPrice(data.totals.firstTouchRevenue)}
              subtitle="Separate model — don’t sum with last"
              icon={Users}
              color="bg-gray-800"
            />
            <AnalyticsCard
              title="Creators with activity"
              value={data.totals.creatorsWithActivity}
              icon={Target}
              color="bg-gray-800"
            />
            <AnalyticsCard
              title="Customer touches (sum)"
              value={data.totals.uniqueCustomers}
              subtitle="Per-creator uniques summed"
              icon={Users}
              color="bg-gray-800"
            />
            <AnalyticsCard
              title="Missing utm_content"
              value={data.totals.unattributedInfluencerish}
              subtitle="medium=influencer but no creator id"
              icon={AlertTriangle}
              color="bg-gray-400"
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 leading-relaxed">
            {data.note}
          </div>

          <section>
            <div className="flex items-end justify-between mb-3 gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Top boards</h2>
                <p className="text-sm font-medium text-gray-600">Quick view of who leads each metric</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <LeaderboardCard title="Optimum score" entries={data.leaderboards.byScore} accent="bg-gray-50" />
              <LeaderboardCard
                title="Revenue"
                entries={data.leaderboards.byRevenue}
                formatMetric={(n) => formatPrice(n)}
                accent="bg-gray-50"
              />
              <LeaderboardCard title="Orders" entries={data.leaderboards.byOrders} accent="bg-gray-50" />
              <LeaderboardCard title="New users" entries={data.leaderboards.byNewUsers} accent="bg-gray-50" />
              <LeaderboardCard
                title="ROAS"
                entries={data.leaderboards.byRoas}
                formatMetric={(n) => (n ? `${n}x` : '—')}
                accent="bg-gray-50"
              />
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-gray-700" />
                  Creator performance matrix
                </h2>
                <p className="text-sm font-medium text-gray-600 mt-0.5">
                  Click a row to open acquisition, funnel and placements
                </p>
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search creator…"
                className="h-10 w-full sm:w-56 px-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[960px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    {[
                      { l: '#', a: 'left' },
                      { l: 'Creator', a: 'left' },
                      { l: 'Score', a: 'right' },
                      { l: 'Users', a: 'right' },
                      { l: 'Buyers', a: 'right' },
                      { l: 'Orders', a: 'right' },
                      { l: 'Revenue', a: 'right' },
                      { l: 'AOV', a: 'right' },
                      { l: 'CPA', a: 'right' },
                      { l: 'ROAS', a: 'right' },
                      { l: 'Contrib*', a: 'right' },
                      { l: 'Conv', a: 'right' },
                    ].map((h) => (
                      <th
                        key={h.l}
                        className={`px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-800 ${
                          h.a === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h.l}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleRows.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-14 text-center">
                        <p className="text-sm font-bold text-gray-800">No matching creator activity</p>
                        <p className="text-sm font-medium text-gray-600 mt-1">
                          Share short links from Influencers, or widen the date range / clear filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((r) => {
                      const open = expanded === r.creatorId;
                      return (
                        <Fragment key={r.creatorId}>
                          <tr
                            className={`cursor-pointer transition-colors ${
                              open ? 'bg-gray-50' : 'hover:bg-slate-50'
                            }`}
                            onClick={() => setExpanded(open ? null : r.creatorId)}
                          >
                            <td className="px-3 py-3.5 text-gray-800 font-bold text-xs">
                              <span className="inline-flex items-center gap-1">
                                {open ? (
                                  <ChevronDown className="w-4 h-4 text-gray-700" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                                {r.rank}
                              </span>
                            </td>
<td className="px-3 py-3.5">
                              <Link
                                href={`/influencers/${encodeURIComponent(r.creatorId)}`}
                                className="font-bold text-gray-800 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                @{r.handle}
                              </Link>
                              <div className="text-[11px] font-medium text-gray-600 font-mono flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span>{r.creatorId}</span>
                                <span className="text-gray-400">·</span>
                                <span className="capitalize">{r.platform}</span>
                                {!r.registered && (
                                  <span className="text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded font-bold">
                                    unregistered
                                  </span>
                                )}
                                {r.registered && !r.isActive && (
                                  <span className="text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded font-bold">off</span>
                                )}
                              </div>
                              <Link
                                href={`/influencers/${encodeURIComponent(r.creatorId)}`}
                                className="text-[11px] font-bold text-gray-700 hover:text-gray-800 hover:underline mt-0.5 inline-block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Full details →
                              </Link>
                            </td>
                            <MetricCell strong tone="brand">
                              {r.score}
                            </MetricCell>
                            <MetricCell strong>{r.newUsers}</MetricCell>
                            <MetricCell>{r.newBuyers}</MetricCell>
                            <MetricCell strong>{r.successfulOrders}</MetricCell>
                            <MetricCell strong tone="good">
                              {formatPrice(r.lastTouchRevenue)}
                            </MetricCell>
                            <MetricCell>{formatPrice(r.aovLast)}</MetricCell>
                            <MetricCell>{r.cpaLast != null ? formatPrice(r.cpaLast) : '—'}</MetricCell>
                            <MetricCell strong>{r.roasLast != null ? `${r.roasLast}x` : '—'}</MetricCell>
                            <MetricCell>
                              {r.contributionLast != null ? formatPrice(r.contributionLast) : '—'}
                            </MetricCell>
                            <MetricCell>{pct(r.conversionRate)}</MetricCell>
                          </tr>
                          {open && (
                            <tr>
                              <td colSpan={12} className="p-0">
                                <DetailPanel row={r} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <p className="px-4 sm:px-5 py-3 text-xs font-medium text-gray-600 border-t border-gray-100 bg-slate-50">
              *Contribution ≈ last-touch successful revenue − creator fee − product cost override. Not full
              warehouse/fulfilment P&amp;L. Page time &amp; heatmaps live in GA4 / Clarity.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-900">Placement matrix</h2>
              <p className="text-sm font-medium text-gray-700 mt-0.5">
                Creator × placement (utm_term). Darker cells = higher last-touch successful revenue. Use short
                links <span className="font-mono text-gray-900 bg-gray-100 px-1 rounded">/r/&#123;id&#125;/reel</span> so
                terms fill automatically.
              </p>
            </div>
            <PlacementPivot placements={data.matrix.placements} rows={data.rows} />
          </section>
        </>
      ) : null}
    </div>
  );
}
