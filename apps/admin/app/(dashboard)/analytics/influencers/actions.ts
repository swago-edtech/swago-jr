'use server';

import { connectDB, Order, InfluencerCreator, User } from '@swago/database';

const successStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
const pendingLike = ['Pending'];
const failedLike = ['Failed', 'Cancelled', 'Abandoned'];
const rtoLike = ['RTO', 'Returned', 'Refunded'];

export type SortKey =
  | 'score'
  | 'lastTouchRevenue'
  | 'lastTouchOrders'
  | 'newUsers'
  | 'newBuyers'
  | 'roasLast'
  | 'contributionLast'
  | 'conversionRate'
  | 'firstTouchRevenue';

export interface PlacementRow {
  term: string;
  lastOrders: number;
  lastRevenue: number;
  firstOrders: number;
  firstRevenue: number;
}

export interface InfluencerPerfRow {
  rank: number;
  creatorId: string;
  handle: string;
  displayName: string;
  platform: string;
  isActive: boolean;
  feeInr: number;
  productCostInr: number;
  registered: boolean;

  // Acquisition
  newUsers: number;
  newBuyers: number; // new users in range who also placed a successful order attributed last-touch
  buyerConversionPct: number | null; // newBuyers / newUsers

  // Order funnel (last-touch by default for counts that drive P&L)
  lastTouchOrders: number;
  lastTouchRevenue: number;
  firstTouchOrders: number;
  firstTouchRevenue: number;
  successfulOrders: number;
  pendingOrders: number;
  failedOrders: number;
  rtoOrders: number;
  codOrders: number;
  prepaidOrders: number;
  uniqueCustomers: number;
  repeatCustomers: number;

  // Efficiency
  aovLast: number;
  cpaLast: number | null;
  cacNewUser: number | null;
  roasLast: number | null;
  contributionLast: number | null;
  conversionRate: number | null; // successful / (successful+failed+pending+rto) last-touch attributed

  // Composite
  score: number;

  placements: PlacementRow[];
}

export interface LeaderboardEntry {
  rank: number;
  creatorId: string;
  handle: string;
  metric: number;
  label: string;
}

export interface InfluencerAnalyticsData {
  rows: InfluencerPerfRow[];
  leaderboards: {
    byRevenue: LeaderboardEntry[];
    byOrders: LeaderboardEntry[];
    byNewUsers: LeaderboardEntry[];
    byRoas: LeaderboardEntry[];
    byScore: LeaderboardEntry[];
  };
  totals: {
    lastTouchOrders: number;
    lastTouchRevenue: number;
    firstTouchOrders: number;
    firstTouchRevenue: number;
    successfulOrders: number;
    newUsers: number;
    newBuyers: number;
    feesAllocated: number;
    uniqueCustomers: number;
    unattributedInfluencerish: number;
    creatorsWithActivity: number;
  };
  matrix: {
    /** creatorId x placement term last-touch revenue */
    placements: Array<{ creatorId: string; handle: string; term: string; orders: number; revenue: number }>;
  };
  note: string;
  sortKey: SortKey;
}

type Acc = {
  lastOrders: number;
  lastRevenue: number;
  firstOrders: number;
  firstRevenue: number;
  successful: number;
  pending: number;
  failed: number;
  rto: number;
  cod: number;
  prepaid: number;
  customerIds: Set<string>;
  customerOrderCounts: Map<string, number>;
  placements: Map<string, { lastOrders: number; lastRevenue: number; firstOrders: number; firstRevenue: number }>;
};

function emptyAcc(): Acc {
  return {
    lastOrders: 0,
    lastRevenue: 0,
    firstOrders: 0,
    firstRevenue: 0,
    successful: 0,
    pending: 0,
    failed: 0,
    rto: 0,
    cod: 0,
    prepaid: 0,
    customerIds: new Set(),
    customerOrderCounts: new Map(),
    placements: new Map(),
  };
}

function ensure(map: Map<string, Acc>, id: string): Acc {
  const key = id.toLowerCase();
  if (!map.has(key)) map.set(key, emptyAcc());
  return map.get(key)!;
}

function bumpPlacement(
  acc: Acc,
  term: string | undefined,
  side: 'last' | 'first',
  total: number
) {
  const t = (term || 'unspecified').toLowerCase() || 'unspecified';
  if (!acc.placements.has(t)) {
    acc.placements.set(t, { lastOrders: 0, lastRevenue: 0, firstOrders: 0, firstRevenue: 0 });
  }
  const p = acc.placements.get(t)!;
  if (side === 'last') {
    p.lastOrders += 1;
    p.lastRevenue += total;
  } else {
    p.firstOrders += 1;
    p.firstRevenue += total;
  }
}

