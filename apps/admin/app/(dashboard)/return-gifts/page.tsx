import React from 'react';
import { getReturnGiftOrders } from './actions';
import ResolveButton from './ResolveButton';

export const metadata = {
  title: 'Return Gifts Submissions | Admin Dashboard',
};

export default async function ReturnGiftsAdminPage() {
  const orders = await getReturnGiftOrders();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Return Gifts Inquiries</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No submissions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Name & Contact</th>
                  <th className="p-4 font-semibold">Product Details</th>
                  <th className="p-4 font-semibold">Message</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {orders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 align-top whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-medium text-gray-900">{order.name}</div>
                      <div className="text-gray-500 mt-1">{order.phone}</div>
                      <div className="text-gray-500">{order.email}</div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-medium text-gray-900">{order.product}</div>
                      <div className="text-gray-500 mt-1 whitespace-nowrap">Qty: {order.quantity}</div>
                      <div className="text-gray-500 mt-1 max-w-xs truncate" title={order.address}>
                        {order.address}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="max-w-sm text-gray-600 whitespace-pre-wrap text-sm">
                        {order.message || '-'}
                      </div>
                    </td>
                    <td className="p-4 align-top whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.status === 'resolved' ? 'Resolved' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 align-top text-right">
                      {order.status === 'pending' && (
                        <ResolveButton id={order._id} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
