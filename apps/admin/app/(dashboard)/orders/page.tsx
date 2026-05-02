import { connectDB, Order } from '@swago/database';
import { formatPrice } from '@swago/utils';
import Link from 'next/link';
import OrderDateCell from './OrderDateCell'; // ✨ NEW: Client component for dates
import { cleanupExpiredOrders } from '@/lib/cleanupExpiredOrders';
import OrderFilters from './OrderFilters';
import Pagination from '@/components/Pagination';

async function getOrders(searchParams: { [key: string]: string | undefined }) {
  await connectDB();

  // ✅ Clean up expired prepaid orders
  await cleanupExpiredOrders();

  const query: any = {};

  if (searchParams.q) {
    const searchRegex = new RegExp(searchParams.q, 'i');
    query.$or = [
      { orderId: searchRegex },
      { name: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
    ];
  }

  if (searchParams.status) {
    query.status = searchParams.status;
  }

  if (searchParams.payment) {
    query.paymentMethod = searchParams.payment;
  }

  let sortConfig: any = { createdAt: -1 };
  if (searchParams.sort) {
    switch (searchParams.sort) {
      case 'oldest':
        sortConfig = { createdAt: 1 };
        break;
      case 'highest':
        sortConfig = { total: -1 };
        break;
      case 'lowest':
        sortConfig = { total: 1 };
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

  const [orders, totalCount] = await Promise.all([
    Order.find(query)
      .sort(sortConfig)
      .skip(skip)
      .limit(limit)
      .select('orderId name phone email total status items createdAt razorpay_payment_id paymentMethod couponCode discount')
      .lean(),
    Order.countDocuments(query)
  ]);

  return {
    orders: JSON.parse(JSON.stringify(orders)),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    }
  };
}

export default async function OrdersPage(props: { searchParams?: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = (await props.searchParams) || {};
  const { orders, pagination } = await getOrders(searchParams);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">Manage all customer orders</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {pagination.totalCount} orders
        </div>
      </div>

      <OrderFilters />

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {order.orderId || `#${order._id.slice(-6)}`}
                      </div>
                      {order.orderId && (
                        <div className="text-xs text-gray-400">
                          #{order._id.slice(-6)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.name}</div>
                      {order.email && (
                        <div className="text-xs text-gray-500">{order.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.items?.length || 0} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.total ? formatPrice(order.total) : '₹0.00'}
                      </div>
                      {order.couponCode && (
                        <div className="text-xs text-green-700 mt-1 font-semibold bg-green-50 inline-block px-1.5 py-0.5 rounded border border-green-200">
                          {order.couponCode}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PaymentBadge method={order.paymentMethod} />
                    </td>
                    {/* ✨ UPDATED: Use client component for date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OrderDateCell date={order.createdAt} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/orders/${order._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
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
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
    shipped: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Shipped' },
    delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
    failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
    abandoned: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Abandoned' },
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

// ✅ Payment method badge
function PaymentBadge({ method }: { method?: string }) {
  const isCOD = method === 'cod';

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded ${isCOD
      ? 'bg-amber-100 text-amber-700'
      : 'bg-green-100 text-green-700'
      }`}>
      {isCOD ? 'Cash on Delivery' : 'Prepaid (Razorpay)'}
    </span>
  );
}
