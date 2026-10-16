/**
 * Seed demo influencer creators + attributed users/orders for admin review.
 * Tag: seed_analytics_demo_2026 — safe to delete and re-run.
 *
 * Usage:
 *   node --env-file=apps/admin/.env.local scripts/seed_influencer_analytics_demo.mjs
 *   node --env-file=apps/admin/.env.local scripts/seed_influencer_analytics_demo.mjs --clean
 */
import mongoose from "mongoose";

const SEED_TAG = "seed_analytics_demo_2026";
const cleanOnly = process.argv.includes("--clean");
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI missing (pass --env-file=apps/admin/.env.local)");
  process.exit(1);
}

const creators = [
  {
    creatorId: "annie_ig",
    handle: "annie.plays",
    displayName: "Annie Plays",
    platform: "instagram",
    feeInr: 25000,
    productCostInr: 4000,
    defaultCampaign: "spring_collab",
    notes: `${SEED_TAG} top IG reel creator`,
    isActive: true,
  },
  {
    creatorId: "rahul_yt",
    handle: "rahulboardgames",
    displayName: "Rahul Board Games",
    platform: "youtube",
    feeInr: 40000,
    productCostInr: 6000,
    defaultCampaign: "yt_review_wave",
    notes: `${SEED_TAG} YouTube reviews`,
    isActive: true,
  },
  {
    creatorId: "meera_wa",
    handle: "meeraparenting",
    displayName: "Meera Parenting",
    platform: "whatsapp",
    feeInr: 12000,
    productCostInr: 2000,
    defaultCampaign: "wa_groups",
    notes: `${SEED_TAG} WhatsApp groups`,
    isActive: true,
  },
  {
    creatorId: "dev_fb",
    handle: "devfamilyfun",
    displayName: "Dev Family Fun",
    platform: "facebook",
    feeInr: 8000,
    productCostInr: 1500,
    defaultCampaign: "fb_ads_boost",
    notes: `${SEED_TAG} Facebook`,
    isActive: true,
  },
  {
    creatorId: "kira_ig",
    handle: "kira.kids",
    displayName: "Kira Kids",
    platform: "instagram",
    feeInr: 18000,
    productCostInr: 3000,
    defaultCampaign: "story_sprint",
    notes: `${SEED_TAG} stories heavy`,
    isActive: true,
  },
  {
    creatorId: "paused_ig",
    handle: "oldcollab",
    displayName: "Old Collab (paused)",
    platform: "instagram",
    feeInr: 5000,
    productCostInr: 0,
    defaultCampaign: "legacy",
    notes: `${SEED_TAG} inactive creator with residual`,
    isActive: false,
  },
];

const placements = ["reel", "story", "bio", "dm", "post", "review", "group"];
const successStatuses = ["Paid", "Packed", "Shipped", "Out for Delivery", "Delivered"];
const otherStatuses = ["Pending", "Failed", "Cancelled", "RTO"];

