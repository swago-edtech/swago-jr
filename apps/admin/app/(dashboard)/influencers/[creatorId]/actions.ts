'use server';

import { connectDB, Order, InfluencerCreator, User } from '@swago/database';

const successStatuses = ['Paid', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
const pendingLike = ['Pending'];
const failedLike = ['Failed', 'Cancelled'];
const abandonedLike = ['Abandoned'];
const rtoLike = ['RTO', 'Returned', 'Refunded'];

const CART_ABANDON_MS = 7 * 24 * 60 * 60 * 1000;

export type FunnelStage =
  | 'converted'
  | 'checkout_pending'
  | 'checkout_abandoned'
  | 'order_failed'
  | 'order_rto'
  | 'cart_active'
  | 'cart_abandoned'
  | 'signed_up_only'
  | 'order_only'; // last-touch order buyer without acquisition stamp

export type UtmTouchView = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  landingPath?: string;
  referrer?: string;
  capturedAt?: string;
};

export type PersonOrderRow = {
  id: string;
  orderId: string;
  status: string;
  total: number;
  paymentMethod?: string;
  createdAt: string;
  attributionSide: 'last' | 'first' | 'both' | 'none';
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  firstTouch?: UtmTouchView;
  lastTouch?: UtmTouchView;
  itemsSummary: string;
};

export type PersonRow = {
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  authMethod?: string;
  joinedAt?: string;
  /** How they entered the person list */
  link: 'acquired' | 'ordered' | 'both';
  stage: FunnelStage;
  stageLabel: string;
  /** Acquisition UTM (signup first-touch) */
  acquisition?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
    creatorId?: string;
    landingPath?: string;
    referrer?: string;
    capturedAt?: string;
    via?: string;
  };
  cart: {
    itemCount: number;
    distinctProducts: number;
    totalValue: number;
    oldestItemAt?: string;
    isAbandoned: boolean;
    items: Array<{ name: string; quantity: number; price: number }>;
  };
  orderStats: {
    total: number;
    successful: number;
    pending: number;
    abandoned: number;
    failed: number;
    rto: number;
    revenue: number;
    lastOrderAt?: string;
    lastOrderStatus?: string;
    lastOrderId?: string;
  };
  orders: PersonOrderRow[];
};

export type CreatorDetailData = {
  creator: {
    creatorId: string;
    handle: string;
    displayName: string;
    platform: string;
    feeInr: number;
    productCostInr: number;
    defaultCampaign?: string;
    notes?: string;
    isActive: boolean;
    registered: boolean;
  };
  range: { from: string; to: string };
  totals: {
    people: number;
    acquiredUsers: number;
    convertedBuyers: number;
    signedUpOnly: number;
    cartActive: number;
    cartAbandoned: number;
    checkoutPending: number;
    checkoutAbandoned: number;
    orderFailed: number;
    orderRto: number;
    successfulOrders: number;
    allAttributedOrders: number;
    lastTouchRevenue: number;
    firstTouchRevenue: number;
    contribution: number;
    roas: number | null;
    cpa: number | null;
    aov: number;
  };
  /** Placement / platform breakdown from last-touch successful orders */
  sources: Array<{
    key: string;
    label: string;
    kind: 'platform' | 'placement' | 'campaign';
    orders: number;
    revenue: number;
    people: number;
  }>;
  recentOrders: PersonOrderRow[];
  people: PersonRow[];
  note: string;
};

function classifyStatus(status: string) {
  if (successStatuses.includes(status)) return 'successful' as const;
  if (pendingLike.includes(status)) return 'pending' as const;
  if (abandonedLike.includes(status)) return 'abandoned' as const;
  if (failedLike.includes(status)) return 'failed' as const;
  if (rtoLike.includes(status)) return 'rto' as const;
  return 'other' as const;
}

function stageLabel(stage: FunnelStage): string {
  switch (stage) {
    case 'converted':
      return 'Converted (paid order)';
    case 'checkout_pending':
      return 'Checkout pending';
    case 'checkout_abandoned':
      return 'Checkout abandoned';
    case 'order_failed':
      return 'Order failed / cancelled';
    case 'order_rto':
      return 'RTO / returned';
    case 'cart_active':
      return 'Active cart';
    case 'cart_abandoned':
      return 'Abandoned cart';
    case 'signed_up_only':
      return 'Signed up · no cart / order';
    case 'order_only':
      return 'Ordered (not acquired signup)';
    default:
      return stage;
  }
}

