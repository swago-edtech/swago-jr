import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@swago/utils';
import { connectDB, User, Product } from '@swago/database';
import { getAdminSession } from '@/lib/auth';

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
