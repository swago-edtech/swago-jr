import { connectDB, Review, Order } from '@swago/database';
import { notFound } from 'next/navigation';
import { products } from '@swago/utils';
import ReviewDetailClient from '@/components/ReviewDetailClient';

async function getReview(id: string) {
  await connectDB();
  
  const review = await Review.findById(id)
    .populate('userId', 'name phone email')
    .populate('orderId', '_id')
    .lean();

  if (!review) {
    return null;
  }

  // Backfill user name from order if missing
  const reviewData = review as any;
  if (!reviewData.userId?.name && reviewData.userId?.phone) {
    const recentOrder = await Order.findOne({ phone: reviewData.userId.phone })
      .sort({ createdAt: -1 })
      .select('name')
      .lean();
    
    if (recentOrder && (recentOrder as any).name) {
      reviewData.userId.name = (recentOrder as any).name;
    }
  }

  return JSON.parse(JSON.stringify(reviewData));
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = await getReview(id);

  if (!review) {
    notFound();
  }

  // Get product details
  const product = products.find((p) => p.id === review.productId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <a
          href="/reviews"
          className="text-gray-600 hover:text-gray-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </a>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review Details</h1>
          <p className="text-gray-600 mt-1">Review #{review._id.slice(-6)}</p>
        </div>
      </div>

      {/* Review Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Review Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{review.title}</h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-2xl ${
                          i < review.rating ? 'text-yellow-500' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {review.rating} out of 5
                  </span>
                </div>
              </div>
              <StatusBadge status={review.status} />
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {review.comment}
              </p>
            </div>

            {review.images && review.images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Review Images</h3>
                <div className="grid grid-cols-3 gap-4">
                  {review.images.map((img: string, index: number) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Review image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Submitted on {new Date(review.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* AI Sentiment Analysis */}
          <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-blue-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                />
              </svg>
              AI Sentiment Analysis
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Sentiment Label</span>
                <SentimentBadge sentiment={review.sentimentLabel} />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Confidence Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(review.sentimentScore || 0) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {((review.sentimentScore || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              
              {review.sentimentReasoning && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-gray-700 block mb-2">
                    AI Reasoning
                  </span>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-blue-200">
                    {review.sentimentReasoning}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Info</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="text-sm font-medium text-gray-900">
                  {review.userId?.name || `Customer ${review.userId?.phone?.slice(-4)}` || 'Anonymous'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="text-sm font-medium text-gray-900">
                  {review.userId?.phone || 'N/A'}
                </div>
              </div>
              {review.userId?.email && (
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="text-sm font-medium text-gray-900">
                    {review.userId.email}
                  </div>
                </div>
              )}
            </div>
          </div>

                    {/* Product Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Product Info</h3>
            {product ? (
              <div>
                <img
                  src={product.images[0]}
                  alt={`${product.name} product image`}
                  className="w-full h-32 object-cover rounded-lg mb-3 bg-gray-100"
                />
                <div className="text-sm font-semibold text-gray-900 mb-1">{product.name}</div>
                <div className="text-base font-bold text-gray-900">₹{product.price.toFixed(2)}</div>
              </div>
            ) : (
              <div className="text-sm font-semibold text-gray-900">Product #{review.productId}</div>
            )}
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Info</h3>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-500">Order ID</div>
                <div className="text-sm font-mono font-medium text-gray-900">
                  #{review.orderId?._id?.slice(-6) || 'N/A'}
                </div>
              </div>
              {review.isVerifiedPurchase && (
                <div className="mt-3 flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="text-sm font-medium">Verified Purchase</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <ReviewDetailClient reviewId={review._id} currentStatus={review.status} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    approved: { bg: 'bg-green-100', text: 'text-green-800' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const sentimentConfig: Record<string, { bg: string; text: string }> = {
    POSITIVE: { bg: 'bg-green-100', text: 'text-green-800' },
    NEUTRAL: { bg: 'bg-gray-100', text: 'text-gray-800' },
    NEGATIVE: { bg: 'bg-red-100', text: 'text-red-800' },
  };

  const config = sentimentConfig[sentiment] || sentimentConfig.NEUTRAL;

  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
      {sentiment}
    </span>
  );
}