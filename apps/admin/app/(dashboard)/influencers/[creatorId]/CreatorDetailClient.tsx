'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@swago/utils';
import DateRangeFilter, { DateRange, getDefaultDateRange } from '@/components/DateRangeFilter';
import {
  CreatorDetailData,
  FunnelStage,
  PersonOrderRow,
  PersonRow,
  getCreatorDetail,
} from './actions';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  IndianRupee,
  Link2,
  ShoppingBag,
  ShoppingCart,
  UserMinus,
  Users,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import {
  CREATOR_PLACEMENTS,
  buildShortCreatorLink,
  getSiteOrigin,
} from '@/lib/creatorLinks';

const STAGE_FILTERS: { key: FunnelStage | 'all'; label: string }[] = [
  { key: 'all', label: 'All people' },
  { key: 'converted', label: 'Converted' },
  { key: 'checkout_pending', label: 'Checkout pending' },
  { key: 'checkout_abandoned', label: 'Checkout abandoned' },
  { key: 'order_failed', label: 'Failed' },
  { key: 'order_rto', label: 'RTO' },
  { key: 'cart_active', label: 'Active cart' },
  { key: 'cart_abandoned', label: 'Abandoned cart' },
  { key: 'signed_up_only', label: 'Signed up only' },
  { key: 'order_only', label: 'Order only' },
];

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return iso;
  }
}

function stageBadge(stage: FunnelStage) {
  const map: Record<FunnelStage, string> = {
    converted: 'bg-indigo-600 text-white border-indigo-600',
    checkout_pending: 'bg-gray-100 text-gray-800 border-gray-200',
    checkout_abandoned: 'bg-rose-50 text-rose-800 border-rose-200',
    order_failed: 'bg-rose-50 text-rose-800 border-rose-200',
    order_rto: 'bg-slate-100 text-slate-800 border-slate-200',
    cart_active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cart_abandoned: 'bg-amber-50 text-amber-800 border-amber-200',
    signed_up_only: 'bg-gray-100 text-gray-800 border-gray-200',
    order_only: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return map[stage] || 'bg-gray-100 text-gray-800 border-gray-200';
}

function UtmChips({
  source,
  medium,
  campaign,
  content,
  term,
}: {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}) {
  const bits = [
    source && { k: 'src', v: source },
    medium && { k: 'med', v: medium },
    campaign && { k: 'cmp', v: campaign },
    content && { k: 'content', v: content },
    term && { k: 'term', v: term },
  ].filter(Boolean) as { k: string; v: string }[];

  if (bits.length === 0) {
    return <span className="text-xs font-medium text-gray-500">No UTM</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {bits.map((b) => (
        <span
          key={b.k}
          className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-900"
        >
          <span className="text-gray-500 uppercase">{b.k}</span>
          <span className="font-mono">{b.v}</span>
        </span>
      ))}
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'default' | 'good' | 'warn' | 'brand';
}) {
  const valueClass =
    tone === 'good'
      ? 'text-emerald-700'
      : tone === 'warn'
        ? 'text-amber-700'
        : tone === 'brand'
          ? 'text-indigo-700'
          : 'text-gray-900';
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-600">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs font-medium text-gray-600">{sub}</p>}
    </div>
  );
}

