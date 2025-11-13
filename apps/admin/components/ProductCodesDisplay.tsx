'use client';

import { useEffect, useState } from 'react';

interface ProductCode {
  id: string;
  code: string;
  productId: number;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
  createdAt: string;
}

interface ProductCodesDisplayProps {
  orderId: string;
  orderStatus: string;
}

export default function ProductCodesDisplay({ orderId, orderStatus }: ProductCodesDisplayProps) {
  const [codes, setCodes] = useState<ProductCode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCodes = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/codes`);
      const data = await res.json();
      
      if (data.success) {
        setCodes(data.codes);
      }
    } catch (error) {
      console.error('Failed to fetch codes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, [orderId]);

  // Don't show section if no codes exist
  if (loading) {
    return <p className="text-sm text-gray-500">Loading codes...</p>;
  }

  if (codes.length === 0) {
    return null;
  }

  const productNames: { [key: number]: string } = {
    3: 'Scarf Dumb Charades',
    8: 'Seek Rush',
  };

  return (
    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-sm font-semibold text-blue-800 mb-3">
        📦 Product Unlock Codes
      </h3>
      <p className="text-xs text-blue-700 mb-3">
        Include these codes as printed cards in the physical product boxes:
      </p>
      
      <div className="space-y-3">
        {codes.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-lg border border-blue-300 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {productNames[item.productId] || `Product ${item.productId}`}
                </p>
                <p className="text-xs text-gray-500">
                  Product ID: {item.productId}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(item.code);
                  alert(`Code copied: ${item.code}`);
                }}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                📋 Copy
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <code className="block text-lg font-mono font-bold text-blue-900 tracking-wider">
                {item.code}
              </code>
            </div>

            {/* Usage Status */}
            <div className="mt-2 flex items-center gap-2">
              {item.isUsed ? (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  ✅ Used by customer
                </span>
              ) : (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  ⏳ Not used yet
                </span>
              )}
              <span className="text-xs text-gray-500">
                Generated: {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Print these codes on small cards and include them inside the product packaging. Customers will use them to unlock digital content in their kid profiles.
        </p>
      </div>
    </div>
  );
}