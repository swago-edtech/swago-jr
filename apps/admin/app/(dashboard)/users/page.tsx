import { connectDB, User, Order } from '@swago/database';
import Link from 'next/link';
import UserFilters from './UserFilters';
import Pagination from '@/components/Pagination';

async function getUsers(searchParams: { [key: string]: string | undefined }) {
  await connectDB();
  
  const query: any = { isAdmin: false };

  if (searchParams.q) {
    const searchRegex = new RegExp(searchParams.q, 'i');
    query.$or = [
      { name: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
    ];
  }

  let sortConfig: any = { createdAt: -1 };
  if (searchParams.sort) {
    switch (searchParams.sort) {
      case 'oldest':
        sortConfig = { createdAt: 1 };
        break;
      case 'newest':
      default:
        sortConfig = { createdAt: -1 };
        break;
    }
  }

  const page = parseInt(searchParams.page || '1', 10) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const [users, totalCount] = await Promise.all([
    User.find(query)
      .sort(sortConfig)
      .skip(skip)
      .limit(limit)
      .select('name phone email orders wishlist cart createdAt') // ✅ Added 'cart'
      .populate('orders')
      .lean(),
    User.countDocuments(query)
  ]);

  // Backfill user names from their most recent order if missing
  const enrichedUsers = await Promise.all(
    users.map(async (user: any) => {
      if (!user.name && user.phone) {
        // Find most recent order by this user's phone
        const recentOrder = await Order.findOne({ phone: user.phone })
          .sort({ createdAt: -1 })
          .select('name')
          .lean();
        
        if (recentOrder && (recentOrder as any).name) {
          user.name = (recentOrder as any).name;
        }
      }
      return user;
    })
  );

  return {
    users: JSON.parse(JSON.stringify(enrichedUsers)),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    }
  };
}

export default async function UsersPage(props: { searchParams?: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = (await props.searchParams) || {};
  const { users, pagination } = await getUsers(searchParams);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage customer accounts</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {pagination.totalCount} customers
        </div>
      </div>

      <UserFilters />

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                {/* ✅ NEW: Cart column */}
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cart
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wishlist
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No customers found
                  </td>
                </tr>
              ) : (
                users.map((user: any) => {
                  // ✅ Calculate cart item count
                  const cartItemCount = user.cart?.reduce(
                    (sum: number, item: any) => sum + (item.quantity || 0),
                    0
                  ) || 0;

                  return (
                     <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {user.name?.charAt(0).toUpperCase() || user.phone?.slice(-2) || 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            {/* ✅ Make name clickable */}
                            <Link
                              href={`/users/${user._id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {user.name || `Customer ${user.phone?.slice(-4)}`}
                            </Link>
                            <div className="text-xs text-gray-500">
                              ID: {user._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {user.email || <span className="text-gray-400">Not provided</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {user.orders?.length || 0}
                          </span>
                          <span className="ml-1 text-xs text-gray-500">orders</span>
                        </div>
                      </td>
                      {/* ✅ NEW: Cart column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {cartItemCount}
                          </span>
                          <span className="ml-1 text-xs text-gray-500">items</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {user.wishlist?.length || 0}
                          </span>
                          <span className="ml-1 text-xs text-gray-500">items</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination 
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
      />


      {/* Stats Cards */}
      {pagination.totalCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{pagination.totalCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Orders (Current Page)</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {users.reduce((sum: number, user: any) => sum + (user.orders?.length || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Avg Orders/Customer (Current Page)</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {(users.reduce((sum: number, user: any) => sum + (user.orders?.length || 0), 0) / (users.length || 1)).toFixed(1)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
