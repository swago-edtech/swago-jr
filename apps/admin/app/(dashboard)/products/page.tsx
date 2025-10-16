import { products } from '@swago/utils';
import { formatPrice } from '@swago/utils';
import Image from 'next/image';

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {products.length} products
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
            {/* Product Image */}
            <div className="relative h-48 bg-gray-100">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Product Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {product.name}
                </h3>
              </div>

              <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                {product.description}
              </p>

              {/* Age Category */}
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Age {product.age_category}
                </span>
              </div>

              {/* Pricing */}
              <div className="flex items-baseline space-x-2 mb-4">
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
              </div>

              {/* Core Elements */}
              {product.core_elements && product.core_elements.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Core Elements:</p>
                  <div className="flex flex-wrap gap-1">
                    {product.core_elements.map((element, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {element}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Product ID */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500">Product ID: {product.id}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Products are currently hardcoded in the codebase. 
          To add or edit products, update the <code className="bg-blue-100 px-2 py-1 rounded">packages/utils/src/products.ts</code> file.
        </p>
      </div>
    </div>
  );
}