function resolveStage(input: {
  successful: number;
  pending: number;
  abandoned: number;
  failed: number;
  rto: number;
  cartItems: number;
  cartAbandoned: boolean;
  acquired: boolean;
}): FunnelStage {
  if (input.successful > 0) return 'converted';
  if (input.pending > 0) return 'checkout_pending';
  if (input.abandoned > 0) return 'checkout_abandoned';
  if (input.rto > 0) return 'order_rto';
  if (input.failed > 0) return 'order_failed';
  if (input.cartItems > 0) return input.cartAbandoned ? 'cart_abandoned' : 'cart_active';
  if (input.acquired) return 'signed_up_only';
  return 'order_only';
}

function touchView(t: any | undefined | null): UtmTouchView | undefined {
  if (!t || typeof t !== 'object') return undefined;
  return {
    source: t.source || undefined,
    medium: t.medium || undefined,
    campaign: t.campaign || undefined,
    content: t.content || undefined,
    term: t.term || undefined,
    landingPath: t.landingPath || undefined,
    referrer: t.referrer || undefined,
    capturedAt: t.capturedAt || undefined,
  };
}

function orderToRow(order: any, creatorId: string): PersonOrderRow {
  const lastC = String(order.attribution?.lastTouch?.content || order.utm_content || '')
    .toLowerCase()
    .trim();
  const firstC = String(order.attribution?.firstTouch?.content || '')
    .toLowerCase()
    .trim();
  let attributionSide: PersonOrderRow['attributionSide'] = 'none';
  if (lastC === creatorId && firstC === creatorId) attributionSide = 'both';
  else if (lastC === creatorId) attributionSide = 'last';
  else if (firstC === creatorId) attributionSide = 'first';

  const items = Array.isArray(order.items) ? order.items : [];
  const itemsSummary = items
    .slice(0, 3)
    .map((it: any) => `${it.name || 'Item'}×${it.quantity || 1}`)
    .join(', ');

  return {
    id: String(order._id),
    orderId: order.orderId || String(order._id).slice(-8),
    status: order.status || 'Pending',
    total: order.total || 0,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : '',
    attributionSide,
    utm: {
      source: order.utm_source || order.attribution?.lastTouch?.source,
      medium: order.utm_medium || order.attribution?.lastTouch?.medium,
      campaign: order.utm_campaign || order.attribution?.lastTouch?.campaign,
      content: order.utm_content || order.attribution?.lastTouch?.content,
      term: order.utm_term || order.attribution?.lastTouch?.term,
    },
    firstTouch: touchView(order.attribution?.firstTouch),
    lastTouch: touchView(order.attribution?.lastTouch),
    itemsSummary: itemsSummary || '—',
  };
}