function classifyStatus(status: string) {
  if (successStatuses.includes(status)) return 'successful' as const;
  if (pendingLike.includes(status)) return 'pending' as const;
  if (failedLike.includes(status)) return 'failed' as const;
  if (rtoLike.includes(status)) return 'rto' as const;
  return 'other' as const;
}

function compositeScore(row: {
  lastTouchRevenue: number;
  lastTouchOrders: number;
  newUsers: number;
  newBuyers: number;
  roasLast: number | null;
  contributionLast: number | null;
  conversionRate: number | null;
  feeInr: number;
}): number {
  // Weighted heuristic for "optimum benefit" ranking — transparent, not ML.
  const revenuePart = Math.min(row.lastTouchRevenue / 1000, 100); // ₹1k → 1pt, cap 100
  const orderPart = Math.min(row.lastTouchOrders * 2, 40);
  const userPart = Math.min(row.newUsers * 3, 45);
  const buyerPart = Math.min(row.newBuyers * 5, 50);
  const roasPart = row.roasLast != null ? Math.min(row.roasLast * 8, 40) : 0;
  const contribPart =
    row.contributionLast != null ? Math.min(Math.max(row.contributionLast, 0) / 1000, 30) : 0;
  const convPart = row.conversionRate != null ? row.conversionRate * 20 : 0;
  // slight penalty if fee paid with zero sales
  const feePenalty = row.feeInr > 0 && row.lastTouchOrders === 0 ? -10 : 0;
  return Math.round((revenuePart + orderPart + userPart + buyerPart + roasPart + contribPart + convPart + feePenalty) * 10) / 10;
}

