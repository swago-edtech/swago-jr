import { connectDB, Order } from '@swago/database';
import { formatPrice } from '@swago/utils';
import { notFound } from 'next/navigation';
import { products } from '@swago/utils';
import UpdateOrderStatus from '@/components/UpdateOrderStatus';
import ProductCodesDisplay from '@/components/ProductCodesDisplay';
import OrderDetailDate from './OrderDetailDate'; // ✨ NEW: Client component

async function getOrder(id: string) {
  await connectDB();
  
  const order = await Order.findById(id).lean();
  
  if (!order) {
    return null;
  }

  return JSON.parse(JSON.stringify(order));
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    notFound();
  }

  // Calculate totals from items if not stored in order
  const calculatedSubtotal = order.items?.reduce((sum: number, item: any) => 
    sum + ((item.price || 0) * (item.quantity || 0)), 0) || 0;
  
  const subtotal = order.subtotal || calculatedSubtotal;
  const discount = order.discount || 0;
  const total = order.total || (subtotal - discount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-600 mt-1">Order ID: #{order._id.slice(-8)}</p>
        </div>
        <UpdateOrderStatus orderId={order._id} currentStatus={order.status} />
      </div>

      {/* Order Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-sm font-medium text-gray-900">{order.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-900">{order.phone}</p>
            </div>
            {order.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{order.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-sm font-medium text-gray-900">{order.address}</p>
            </div>
            {order.city && (
              <div>
                <p className="text-sm text-gray-500">City</p>
                <p className="text-sm font-medium text-gray-900">{order.city}</p>
              </div>
            )}
            {order.state && (
              <div>
                <p className="text-sm text-gray-500">State</p>
                <p className="text-sm font-medium text-gray-900">{order.state}</p>
              </div>
            )}
            {order.pincode && (
              <div>
                <p className="text-sm text-gray-500">Pincode</p>
                <p className="text-sm font-medium text-gray-900">{order.pincode}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3">
            {/* ✨ UPDATED: Use client component for date */}
            <div>
              <p className="text-sm text-gray-500">Order Date</p>
              <OrderDetailDate date={order.createdAt} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment ID</p>
              <p className="text-sm font-mono text-gray-900">
                {order.razorpay_payment_id || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <StatusBadge status={order.status} />
            </div>
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(total)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.items?.map((item: any, index: number) => {
                // Try to find product by ID first, then by name
                let product = item.productId 
                  ? products.find((p) => p.id === item.productId)
                  : products.find((p) => p.name === item.name);
                
                // Use stored price or get from product data
                const price = item.price || product?.price || 0;
                
                return (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.name || product?.name || 'Unknown Product'}
                          </div>
                          <div className="text-sm text-gray-900">
                            {product?.age_category || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(price * (item.quantity || 0))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Order Totals */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-900">Subtotal:</span>
                <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold border-t pt-2">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Codes Section */}
      <ProductCodesDisplay orderId={order._id} orderStatus={order.status} />
    </div>
  );
}

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
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