export async function getCreatorDetail(
  creatorIdRaw: string,
  from: string,
  to: string
): Promise<CreatorDetailData | null> {
  await connectDB();

  const creatorId = String(creatorIdRaw || '')
    .trim()
    .toLowerCase();
  if (!creatorId) return null;

  const fromDate = new Date(`${from}T00:00:00+05:30`);
  const toDate = new Date(`${to}T23:59:59.999+05:30`);

  const creatorDoc = await InfluencerCreator.findOne({ creatorId }).lean();

  const creator = {
    creatorId,
    handle: (creatorDoc as any)?.handle || creatorId,
    displayName: (creatorDoc as any)?.displayName || (creatorDoc as any)?.handle || creatorId,
    platform: (creatorDoc as any)?.platform || '—',
    feeInr: (creatorDoc as any)?.feeInr || 0,
    productCostInr: (creatorDoc as any)?.productCostInr || 0,
    defaultCampaign: (creatorDoc as any)?.defaultCampaign || undefined,
    notes: (creatorDoc as any)?.notes || undefined,
    isActive: creatorDoc ? (creatorDoc as any).isActive !== false : false,
    registered: !!creatorDoc,
  };

  // Acquired users (first-touch at signup) — may be outside range for lifetime view;
  // default: signup in range OR any attributed order in range.
  const [acquiredUsers, ordersInRange] = await Promise.all([
    User.find({
      $or: [
        { 'acquisition.creatorId': creatorId },
        { 'acquisition.content': creatorId },
      ],
    })
      .select(
        '_id name phone email authMethod createdAt updatedAt cart acquisition'
      )
      .lean(),
    Order.find({
      createdAt: { $gte: fromDate, $lte: toDate },
      $or: [
        { utm_content: creatorId },
        { 'attribution.lastTouch.content': creatorId },
        { 'attribution.firstTouch.content': creatorId },
      ],
    })
      .select(
        'orderId userId name phone email total status paymentMethod items createdAt utm_source utm_medium utm_campaign utm_content utm_term attribution'
      )
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  // Also pull ALL orders for acquired users (for person history) — capped
  const acquiredIds = acquiredUsers.map((u: any) => u._id);
  const orderUserIds = [
    ...new Set(
      ordersInRange
        .map((o: any) => (o.userId ? String(o.userId) : ''))
        .filter(Boolean)
    ),
  ];

  // Users who only appear via orders (no acquisition stamp)
  const missingUserIds = orderUserIds.filter(
    (id) => !acquiredIds.some((aid: any) => String(aid) === id)
  );

  const extraUsers =
    missingUserIds.length > 0
      ? await User.find({ _id: { $in: missingUserIds } })
          .select('_id name phone email authMethod createdAt updatedAt cart acquisition')
          .lean()
      : [];

  // Full order history for people in this set (not only range) so detail is complete
  const allPersonIds = [
    ...acquiredIds.map((id: any) => String(id)),
    ...missingUserIds,
  ];
  const historyOrders =
    allPersonIds.length > 0
      ? await Order.find({ userId: { $in: allPersonIds } })
          .select(
            'orderId userId name phone email total status paymentMethod items createdAt utm_source utm_medium utm_campaign utm_content utm_term attribution'
          )
          .sort({ createdAt: -1 })
          .limit(2000)
          .lean()
      : [];

  const ordersByUser = new Map<string, any[]>();
  for (const o of historyOrders) {
    const uid = o.userId ? String(o.userId) : '';
    if (!uid) continue;
    if (!ordersByUser.has(uid)) ordersByUser.set(uid, []);
    ordersByUser.get(uid)!.push(o);
  }
  // Also index range orders that may not be in history if userId missing
  for (const o of ordersInRange) {
    const uid = o.userId ? String(o.userId) : '';
    if (!uid) continue;
    if (!ordersByUser.has(uid)) ordersByUser.set(uid, []);
    const list = ordersByUser.get(uid)!;
    if (!list.some((x) => String(x._id) === String(o._id))) list.push(o);
  }

  const peopleMap = new Map<string, any>();
  for (const u of acquiredUsers) peopleMap.set(String(u._id), { user: u, acquired: true });
  for (const u of extraUsers) {
    const id = String(u._id);
    if (!peopleMap.has(id)) peopleMap.set(id, { user: u, acquired: false });
  }

  // Guest / missing user shells from orders
  for (const o of ordersInRange) {
    const uid = o.userId ? String(o.userId) : '';
    if (!uid || peopleMap.has(uid)) continue;
    peopleMap.set(uid, {
      user: {
        _id: uid,
        name: o.name || 'Unknown',
        phone: o.phone,
        email: o.email,
        cart: [],
      },
      acquired: false,
    });
  }

  const now = Date.now();
  const people: PersonRow[] = [];

  let lastTouchRevenue = 0;
  let firstTouchRevenue = 0;
  let successfulOrders = 0;
  let allAttributedOrders = 0;

  const platformAgg = new Map<string, { orders: number; revenue: number; people: Set<string> }>();
  const placementAgg = new Map<string, { orders: number; revenue: number; people: Set<string> }>();
  const campaignAgg = new Map<string, { orders: number; revenue: number; people: Set<string> }>();

  const bump = (
    map: Map<string, { orders: number; revenue: number; people: Set<string> }>,
    key: string,
    revenue: number,
    uid: string
  ) => {
    const k = (key || 'unspecified').toLowerCase();
    if (!map.has(k)) map.set(k, { orders: 0, revenue: 0, people: new Set() });
    const e = map.get(k)!;
    e.orders += 1;
    e.revenue += revenue;
    if (uid) e.people.add(uid);
  };

  // Totals from range orders (creator-attributed)
  for (const o of ordersInRange) {
    const status = o.status || 'Pending';
    const bucket = classifyStatus(status);
    const total = o.total || 0;
    const uid = o.userId ? String(o.userId) : '';
    const lastC = String(o.attribution?.lastTouch?.content || o.utm_content || '')
      .toLowerCase()
      .trim();
    const firstC = String(o.attribution?.firstTouch?.content || '')
      .toLowerCase()
      .trim();
    const isLast = lastC === creatorId;
    const isFirst = firstC === creatorId || (!firstC && isLast);

    if (isLast || isFirst) allAttributedOrders += 1;
    if (isLast && bucket === 'successful') {
      lastTouchRevenue += total;
      successfulOrders += 1;
      bump(platformAgg, o.utm_source || o.attribution?.lastTouch?.source || creator.platform, total, uid);
      bump(placementAgg, o.utm_term || o.attribution?.lastTouch?.term || 'unspecified', total, uid);
      bump(campaignAgg, o.utm_campaign || o.attribution?.lastTouch?.campaign || 'unspecified', total, uid);
    }
    if (isFirst && bucket === 'successful') {
      firstTouchRevenue += total;
    }
  }

  for (const [userId, meta] of peopleMap.entries()) {
    const u = meta.user;
    const acquired = !!meta.acquired;
    const cartItems = Array.isArray(u.cart) ? u.cart : [];
    const cartValue = cartItems.reduce(
      (s: number, it: any) => s + (it.price || 0) * (it.quantity || 0),
      0
    );
    const oldestCart =
      cartItems.length > 0
        ? cartItems
            .map((it: any) => new Date(it.addedAt || u.createdAt || 0).getTime())
            .filter((t: number) => !Number.isNaN(t))
            .sort((a: number, b: number) => a - b)[0]
        : undefined;
    const cartAbandoned =
      cartItems.length > 0 && oldestCart != null ? now - oldestCart >= CART_ABANDON_MS : false;

    const userOrders = ordersByUser.get(userId) || [];
    // Prefer orders in range for stage; fall back to all history
    const rangeUserOrders = userOrders.filter((o) => {
      const t = o.createdAt ? new Date(o.createdAt).getTime() : 0;
      return t >= fromDate.getTime() && t <= toDate.getTime();
    });
    const stageOrders = rangeUserOrders.length > 0 ? rangeUserOrders : userOrders;

    let successful = 0;
    let pending = 0;
    let abandoned = 0;
    let failed = 0;
    let rto = 0;
    let revenue = 0;
    let lastOrderAt: string | undefined;
    let lastOrderStatus: string | undefined;
    let lastOrderId: string | undefined;

    const personOrderRows: PersonOrderRow[] = [];
    const sorted = [...userOrders].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    for (const o of sorted) {
      const row = orderToRow(o, creatorId);
      // Include if attributed to this creator OR user was acquired by them
      const related =
        acquired ||
        row.attributionSide !== 'none' ||
        String(o.utm_content || '').toLowerCase() === creatorId;
      if (related) personOrderRows.push(row);
    }

    for (const o of stageOrders) {
      const bucket = classifyStatus(o.status || 'Pending');
      if (bucket === 'successful') {
        successful += 1;
        // revenue only if last-touch this creator or acquired buyer success
        const lastC = String(o.attribution?.lastTouch?.content || o.utm_content || '')
          .toLowerCase()
          .trim();
        if (lastC === creatorId || (!lastC && acquired)) revenue += o.total || 0;
      }
      if (bucket === 'pending') pending += 1;
      if (bucket === 'abandoned') abandoned += 1;
      if (bucket === 'failed') failed += 1;
      if (bucket === 'rto') rto += 1;
    }

    if (sorted[0]) {
      lastOrderAt = sorted[0].createdAt
        ? new Date(sorted[0].createdAt).toISOString()
        : undefined;
      lastOrderStatus = sorted[0].status;
      lastOrderId = sorted[0].orderId || String(sorted[0]._id).slice(-8);
    }

    // Skip people with zero connection in range and no acquisition ever if they only have unrelated history
    const hasRangeActivity =
      rangeUserOrders.length > 0 ||
      (acquired &&
        u.createdAt &&
        new Date(u.createdAt).getTime() >= fromDate.getTime() &&
        new Date(u.createdAt).getTime() <= toDate.getTime()) ||
      cartItems.length > 0;

    // Always show acquired users; show order-only if they have range orders
    if (!acquired && rangeUserOrders.length === 0) continue;
    // For acquired outside range with no range orders and empty cart — still show if "all time people"
    // Default: show acquired always + order-only in range
    if (!acquired && !hasRangeActivity) continue;

    const stage = resolveStage({
      successful,
      pending,
      abandoned,
      failed,
      rto,
      cartItems: cartItems.length,
      cartAbandoned,
      acquired,
    });

    const acq = u.acquisition || {};
    const link: PersonRow['link'] =
      acquired && personOrderRows.some((r) => r.attributionSide !== 'none')
        ? 'both'
        : acquired
          ? 'acquired'
          : 'ordered';

    people.push({
      userId,
      name: u.name || '—',
      phone: u.phone || undefined,
      email: u.email || undefined,
      authMethod: u.authMethod || undefined,
      joinedAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
      link,
      stage,
      stageLabel: stageLabel(stage),
      acquisition: acquired
        ? {
            source: acq.source,
            medium: acq.medium,
            campaign: acq.campaign,
            content: acq.content,
            term: acq.term,
            creatorId: acq.creatorId || acq.content,
            landingPath: acq.landingPath,
            referrer: acq.referrer,
            capturedAt: acq.capturedAt
              ? new Date(acq.capturedAt).toISOString()
              : undefined,
            via: acq.via,
          }
        : undefined,
      cart: {
        itemCount: cartItems.reduce((s: number, it: any) => s + (it.quantity || 0), 0),
        distinctProducts: cartItems.length,
        totalValue: cartValue,
        oldestItemAt: oldestCart != null ? new Date(oldestCart).toISOString() : undefined,
        isAbandoned: cartAbandoned,
        items: cartItems.slice(0, 8).map((it: any) => ({
          name: it.name || 'Item',
          quantity: it.quantity || 1,
          price: it.price || 0,
        })),
      },
      orderStats: {
        total: personOrderRows.length,
        successful,
        pending,
        abandoned,
        failed,
        rto,
        revenue,
        lastOrderAt,
        lastOrderStatus,
        lastOrderId,
      },
      orders: personOrderRows.slice(0, 25),
    });
  }

  // Sort: converted first, then checkout issues, carts, signed up
  const stageRank: Record<FunnelStage, number> = {
    converted: 0,
    checkout_pending: 1,
    checkout_abandoned: 2,
    order_failed: 3,
    order_rto: 4,
    cart_active: 5,
    cart_abandoned: 6,
    order_only: 7,
    signed_up_only: 8,
  };
  people.sort((a, b) => {
    const d = stageRank[a.stage] - stageRank[b.stage];
    if (d !== 0) return d;
    return (b.orderStats.revenue || 0) - (a.orderStats.revenue || 0);
  });

  const contribution = Math.round(lastTouchRevenue - creator.feeInr - creator.productCostInr);
  const roas =
    creator.feeInr > 0 ? Number((lastTouchRevenue / creator.feeInr).toFixed(2)) : null;
  const cpa =
    successfulOrders > 0 && creator.feeInr > 0
      ? Math.round(creator.feeInr / successfulOrders)
      : null;
  const aov = successfulOrders > 0 ? Math.round(lastTouchRevenue / successfulOrders) : 0;

  const mapSources = (
    map: Map<string, { orders: number; revenue: number; people: Set<string> }>,
    kind: 'platform' | 'placement' | 'campaign'
  ) =>
    Array.from(map.entries())
      .map(([key, v]) => ({
        key,
        label: key,
        kind,
        orders: v.orders,
        revenue: v.revenue,
        people: v.people.size,
      }))
      .sort((a, b) => b.revenue - a.revenue);

  const recentOrders = ordersInRange
    .filter((o: any) => {
      const lastC = String(o.attribution?.lastTouch?.content || o.utm_content || '')
        .toLowerCase()
        .trim();
      const firstC = String(o.attribution?.firstTouch?.content || '')
        .toLowerCase()
        .trim();
      return lastC === creatorId || firstC === creatorId;
    })
    .slice(0, 40)
    .map((o: any) => orderToRow(o, creatorId));

  const totals = {
    people: people.length,
    acquiredUsers: people.filter((p) => p.link === 'acquired' || p.link === 'both').length,
    convertedBuyers: people.filter((p) => p.stage === 'converted').length,
    signedUpOnly: people.filter((p) => p.stage === 'signed_up_only').length,
    cartActive: people.filter((p) => p.stage === 'cart_active').length,
    cartAbandoned: people.filter((p) => p.stage === 'cart_abandoned').length,
    checkoutPending: people.filter((p) => p.stage === 'checkout_pending').length,
    checkoutAbandoned: people.filter((p) => p.stage === 'checkout_abandoned').length,
    orderFailed: people.filter((p) => p.stage === 'order_failed').length,
    orderRto: people.filter((p) => p.stage === 'order_rto').length,
    successfulOrders,
    allAttributedOrders,
    lastTouchRevenue,
    firstTouchRevenue,
    contribution,
    roas,
    cpa,
    aov,
  };

  return JSON.parse(
    JSON.stringify({
      creator,
      range: { from, to },
      totals,
      sources: [
        ...mapSources(platformAgg, 'platform'),
        ...mapSources(placementAgg, 'placement'),
        ...mapSources(campaignAgg, 'campaign'),
      ],
      recentOrders,
      people,
      note:
        'People = users acquired via this creator’s UTM (User.acquisition) plus anyone with an order first/last-touch tagged to them. Contribution ≈ last-touch successful revenue − fee − product cost. Cart abandoned = items sitting ≥ 7 days. Checkout abandoned = order status Abandoned (payment never completed). Anonymous page views without signup are only in GA4/Clarity.',
    })
  ) as CreatorDetailData;
}