function daysAgo(n, hour = 12) {
  const d = new Date();
  d.setHours(hour, 30, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function pick(arr, i) {
  return arr[i % arr.length];
}

function touch(creator, term, campaign, when) {
  return {
    source: creator.platform,
    medium: "influencer",
    campaign: campaign || creator.defaultCampaign,
    content: creator.creatorId,
    term,
    landingPath: "/",
    referrer: "https://instagram.com/",
    capturedAt: when.toISOString(),
  };
}

async function clean(db) {
  const users = await db.collection("users").deleteMany({ "acquisition.campaign": SEED_TAG });
  // also catch notes-based / email pattern
  const users2 = await db.collection("users").deleteMany({
    email: { $regex: `@${SEED_TAG}\\.demo$` },
  });
  const orders = await db.collection("orders").deleteMany({
    $or: [
      { couponCode: SEED_TAG },
      { email: { $regex: `@${SEED_TAG}\\.demo$` } },
      { "attribution.lastTouch.campaign": SEED_TAG },
    ],
  });
  const creatorDel = await db.collection("influencercreators").deleteMany({
    notes: { $regex: SEED_TAG },
  });
  console.log("Cleaned:", {
    users: users.deletedCount + users2.deletedCount,
    orders: orders.deletedCount,
    creators: creatorDel.deletedCount,
  });
}

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  console.log("Connected DB:", db.databaseName);

  await clean(db);
  if (cleanOnly) {
    await mongoose.disconnect();
    return;
  }

  // Upsert creators by creatorId
  for (const c of creators) {
    await db.collection("influencercreators").updateOne(
      { creatorId: c.creatorId },
      {
        $set: {
          ...c,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
  }
  console.log(`Upserted ${creators.length} creators`);

  const userDocs = [];
  const orderDocs = [];
  let userSeq = 0;
  let orderSeq = 0;

  // Weighted activity per creator
  const plan = {
    annie_ig: { users: 22, orders: 16 },
    rahul_yt: { users: 18, orders: 12 },
    meera_wa: { users: 14, orders: 8 },
    dev_fb: { users: 10, orders: 6 },
    kira_ig: { users: 12, orders: 7 },
    paused_ig: { users: 6, orders: 3 },
  };

  for (const creator of creators) {
    const cfg = plan[creator.creatorId] || { users: 5, orders: 3 };
    const creatorUsers = [];

    for (let i = 0; i < cfg.users; i++) {
      userSeq += 1;
      const createdAt = daysAgo(1 + (i % 25), 10 + (i % 8));
      const term = pick(placements, i + creator.creatorId.length);
      const phone = `9${String(800000000 + userSeq).slice(0, 9)}`;
      const email = `demo${userSeq}@${SEED_TAG}.demo`;
      const _id = new mongoose.Types.ObjectId();
      const doc = {
        _id,
        name: `Demo Parent ${userSeq}`,
        phone,
        email,
        authMethod: i % 3 === 0 ? "google" : "phone",
        isAdmin: false,
        wishlist: [],
        cart: [],
        acquisition: {
          source: creator.platform,
          medium: "influencer",
          // Keep campaign as SEED_TAG for easy cleanup; analytics still keys off creatorId/content
          campaign: SEED_TAG,
          content: creator.creatorId,
          term,
          creatorId: creator.creatorId,
          landingPath: "/",
          referrer: "seed",
          capturedAt: createdAt,
          via: i % 3 === 0 ? "google" : "otp_phone",
        },
        createdAt,
        updatedAt: createdAt,
      };
      userDocs.push(doc);
      creatorUsers.push(doc);
    }

    for (let i = 0; i < cfg.orders; i++) {
      orderSeq += 1;
      const createdAt = daysAgo(i % 28, 11 + (i % 10));
      const buyer = creatorUsers[i % creatorUsers.length];
      const term = pick(placements, i * 3 + 1);
      const isSuccess = i % 7 !== 0; // ~86% success
      const status = isSuccess
        ? pick(successStatuses, i)
        : pick(otherStatuses, i);
      const paymentMethod = i % 4 === 0 ? "cod" : "razorpay";
      const unit = 799 + (i % 5) * 200;
      const qty = 1 + (i % 2);
      const subtotal = unit * qty;
      const shippingFee = subtotal >= 999 ? 0 : 49;
      const total = subtotal + shippingFee;
      const firstTerm = pick(placements, i + 2);
      // Sometimes first-touch differs (multi-creator journey) — 20%
      const firstCreator =
        i % 5 === 0 ? creators[(creators.indexOf(creator) + 1) % creators.length] : creator;

      const first = touch(firstCreator, firstTerm, SEED_TAG, daysAgo((i % 28) + 2, 9));
      const last = touch(creator, term, SEED_TAG, createdAt);

      orderDocs.push({
        _id: new mongoose.Types.ObjectId(),
        orderId: `SW-DEMO-${SEED_TAG.slice(-4)}-${String(orderSeq).padStart(4, "0")}`,
        userId: buyer._id,
        phone: buyer.phone,
        email: buyer.email,
        name: buyer.name,
        address: "12 Demo Street",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        status,
        paymentMethod,
        items: [
          {
            productId: `demo-product-${(i % 4) + 1}`,
            name: `Demo Game ${(i % 4) + 1}`,
            price: unit,
            quantity: qty,
            image: "/demo.png",
          },
        ],
        subtotal,
        discount: 0,
        shippingFee,
        total,
        couponCode: SEED_TAG,
        createdVia: "frontend",
        utm_source: last.source,
        utm_medium: last.medium,
        utm_campaign: SEED_TAG,
        utm_content: last.content,
        utm_term: last.term,
        attribution: {
          firstTouch: first,
          lastTouch: last,
          windowDays: 7,
        },
        referralSource: "influencer_seed",
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  if (userDocs.length) {
    await db.collection("users").insertMany(userDocs, { ordered: false });
  }
  if (orderDocs.length) {
    await db.collection("orders").insertMany(orderDocs, { ordered: false });
  }

  const creatorCount = await db.collection("influencercreators").countDocuments({
    notes: { $regex: SEED_TAG },
  });
  const userCount = await db.collection("users").countDocuments({
    email: { $regex: `@${SEED_TAG}\\.demo$` },
  });
  const orderCount = await db.collection("orders").countDocuments({ couponCode: SEED_TAG });
  const paidLike = await db.collection("orders").countDocuments({
    couponCode: SEED_TAG,
    status: { $in: successStatuses },
  });

  console.log("Seed complete:", {
    tag: SEED_TAG,
    creators: creatorCount,
    users: userCount,
    orders: orderCount,
    successfulOrders: paidLike,
  });
  console.log("Sample short links:");
  console.log("  /r/annie_ig");
  console.log("  /r/annie_ig/reel");
  console.log("  /r/rahul_yt/review");
  console.log("  /r/meera_wa/group");

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
