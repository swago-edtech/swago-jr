import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@swago/utils';
import { connectDB, User, Product, LotteryCode } from '@swago/database';
import { getAdminSession } from '@/lib/auth';
import { User as UserIcon, Video, Brain, Ticket, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

// Fetch user data directly from DB (no API call)
async function getUserData(userId: string) {
  await connectDB();

  const userDoc = await User.findById(userId)
    .populate('orders')
    .lean();

  if (!userDoc) {
    return null;
  }

  const user = JSON.parse(JSON.stringify(userDoc)) as any;

  const cart = user.cart || [];
  const wishlist: Array<string | number> = user.wishlist || [];
  const orders = user.orders || [];

  // Cart stats
  const cartTotalValue = cart.reduce(
    (sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );

  const cartLastUpdated = user.updatedAt || null;

  const oldestCartItemDate =
    cart.length > 0
      ? cart
        .map((item: any) => new Date(item.addedAt || user.createdAt))
        .sort((a: Date, b: Date) => a.getTime() - b.getTime())[0]
      : null;

  let isAbandonedCart = false;
  if (oldestCartItemDate) {
    const now = new Date().getTime();
    const diffMs = now - oldestCartItemDate.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    isAbandonedCart = diffMs >= sevenDaysMs;
  }

  // Wishlist enrichment - get only DB product names
  const dbIds: string[] = [];

  for (const idVal of wishlist) {
    if (typeof idVal === 'string') {
      dbIds.push(idVal);
    }
  }

  // ✅ FIX: Properly type DB products
  const dbProducts = dbIds.length
    ? await Product.find({ _id: { $in: dbIds } })
      .select('name')
      .lean<Array<{ _id: any; name: string }>>() // ✅ Type annotation
    : [];

  const dbMap = new Map<string, string>();
  for (const p of dbProducts) {
    dbMap.set(p._id.toString(), p.name);
  }

  const wishlistEnriched = wishlist.map((pid) => {
    if (typeof pid === 'string' && dbMap.has(pid)) {
      return {
        productId: pid,
        name: dbMap.get(pid),
      };
    }

    return {
      productId: pid,
      name: `Product Not Found (ID: ${pid})`,
    };
  });

  const actualClaimedLotteryCount = await LotteryCode.countDocuments({
    usedBy: userId,
    isUsed: true
  });

  return {
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    email: user.email,
    authMethod: user.authMethod,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    cart,
    cartStats: {
      totalValue: cartTotalValue,
      lastUpdated: cartLastUpdated,
      oldestItemDate: oldestCartItemDate,
      isAbandoned: isAbandonedCart,
      itemCount: cart.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
      distinctProducts: cart.length,
    },
    orders,
    wishlist: wishlistEnriched,
    age: user.age,
    gender: user.gender,
    grade: user.grade,
    dob: user.dob,
    ambassador: user.ambassador,
    lotteryTickets: user.lotteryTickets || [],
    claimedLotteryCount: actualClaimedLotteryCount,
    swagoMoney: user.swagoMoney || 0,
  };
}

// Helper to format time ago
function getTimeAgo(dateString: string | Date | null): string {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

function ChallengeTimelineRow({ title, description, icon: Icon, steps, progressPercent, progressColor = 'bg-green-500' }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-4 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-center">
      
      {/* Left side: Info */}
      <div className="flex items-center gap-4 w-full lg:w-[260px] shrink-0">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-tight">{title}</h3>
          <p className="text-xs font-medium text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>

      {/* Right side: Timeline */}
      <div className="relative flex-1 w-full flex items-center justify-between px-2 md:px-8 mt-4 lg:mt-0">
        {/* Background Line */}
        <div className="absolute left-[20px] right-[20px] md:left-[40px] md:right-[40px] top-[14px] md:top-[16px] h-1.5 bg-gray-100 rounded-full z-0">
           <div className={`h-full transition-all duration-1000 ease-out rounded-full ${progressColor}`} style={{ width: `${progressPercent}%` }}></div>
        </div>

        {/* Steps */}
        {steps.map((step: any, idx: number) => {
          let borderColor = 'border-gray-200';
          let bgColor = 'bg-white';
          let iconColor = 'text-gray-300';
          let labelColor = 'text-gray-400';

          switch (step.color) {
            case 'green':
              borderColor = 'border-green-500'; bgColor = 'bg-green-500'; iconColor = 'text-white'; labelColor = 'text-gray-900';
              break;
            case 'amber':
              borderColor = 'border-amber-500'; bgColor = 'bg-white'; iconColor = 'text-amber-500'; labelColor = 'text-gray-900';
              break;
            case 'red':
              borderColor = 'border-red-500'; bgColor = 'bg-white'; iconColor = 'text-red-500'; labelColor = 'text-gray-900';
              break;
            case 'gray':
            default:
              borderColor = 'border-gray-200'; bgColor = 'bg-white'; iconColor = 'text-gray-300'; labelColor = 'text-gray-400';
              break;
          }

          const StepIcon = step.icon;
          
          return (
            <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
               <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-[3px] flex items-center justify-center transition-colors ${borderColor} ${bgColor}`}>
                 <StepIcon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${iconColor}`} />
               </div>
               <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-center max-w-[80px] leading-tight ${labelColor}`}>
                 {step.label}
               </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ ADD: Check admin session
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;
  const user = await getUserData(id);

  if (!user) {
    notFound();
  }

  const { cart, cartStats, orders, wishlist } = user;

  // --- Challenges & Milestones Calculation ---
  const profileCompleted = !!(user.age && user.gender && user.grade && user.dob);
  const entryChallengeStatus = user.ambassador?.entryChallenge?.status || 'not_submitted';
  
  const bgData = user.ambassador?.brainGym;
  const bgStatus = bgData?.status || 'not_submitted';
  const bgHasReel = !!bgData?.reelUrl;
  const isGhostSubmission = bgData?.completed && !bgHasReel;
  let computedBgStatus = 'not_submitted';
  if (bgStatus === 'approved') computedBgStatus = 'approved';
  else if (bgStatus === 'pending' && bgHasReel) computedBgStatus = 'pending';
  else if (bgStatus === 'rejected') computedBgStatus = 'rejected';
  else if (isGhostSubmission) computedBgStatus = 'not_submitted';

  const productsMap = new Map<string, string>();
  orders.forEach((order: any) => {
    const status = (order.status || '').toLowerCase().trim();
    const validStatuses = ['paid', 'delivered', 'shipped', 'completed'];
    if (validStatuses.includes(status)) {
      order.items?.forEach((item: any) => {
        if (item.name) productsMap.set(item.name, item.name);
      });
    }
  });
  const purchasedBoxes = Array.from(productsMap.values()).filter(name =>
    name === 'Seek Rush' || name === 'Scarf Dumb Charades' || name === 'Confidence Journal'
  );
  const claimedLotteryCount = user.claimedLotteryCount || 0;
  const eligibleLotteryCount = Math.max(purchasedBoxes.length, claimedLotteryCount);
  // ---------------------------------------------


  // --- Individual Timelines Data ---
  
  // 1. Profile Completion
  const profileSteps = [
    { label: 'Pending', icon: Clock, color: profileCompleted ? 'green' : 'amber' },
    { label: 'Completed', icon: CheckCircle2, color: profileCompleted ? 'green' : 'gray' }
  ];
  const profileProgress = profileCompleted ? 100 : 0;

  // 2. Entry Reel
  const reelSteps = [
    { label: 'Not Submitted', icon: AlertCircle, color: entryChallengeStatus === 'not_submitted' ? 'amber' : 'green' },
    { label: entryChallengeStatus === 'rejected' ? 'Rejected' : 'Reviewing', icon: entryChallengeStatus === 'rejected' ? XCircle : Clock, color: entryChallengeStatus === 'not_submitted' ? 'gray' : entryChallengeStatus === 'rejected' ? 'red' : entryChallengeStatus === 'pending' ? 'amber' : 'green' },
    { label: 'Approved', icon: CheckCircle2, color: entryChallengeStatus === 'approved' ? 'green' : 'gray' }
  ];
  const reelProgress = entryChallengeStatus === 'approved' ? 100 : entryChallengeStatus === 'not_submitted' ? 0 : 50;
  const reelProgressColor = entryChallengeStatus === 'rejected' ? 'bg-red-500' : 'bg-green-500';

  // 3. Brain Gym
  const brainGymSteps = [
    { label: 'Not Submitted', icon: AlertCircle, color: computedBgStatus === 'not_submitted' ? 'amber' : 'green' },
    { label: computedBgStatus === 'rejected' ? 'Rejected' : 'Reviewing', icon: computedBgStatus === 'rejected' ? XCircle : Clock, color: computedBgStatus === 'not_submitted' ? 'gray' : computedBgStatus === 'rejected' ? 'red' : computedBgStatus === 'pending' ? 'amber' : 'green' },
    { label: 'Approved', icon: CheckCircle2, color: computedBgStatus === 'approved' ? 'green' : 'gray' }
  ];
  const brainGymProgress = computedBgStatus === 'approved' ? 100 : computedBgStatus === 'not_submitted' ? 0 : 50;
  const brainGymProgressColor = computedBgStatus === 'rejected' ? 'bg-red-500' : 'bg-green-500';

  // 4. Lottery Claims
  const lotterySteps = [
    { label: 'Eligible', icon: Ticket, color: eligibleLotteryCount > 0 ? 'green' : 'amber' }
  ];

  if (eligibleLotteryCount === 0) {
    lotterySteps.push({ label: 'No Boxes', icon: AlertCircle, color: 'gray' });
  } else {
    for(let i=1; i<=eligibleLotteryCount; i++) {
       const isClaimed = claimedLotteryCount >= i;
       const isCurrent = claimedLotteryCount === i - 1;
       
       lotterySteps.push({
         label: `Claim ${i}`,
         icon: isClaimed ? CheckCircle2 : Clock,
         color: isClaimed ? 'green' : isCurrent ? 'amber' : 'gray'
       });
    }
  }

  let lotteryProgress = 0;
  if (eligibleLotteryCount > 0) {
    lotteryProgress = (claimedLotteryCount / eligibleLotteryCount) * 100;
  }
  // ---------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user.name || `Customer ${user.phone?.slice(-4) || user.email}`}
          </h1>
          <p className="text-gray-600 mt-1">User ID: {user.id.slice(-8)}</p>
          <div className="flex gap-4 mt-2 text-sm text-gray-600">
            {user.phone && <span>📱 {user.phone}</span>}
            {user.email && <span>✉️ {user.email}</span>}
            <span>Joined: {new Date(user.createdAt).toLocaleDateString('en-IN')}</span>
          </div>
        </div>
        <Link
          href="/users"
          className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Back to Users
        </Link>
      </div>

      {/* Challenges & Milestones Timelines Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
              🏆 Individual Challenges
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1">Detailed progress for each milestone.</p>
          </div>
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-black bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200 shadow-sm whitespace-nowrap">
            Total Earned: {user.swagoMoney || 0} SD 🪙
          </span>
        </div>

        <div className="p-6 md:p-8 bg-gray-50/50">
          <ChallengeTimelineRow 
            title="Profile Completion" 
            description="Kid's demographic details"
            icon={UserIcon}
            steps={profileSteps}
            progressPercent={profileProgress}
          />

          <ChallengeTimelineRow 
            title="Entry Reel" 
            description="Instagram Reel submission"
            icon={Video}
            steps={reelSteps}
            progressPercent={reelProgress}
            progressColor={reelProgressColor}
          />

          <ChallengeTimelineRow 
            title="Brain Gym" 
            description="Cognitive development tasks"
            icon={Brain}
            steps={brainGymSteps}
            progressPercent={brainGymProgress}
            progressColor={brainGymProgressColor}
          />

          <ChallengeTimelineRow 
            title="Lottery Claims" 
            description={`Based on ${eligibleLotteryCount} eligible box(es)`}
            icon={Ticket}
            steps={lotterySteps}
            progressPercent={lotteryProgress}
          />
        </div>
      </div>

      {/* Cart Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Cart Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatPrice(cartStats.totalValue)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Items in Cart</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {cartStats.itemCount} <span className="text-sm text-gray-500">({cartStats.distinctProducts} products)</span>
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Last Updated</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {getTimeAgo(cartStats.lastUpdated)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Cart Status</p>
          <p className={`text-lg font-semibold mt-1 ${cartStats.isAbandoned ? 'text-red-600' : 'text-green-600'}`}>
            {cartStats.isAbandoned ? '⚠️ Abandoned' : '✓ Active'}
          </p>
          {cartStats.oldestItemDate && (
            <p className="text-xs text-gray-500 mt-1">
              Oldest item: {getTimeAgo(cartStats.oldestItemDate)}
            </p>
          )}
        </div>
      </div>

      {/* Current Cart Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Current Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
          </h2>
        </div>

        {cart.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            Cart is empty
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subtotal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Added
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cart.map((item: any, index: number) => (
                  <tr key={item._id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                            sizes="64px"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            ID: {item.productId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(item.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getTimeAgo(item.addedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Total:
                  </td>
                  <td colSpan={2} className="px-6 py-4 text-sm font-bold text-gray-900">
                    {formatPrice(cartStats.totalValue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Order History Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Order History ({orders.length})
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No orders yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.map((order: any) => (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        Order #{order._id.slice(-8)}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPrice(order.total || 0)}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      View Details →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Wishlist Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Wishlist ({wishlist.length})
          </h2>
        </div>

        {wishlist.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Wishlist is empty
          </div>
        ) : (
          <div className="px-6 py-4">
            <ul className="space-y-2">
              {wishlist.map((item: any, index: number) => (
                <li key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-900">{item.name}</span>
                  <span className="text-xs text-gray-500">ID: {item.productId}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
    shipped: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Shipped' },
    delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