function OrderMiniTable({ orders }: { orders: PersonOrderRow[] }) {
  if (orders.length === 0) {
    return <p className="text-sm font-medium text-gray-600">No related orders</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm min-w-[720px]">
        <thead className="bg-slate-100">
          <tr>
            {['Order', 'When', 'Status', 'Total', 'Touch', 'UTM', 'Items'].map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-gray-800"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="px-3 py-2">
                <Link
                  href={`/orders/${o.id}`}
                  className="font-bold text-gray-800 hover:underline font-mono text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  {o.orderId}
                </Link>
              </td>
              <td className="px-3 py-2 text-xs font-medium text-gray-800 whitespace-nowrap">
                {fmtDate(o.createdAt)}
              </td>
              <td className="px-3 py-2">
                <span className="text-xs font-bold text-gray-900">{o.status}</span>
                {o.paymentMethod && (
                  <span className="block text-[10px] font-medium text-gray-500 uppercase">
                    {o.paymentMethod}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 font-bold text-gray-900 whitespace-nowrap">
                {formatPrice(o.total)}
              </td>
              <td className="px-3 py-2 text-xs font-bold text-gray-800 capitalize">
                {o.attributionSide}
              </td>
              <td className="px-3 py-2">
                <UtmChips {...o.utm} />
                {(o.firstTouch || o.lastTouch) && (
                  <div className="mt-1.5 space-y-1 text-[10px] font-medium text-gray-600">
                    {o.firstTouch && (
                      <div>
                        <span className="font-bold text-gray-700">First:</span>{' '}
                        {[o.firstTouch.source, o.firstTouch.term, o.firstTouch.content]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </div>
                    )}
                    {o.lastTouch && (
                      <div>
                        <span className="font-bold text-gray-700">Last:</span>{' '}
                        {[o.lastTouch.source, o.lastTouch.term, o.lastTouch.content]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="px-3 py-2 text-xs font-medium text-gray-800 max-w-[180px] truncate">
                {o.itemsSummary}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PersonDetail({ person }: { person: PersonRow }) {
  return (
    <div className="bg-gray-50 border-t border-b border-gray-200 px-4 sm:px-6 py-5 space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
            Acquisition UTM (signup)
          </h4>
          {person.acquisition ? (
            <>
              <UtmChips
                source={person.acquisition.source}
                medium={person.acquisition.medium}
                campaign={person.acquisition.campaign}
                content={person.acquisition.content}
                term={person.acquisition.term}
              />
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="font-medium text-gray-600">Platform</dt>
                  <dd className="font-bold text-gray-900 capitalize">
                    {person.acquisition.source || '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-medium text-gray-600">Placement</dt>
                  <dd className="font-bold text-gray-900 font-mono text-xs">
                    {person.acquisition.term || '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-medium text-gray-600">Via</dt>
                  <dd className="font-bold text-gray-900">{person.acquisition.via || '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-medium text-gray-600">Captured</dt>
                  <dd className="font-semibold text-gray-900 text-xs">
                    {fmtDate(person.acquisition.capturedAt)}
                  </dd>
                </div>
                {person.acquisition.landingPath && (
                  <div className="flex justify-between gap-2">
                    <dt className="font-medium text-gray-600">Landing</dt>
                    <dd className="font-mono text-xs font-semibold text-gray-900">
                      {person.acquisition.landingPath}
                    </dd>
                  </div>
                )}
                {person.acquisition.referrer && (
                  <div className="pt-1">
                    <dt className="font-medium text-gray-600 text-xs">Referrer</dt>
                    <dd className="font-mono text-[11px] font-medium text-gray-800 break-all mt-0.5">
                      {person.acquisition.referrer}
                    </dd>
                  </div>
                )}
              </dl>
            </>
          ) : (
            <p className="text-sm font-medium text-gray-600">
              No signup acquisition stamp — seen via order UTM only.
            </p>
          )}
          <Link
            href={`/users/${person.userId}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-800 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Open user profile <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" />
            Cart
          </h4>
          {person.cart.distinctProducts === 0 ? (
            <p className="text-sm font-medium text-gray-600">Empty cart</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="font-bold text-gray-900">
                  {person.cart.itemCount} items · {formatPrice(person.cart.totalValue)}
                </span>
                {person.cart.isAbandoned ? (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Abandoned (≥7d)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                )}
              </div>
              <ul className="space-y-1.5">
                {person.cart.items.map((it, i) => (
                  <li
                    key={`${it.name}-${i}`}
                    className="flex justify-between gap-2 text-sm border-b border-gray-50 pb-1"
                  >
                    <span className="font-semibold text-gray-900 truncate">
                      {it.name} ×{it.quantity}
                    </span>
                    <span className="font-bold text-gray-800 whitespace-nowrap">
                      {formatPrice(it.price * it.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              {person.cart.oldestItemAt && (
                <p className="text-xs font-medium text-gray-600">
                  Oldest item: {fmtDate(person.cart.oldestItemAt)}
                </p>
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
            Order snapshot
          </h4>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-xs font-medium text-gray-600">Successful</dt>
              <dd className="font-bold text-gray-900">{person.orderStats.successful}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-600">Revenue</dt>
              <dd className="font-bold text-gray-900">
                {formatPrice(person.orderStats.revenue)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-600">Pending</dt>
              <dd className="font-bold text-amber-700">{person.orderStats.pending}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-600">Abandoned ckout</dt>
              <dd className="font-bold text-orange-700">{person.orderStats.abandoned}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-600">Failed</dt>
              <dd className="font-bold text-rose-700">{person.orderStats.failed}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-600">RTO</dt>
              <dd className="font-bold text-slate-800">{person.orderStats.rto}</dd>
            </div>
          </dl>
          {person.orderStats.lastOrderId && (
            <p className="text-xs font-medium text-gray-700">
              Latest:{' '}
              <span className="font-bold text-gray-900">{person.orderStats.lastOrderId}</span> ·{' '}
              {person.orderStats.lastOrderStatus} · {fmtDate(person.orderStats.lastOrderAt)}
            </p>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-2">Orders & UTM referral detail</h4>
        <OrderMiniTable orders={person.orders} />
      </div>
    </div>
  );
}

export default function CreatorDetailClient({ creatorId }: { creatorId: string }) {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [data, setData] = useState<CreatorDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<FunnelStage | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const siteOrigin = useMemo(() => getSiteOrigin('https://swagojr.com'), []);

  const fetchData = useCallback(async (id: string, range: DateRange) => {
    setLoading(true);
    try {
      setData(await getCreatorDetail(id, range.from, range.to));
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(creatorId, dateRange);
  }, [creatorId, dateRange, fetchData]);

  const people = useMemo(() => {
    if (!data) return [];
    let list = data.people;
    if (stageFilter !== 'all') list = list.filter((p) => p.stage === stageFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.phone?.includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.userId.toLowerCase().includes(q) ||
          p.acquisition?.term?.toLowerCase().includes(q) ||
          p.acquisition?.source?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, stageFilter, search]);

  const shortLinks = useMemo(() => {
    if (!data) return [];
    return CREATOR_PLACEMENTS.map((p) => ({
      ...p,
      url: buildShortCreatorLink({
        creatorId: data.creator.creatorId,
        platform: data.creator.platform,
        defaultCampaign: data.creator.defaultCampaign,
        placement: p.id,
        siteOrigin,
      }),
    }));
  }, [data, siteOrigin]);

  const platforms = data?.sources.filter((s) => s.kind === 'platform') || [];
  const placements = data?.sources.filter((s) => s.kind === 'placement') || [];

  return (
    <div className="space-y-6 pb-12 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/influencers"
            className="inline-flex items-center gap-1.5 font-bold text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Creators
          </Link>
          <span className="text-gray-300">/</span>
          <Link href="/analytics/influencers" className="font-bold text-gray-800 hover:underline">
            Leaderboard
          </Link>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div className="min-w-0">
            {data ? (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    @{data.creator.handle}
                  </h1>
                  <span className="font-mono text-sm font-semibold text-gray-600">
                    {data.creator.creatorId}
                  </span>
                  <span className="capitalize text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                    {data.creator.platform}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      data.creator.isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {data.creator.isActive ? 'Active' : 'Off'}
                  </span>
                  {!data.creator.registered && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                      Unregistered id
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {data.creator.displayName}
                  {data.creator.defaultCampaign
                    ? ` · campaign ${data.creator.defaultCampaign}`
                    : ''}
                </p>
                <p className="text-sm font-medium text-gray-600 mt-1 max-w-2xl">
                  Full person-level funnel: who came from this creator, their UTMs, carts, drop-offs,
                  and every attributed order.
                </p>
              </>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">Creator detail</h1>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-700">Loading creator detail…</p>
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <p className="font-bold text-gray-900">Could not load creator</p>
          <Link href="/influencers" className="text-sm font-bold text-gray-800 hover:underline mt-2 inline-block">
            Back to creators
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <Kpi
              label="Contribution"
              value={formatPrice(data.totals.contribution)}
              sub={`Rev ${formatPrice(data.totals.lastTouchRevenue)} − fee ${formatPrice(data.creator.feeInr)}`}
              tone="brand"
            />
            <Kpi
              label="Last-touch revenue"
              value={formatPrice(data.totals.lastTouchRevenue)}
              sub={`${data.totals.successfulOrders} successful · AOV ${formatPrice(data.totals.aov)}`}
              tone="good"
            />
            <Kpi
              label="ROAS / CPA"
              value={
                data.totals.roas != null
                  ? `${data.totals.roas}x`
                  : data.totals.cpa != null
                    ? formatPrice(data.totals.cpa)
                    : '—'
              }
              sub={
                data.totals.cpa != null
                  ? `CPA ${formatPrice(data.totals.cpa)} · fee ${formatPrice(data.creator.feeInr)}`
                  : `Fee ${formatPrice(data.creator.feeInr)}`
              }
            />
            <Kpi label="People" value={data.totals.people} sub={`${data.totals.acquiredUsers} acquired`} />
            <Kpi
              label="Converted"
              value={data.totals.convertedBuyers}
              sub={`${data.totals.signedUpOnly} signup only`}
              tone="good"
            />
            <Kpi
              label="Drop-offs"
              value={
                data.totals.cartAbandoned +
                data.totals.checkoutAbandoned +
                data.totals.checkoutPending
              }
              sub={`${data.totals.cartAbandoned} cart · ${data.totals.checkoutAbandoned} ckout · ${data.totals.checkoutPending} pending`}
              tone="warn"
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 leading-relaxed">
            {data.note}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 lg:col-span-1">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Link2 className="w-4 h-4 text-gray-700" />
                Short links
              </h2>
              <ul className="space-y-2">
                {shortLinks.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-start justify-between gap-2 text-sm border-b border-gray-50 pb-2"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900">{l.label}</p>
                      <p className="font-mono text-xs font-semibold text-gray-700 break-all">
                        {l.url.replace(/^https?:\/\//, '')}
                      </p>
                    </div>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-gray-800 hover:underline shrink-0"
                    >
                      Open
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Where orders come from (platform)
              </h2>
              {platforms.length === 0 ? (
                <p className="text-sm font-medium text-gray-600">No successful last-touch orders in range</p>
              ) : (
                <ul className="space-y-2">
                  {platforms.map((s) => (
                    <li key={s.key} className="flex justify-between gap-3 text-sm">
                      <span className="font-bold text-gray-900 capitalize">{s.label}</span>
                      <span className="font-semibold text-gray-800 tabular-nums">
                        {s.orders} ord · {formatPrice(s.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                <ShoppingBag className="w-4 h-4 text-gray-700" />
                Placement (utm_term)
              </h2>
              {placements.length === 0 ? (
                <p className="text-sm font-medium text-gray-600">No placement-tagged success yet</p>
              ) : (
                <ul className="space-y-2">
                  {placements.map((s) => (
                    <li key={s.key} className="flex justify-between gap-3 text-sm">
                      <span className="font-mono text-xs font-bold text-gray-900">{s.label}</span>
                      <span className="font-semibold text-gray-800 tabular-nums">
                        {s.orders} · {formatPrice(s.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-gray-200 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-700" />
                    People from this creator
                  </h2>
                  <p className="text-sm font-medium text-gray-600 mt-0.5">
                    Click a row for full UTM, cart, drop-off stage, and order history
                  </p>
                </div>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, phone, email, placement…"
                  className="h-10 w-full sm:w-72 px-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STAGE_FILTERS.map((f) => {
                  const count =
                    f.key === 'all'
                      ? data.people.length
                      : data.people.filter((p) => p.stage === f.key).length;
                  const active = stageFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setStageFilter(f.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        active
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {f.label}
                      <span className={`ml-1 tabular-nums ${active ? 'text-gray-100' : 'text-gray-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    {[
                      'Person',
                      'Stage / drop-off',
                      'Platform · placement',
                      'Joined',
                      'Cart',
                      'Orders',
                      'Revenue',
                      'Recent order',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-gray-800"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {people.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-14 text-center">
                        <UserMinus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-gray-800">No people match this filter</p>
                        <p className="text-sm font-medium text-gray-600 mt-1">
                          Widen the date range or clear stage / search filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    people.map((p) => {
                      const open = expanded === p.userId;
                      return (
                        <Fragment key={p.userId}>
                          <tr
                            className={`cursor-pointer transition-colors ${
                              open ? 'bg-gray-50' : 'hover:bg-slate-50'
                            }`}
                            onClick={() => setExpanded(open ? null : p.userId)}
                          >
                            <td className="px-3 py-3.5">
                              <div className="flex items-start gap-1.5">
                                {open ? (
                                  <ChevronDown className="w-4 h-4 text-gray-700 mt-0.5 shrink-0" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <div className="font-bold text-gray-900">{p.name}</div>
                                  <div className="text-[11px] font-medium text-gray-600">
                                    {p.phone || p.email || p.userId.slice(-8)}
                                  </div>
                                  <div className="text-[10px] font-semibold text-gray-500 mt-0.5 capitalize">
                                    {p.link} · {p.authMethod || '—'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold border ${stageBadge(
                                  p.stage
                                )}`}
                              >
                                {p.stageLabel}
                              </span>
                            </td>
                            <td className="px-3 py-3.5">
                              {p.acquisition ? (
                                <div>
                                  <div className="font-bold text-gray-900 capitalize text-sm">
                                    {p.acquisition.source || '—'}
                                  </div>
                                  <div className="font-mono text-xs font-semibold text-gray-700">
                                    {p.acquisition.term || '—'}
                                  </div>
                                </div>
                              ) : p.orders[0] ? (
                                <div>
                                  <div className="font-bold text-gray-900 capitalize text-sm">
                                    {p.orders[0].utm.source || '—'}
                                  </div>
                                  <div className="font-mono text-xs font-semibold text-gray-700">
                                    {p.orders[0].utm.term || '—'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-500">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3.5 text-xs font-medium text-gray-800 whitespace-nowrap">
                              {fmtDate(p.joinedAt)}
                            </td>
                            <td className="px-3 py-3.5">
                              {p.cart.distinctProducts > 0 ? (
                                <div className="text-xs">
                                  <span className="font-bold text-gray-900">
                                    {p.cart.itemCount} · {formatPrice(p.cart.totalValue)}
                                  </span>
                                  {p.cart.isAbandoned && (
                                    <span className="block text-gray-900 font-bold">Abandoned</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 font-medium">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3.5 font-bold text-gray-900 tabular-nums">
                              {p.orderStats.total}
                              <span className="block text-[10px] font-medium text-gray-500">
                                {p.orderStats.successful} ok
                              </span>
                            </td>
                            <td className="px-3 py-3.5 font-bold text-gray-900 tabular-nums whitespace-nowrap">
                              {formatPrice(p.orderStats.revenue)}
                            </td>
                            <td className="px-3 py-3.5 text-xs font-medium text-gray-800">
                              {p.orderStats.lastOrderId ? (
                                <>
                                  <span className="font-bold text-gray-900">
                                    {p.orderStats.lastOrderId}
                                  </span>
                                  <span className="block">{p.orderStats.lastOrderStatus}</span>
                                  <span className="block text-gray-500">
                                    {fmtDate(p.orderStats.lastOrderAt)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-400">No order</span>
                              )}
                            </td>
                          </tr>
                          {open && (
                            <tr>
                              <td colSpan={8} className="p-0">
                                <PersonDetail person={p} />
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
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-gray-200 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              <div>
                <h2 className="text-base font-bold text-gray-900">Recent attributed orders</h2>
                <p className="text-sm font-medium text-gray-600">
                  First/last touch for this creator in the selected range
                </p>
              </div>
            </div>
            <div className="p-4">
              <OrderMiniTable orders={data.recentOrders} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
