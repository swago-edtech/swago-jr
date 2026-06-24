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

  const query: any = { $and: [] };

  if (searchParams.q) {
    const searchRegex = new RegExp(searchParams.q, 'i');
    query.$and.push({
      $or: [
        { orderId: searchRegex },
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
      ]
    });
  }

  const currentTab = searchParams.tab || 'current';

  if (currentTab === 'abandoned') {
    if (searchParams.status) {
       query.$and.push({ status: new RegExp(`^${searchParams.status}$`, 'i') });
    } else {
       query.$and.push({ status: { $in: [new RegExp('^abandoned$', 'i'), new RegExp('^failed$', 'i')] } });
    }
  } else {
    if (searchParams.status) {
       query.$and.push({ status: new RegExp(`^${searchParams.status}$`, 'i') });
    } else {
       // Exclude abandoned and failed for current tab
       query.$and.push({ status: { $nin: [new RegExp('^abandoned$', 'i'), new RegExp('^failed$', 'i')] } });
    }
  }

  if (searchParams.payment) {
    if (searchParams.payment === 'coupon_applied') {
      query.$and.push({ couponCode: { $exists: true, $ne: null, $nin: ["", " "] } });
    } else if (searchParams.payment === 'coupon_none') {
      query.$and.push({
        $or: [
          { couponCode: { $exists: false } },
          { couponCode: null },
          { couponCode: "" },
          { couponCode: " " }
        ]
      });
    } else {
      query.$and.push({ paymentMethod: new RegExp(`^${searchParams.payment}$`, 'i') });
    }
  }

  if (searchParams.source) {
    if (searchParams.source === 'express') {
      query.$and.push({ createdVia: 'express' });
    } else if (searchParams.source === 'standard') {
      query.$and.push({ createdVia: { $in: ['frontend', 'webhook'] } });
    } else {
      const sourceRegex = new RegExp(searchParams.source, 'i');
      query.$and.push({
        $or: [
          { utm_source: sourceRegex },
          { referralSource: sourceRegex }
        ]
      });
    }
  }

  if (searchParams.dateRange) {
    const now = new Date();
    let startDateObj = new Date();
    let endDateObj = new Date();
    
    // Set to end of today for the end boundary
    endDateObj.setHours(23, 59, 59, 999);

    let applyDateFilter = false;

    switch(searchParams.dateRange) {
      case 'today':
        startDateObj.setHours(0, 0, 0, 0);
        applyDateFilter = true;
        break;
      case 'yesterday':
        startDateObj.setDate(startDateObj.getDate() - 1);
        startDateObj.setHours(0, 0, 0, 0);
        endDateObj.setDate(endDateObj.getDate() - 1);
        endDateObj.setHours(23, 59, 59, 999);
        applyDateFilter = true;
        break;
      case 'last7':
        startDateObj.setDate(startDateObj.getDate() - 7);
        startDateObj.setHours(0, 0, 0, 0);
        applyDateFilter = true;
        break;
      case 'last30':
        startDateObj.setDate(startDateObj.getDate() - 30);
        startDateObj.setHours(0, 0, 0, 0);
        applyDateFilter = true;
        break;
      case 'custom':
        if (searchParams.startDate && searchParams.endDate) {
          startDateObj = new Date(searchParams.startDate);
          startDateObj.setHours(0, 0, 0, 0);
          endDateObj = new Date(searchParams.endDate);
          endDateObj.setHours(23, 59, 59, 999);
          applyDateFilter = true;
        } else if (searchParams.startDate) {
          startDateObj = new Date(searchParams.startDate);
          startDateObj.setHours(0, 0, 0, 0);
          query.$and.push({ createdAt: { $gte: startDateObj } });
        } else if (searchParams.endDate) {
          endDateObj = new Date(searchParams.endDate);
          endDateObj.setHours(23, 59, 59, 999);
          query.$and.push({ createdAt: { $lte: endDateObj } });
        }
        break;
    }

    if (applyDateFilter) {
      query.$and.push({
        createdAt: {
          $gte: startDateObj,
          $lte: endDateObj
        }
      });
    }
  }

  if (query.$and.length === 0) {
    delete query.$and;
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
      .select('orderId name phone email total status items createdAt razorpay_payment_id paymentMethod couponCode discount referralSource createdVia utm_source utm_medium utm_campaign')
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
        
        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg mx-4">
          <Link 
            href={{ pathname: '/orders', query: { ...searchParams, tab: 'current', page: '1', status: undefined } }} 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              (searchParams.tab || 'current') === 'current' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
          >
            Current Orders
          </Link>
          <Link 
            href={{ pathname: '/orders', query: { ...searchParams, tab: 'abandoned', page: '1', status: undefined } }} 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              searchParams.tab === 'abandoned' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
          >
            Abandoned & Failed
          </Link>
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {order.orderId || `#${order._id.slice(-6)}`}
                      </div>
                      {order.orderId && (
                        <div className="text-xs text-gray-400">
                          #{order._id.slice(-6)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-sm font-medium text-gray-900">{order.name}</div>
                      {order.email && (
                        <div className="text-xs text-gray-500">{order.email}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.phone}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      {order.items?.length > 0 ? (
                        <div className="flex flex-col gap-1 max-w-[120px]">
                          {order.items.map((item: any, idx: number) => {
                            const name = item.name || 'Item';
                            const shortName = name.length > 9 ? name.slice(0, 9) + '...' : name;
                            return (
                              <div key={idx} className="text-sm text-gray-700 flex gap-1.5 items-center">
                                <span className="font-semibold whitespace-nowrap bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                                  {item.quantity}x
                               </span>
                                <span className="truncate" title={name}>
                                  {shortName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">0 items</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.total ? formatPrice(order.total) : '₹0.00'}
                      </div>
                      {order.couponCode && (
                        <div className="text-xs text-green-700 mt-1 font-semibold bg-green-50 inline-block px-1.5 py-0.5 rounded border border-green-200">
                          {order.couponCode}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <PaymentBadge method={order.paymentMethod} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {order.createdVia === 'express' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wider">
                            Express
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 uppercase tracking-wider">
                            Standard
                          </span>
                        )}
                        {(order.utm_source || order.referralSource) && (
                          <span className="text-xs text-gray-500 font-medium truncate max-w-[120px]" title={order.utm_source || order.referralSource}>
                            {order.utm_source || order.referralSource}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* ✨ UPDATED: Use client component for date */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <OrderDateCell date={order.createdAt} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm">
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