export async function getInfluencerAnalytics(
  from: string,
  to: string,
  sortKey: SortKey = 'score'
): Promise<InfluencerAnalyticsData> {
  await connectDB();

  const fromDate = new Date(`${from}T00:00:00+05:30`);
  const toDate = new Date(`${to}T23:59:59.999+05:30`);

  const [orders, creators, acquiredUsers] = await Promise.all([
    Order.find({
      createdAt: { $gte: fromDate, $lte: toDate },
    })
      .select(
        'total status paymentMethod userId utm_content utm_medium utm_term attribution createdAt'
      )
      .lean(),
    InfluencerCreator.find().lean(),
    User.find({
      createdAt: { $gte: fromDate, $lte: toDate },
      $or: [
        { 'acquisition.creatorId': { $exists: true, $ne: null } },
        { 'acquisition.content': { $exists: true, $ne: null } },
      ],
    })
      .select('_id acquisition createdAt')
      .lean(),
  ]);

  const creatorById = new Map<string, any>();
  for (const c of creators) {
    creatorById.set(String(c.creatorId).toLowerCase(), c);
  }

  const acc = new Map<string, Acc>();
  const newUsersByCreator = new Map<string, Set<string>>();
  let unattributedInfluencerish = 0;

  for (const u of acquiredUsers) {
    const cid = String(u.acquisition?.creatorId || u.acquisition?.content || '')
      .toLowerCase()
      .trim();
    if (!cid) continue;
    if (!newUsersByCreator.has(cid)) newUsersByCreator.set(cid, new Set());
    newUsersByCreator.get(cid)!.add(String(u._id));
    ensure(acc, cid);
  }

  for (const order of orders) {
    const total = order.total || 0;
    const status = order.status || 'Pending';
    const bucket = classifyStatus(status);
    const lastContent = String(
      order.attribution?.lastTouch?.content || order.utm_content || ''
    )
      .toLowerCase()
      .trim();
    const firstContent = String(
      order.attribution?.firstTouch?.content || lastContent || ''
    )
      .toLowerCase()
      .trim();
    const lastTerm =
      order.attribution?.lastTouch?.term || order.utm_term || undefined;
    const firstTerm = order.attribution?.firstTouch?.term || lastTerm;
    const medium = String(
      order.attribution?.lastTouch?.medium || order.utm_medium || ''
    ).toLowerCase();
    const userId = order.userId ? String(order.userId) : '';

    if (lastContent) {
      const a = ensure(acc, lastContent);
      a.lastOrders += 1;
      a.lastRevenue += bucket === 'successful' ? total : 0;
      if (bucket === 'successful') a.successful += 1;
      if (bucket === 'pending') a.pending += 1;
      if (bucket === 'failed') a.failed += 1;
      if (bucket === 'rto') a.rto += 1;
      if (order.paymentMethod === 'cod') a.cod += 1;
      else a.prepaid += 1;
      if (userId) {
        a.customerIds.add(userId);
        a.customerOrderCounts.set(userId, (a.customerOrderCounts.get(userId) || 0) + 1);
      }
      bumpPlacement(a, lastTerm, 'last', bucket === 'successful' ? total : 0);
    } else if (medium === 'influencer') {
      unattributedInfluencerish += 1;
    }

    if (firstContent) {
      const a = ensure(acc, firstContent);
      a.firstOrders += 1;
      a.firstRevenue += bucket === 'successful' ? total : 0;
      bumpPlacement(a, firstTerm, 'first', bucket === 'successful' ? total : 0);
    }
  }

  for (const c of creators) {
    ensure(acc, c.creatorId);
  }

  // new buyers: intersection of acquired users and successful last-touch customers
  const rowsUnranked: Omit<InfluencerPerfRow, 'rank'>[] = Array.from(acc.entries()).map(
    ([creatorId, a]) => {
      const meta = creatorById.get(creatorId);
      const feeInr = meta?.feeInr || 0;
      const productCostInr = meta?.productCostInr || 0;
      const newUserSet = newUsersByCreator.get(creatorId) || new Set<string>();
      const newUsers = newUserSet.size;
      let newBuyers = 0;
      for (const uid of newUserSet) {
        if (a.customerIds.has(uid)) newBuyers += 1;
      }
      const successfulOrders = a.successful;
      const lastTouchOrders = a.successful; // P&L last-touch = successful only
      const lastTouchRevenue = a.lastRevenue;
      const denom =
        a.successful + a.pending + a.failed + a.rto || a.lastOrders || 0;
      const conversionRate =
        denom > 0 ? Number((a.successful / denom).toFixed(4)) : null;
      const aovLast =
        lastTouchOrders > 0 ? Math.round(lastTouchRevenue / lastTouchOrders) : 0;
      const cpaLast =
        lastTouchOrders > 0 && feeInr > 0 ? Math.round(feeInr / lastTouchOrders) : null;
      const cacNewUser = newUsers > 0 && feeInr > 0 ? Math.round(feeInr / newUsers) : null;
      const roasLast = feeInr > 0 ? Number((lastTouchRevenue / feeInr).toFixed(2)) : null;
      const contributionLast =
        lastTouchOrders > 0 || feeInr > 0 || productCostInr > 0
          ? Math.round(lastTouchRevenue - feeInr - productCostInr)
          : null;
      const repeatCustomers = Array.from(a.customerOrderCounts.values()).filter((n) => n > 1)
        .length;
      const buyerConversionPct =
        newUsers > 0 ? Number(((newBuyers / newUsers) * 100).toFixed(1)) : null;

      const placements: PlacementRow[] = Array.from(a.placements.entries())
        .map(([term, p]) => ({
          term,
          lastOrders: p.lastOrders,
          lastRevenue: p.lastRevenue,
          firstOrders: p.firstOrders,
          firstRevenue: p.firstRevenue,
        }))
        .sort((x, y) => y.lastRevenue - x.lastRevenue);

      const base = {
        creatorId,
        handle: meta?.handle || creatorId,
        displayName: meta?.displayName || meta?.handle || creatorId,
        platform: meta?.platform || '-',
        isActive: meta ? meta.isActive !== false : false,
        feeInr,
        productCostInr,
        registered: !!meta,
        newUsers,
        newBuyers,
        buyerConversionPct,
        lastTouchOrders,
        lastTouchRevenue,
        firstTouchOrders: a.firstOrders,
        firstTouchRevenue: a.firstRevenue,
        successfulOrders,
        pendingOrders: a.pending,
        failedOrders: a.failed,
        rtoOrders: a.rto,
        codOrders: a.cod,
        prepaidOrders: a.prepaid,
        uniqueCustomers: a.customerIds.size,
        repeatCustomers,
        aovLast,
        cpaLast,
        cacNewUser,
        roasLast,
        contributionLast,
        conversionRate,
        placements,
      };

      return {
        ...base,
        score: compositeScore(base),
      };
    }
  );

  const sortFns: Record<SortKey, (a: (typeof rowsUnranked)[0], b: (typeof rowsUnranked)[0]) => number> = {
    score: (a, b) => b.score - a.score,
    lastTouchRevenue: (a, b) => b.lastTouchRevenue - a.lastTouchRevenue,
    lastTouchOrders: (a, b) => b.lastTouchOrders - a.lastTouchOrders,
    newUsers: (a, b) => b.newUsers - a.newUsers || b.newBuyers - a.newBuyers,
    newBuyers: (a, b) => b.newBuyers - a.newBuyers || b.newUsers - a.newUsers,
    roasLast: (a, b) => (b.roasLast ?? -1) - (a.roasLast ?? -1),
    contributionLast: (a, b) => (b.contributionLast ?? -1e12) - (a.contributionLast ?? -1e12),
    conversionRate: (a, b) => (b.conversionRate ?? -1) - (a.conversionRate ?? -1),
    firstTouchRevenue: (a, b) => b.firstTouchRevenue - a.firstTouchRevenue,
  };

  const sorted = [...rowsUnranked].sort(sortFns[sortKey] || sortFns.score);
  const rows: InfluencerPerfRow[] = sorted.map((r, i) => ({ ...r, rank: i + 1 }));

  const top = (key: SortKey, labelFn: (r: InfluencerPerfRow) => string, n = 10): LeaderboardEntry[] =>
    [...rowsUnranked]
      .sort(sortFns[key])
      .slice(0, n)
      .map((r, i) => ({
        rank: i + 1,
        creatorId: r.creatorId,
        handle: r.handle,
        metric:
          key === 'score'
            ? r.score
            : key === 'lastTouchRevenue'
              ? r.lastTouchRevenue
              : key === 'lastTouchOrders'
                ? r.lastTouchOrders
                : key === 'newUsers'
                  ? r.newUsers
                  : key === 'newBuyers'
                    ? r.newBuyers
                    : key === 'roasLast'
                      ? r.roasLast ?? 0
                      : key === 'contributionLast'
                        ? r.contributionLast ?? 0
                        : key === 'conversionRate'
                          ? r.conversionRate ?? 0
                          : r.firstTouchRevenue,
        label: labelFn(r as InfluencerPerfRow),
      }));

let lastTouchOrders = 0;
  let lastTouchRevenue = 0;
  let firstTouchOrders = 0;
  let firstTouchRevenue = 0;
  let successfulOrders = 0;
  let newUsers = 0;
  let newBuyers = 0;
  let feesAllocated = 0;
  let creatorsWithActivity = 0;

  const matrixPlacements: InfluencerAnalyticsData['matrix']['placements'] = [];

  for (const r of rows) {
    lastTouchOrders += r.lastTouchOrders;
    lastTouchRevenue += r.lastTouchRevenue;
    firstTouchOrders += r.firstTouchOrders;
    firstTouchRevenue += r.firstTouchRevenue;
    successfulOrders += r.successfulOrders;
    newUsers += r.newUsers;
    newBuyers += r.newBuyers;
    if (r.lastTouchOrders > 0 || r.newUsers > 0) {
      feesAllocated += r.feeInr;
      creatorsWithActivity += 1;
    }
    for (const p of r.placements) {
      if (p.lastOrders > 0 || p.lastRevenue > 0) {
        matrixPlacements.push({
          creatorId: r.creatorId,
          handle: r.handle,
          term: p.term,
          orders: p.lastOrders,
          revenue: p.lastRevenue,
        });
      }
    }
  }

  // unique customers across creators would double-count multi-touch; report sum of per-creator uniques as directional
  const uniqueCustomers = rows.reduce((s, r) => s + r.uniqueCustomers, 0);

  return JSON.parse(
    JSON.stringify({
      rows,
      leaderboards: {
        byRevenue: top('lastTouchRevenue', (r) => `₹${r.lastTouchRevenue}`),
        byOrders: top('lastTouchOrders', (r) => `${r.lastTouchOrders} orders`),
        byNewUsers: top('newUsers', (r) => `${r.newUsers} users · ${r.newBuyers} buyers`),
        byRoas: top('roasLast', (r) => (r.roasLast != null ? `${r.roasLast}x` : '—')),
        byScore: top('score', (r) => `${r.score}`),
      },
      totals: {
        lastTouchOrders,
        lastTouchRevenue,
        firstTouchOrders,
        firstTouchRevenue,
        successfulOrders,
        newUsers,
        newBuyers,
        feesAllocated,
        uniqueCustomers,
        unattributedInfluencerish,
        creatorsWithActivity,
      },
      matrix: { placements: matrixPlacements.sort((a, b) => b.revenue - a.revenue) },
      note:
        'Score blends last-touch revenue, orders, new users/buyers, ROAS, contribution, and conversion. First vs last are separate models — do not sum both into company revenue. New users come from User.acquisition stamped at signup (OTP / Google / Express). Page/session drop-off lives in GA4 + Clarity, not here.',
      sortKey,
    })
  );
}
