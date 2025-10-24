import { connectDB, Review } from '@swago/database';
import Link from 'next/link';
import ReviewsTable from '@/components/ReviewsTable';

async function getReviews() {
  await connectDB();
  
  const reviews = await Review.find()
    .populate('userId', 'name phone email')
    .populate('orderId', '_id')
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(reviews));
}

async function getReviewStats() {
  await connectDB();
  
  const [total, pending, approved, rejected] = await Promise.all([
    Review.countDocuments(),
    Review.countDocuments({ status: 'pending' }),
    Review.countDocuments({ status: 'approved' }),
    Review.countDocuments({ status: 'rejected' }),
  ]);

  return { total, pending, approved, rejected };
}

export default async function ReviewsPage() {
  const reviews = await getReviews();
  const stats = await getReviewStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-600 mt-1">Manage customer reviews and ratings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 uppercase tracking-wider">Total Reviews</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
          <div className="text-sm text-yellow-700 uppercase tracking-wider">Pending</div>
          <div className="text-3xl font-bold text-yellow-900 mt-2">{stats.pending}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
          <div className="text-sm text-green-700 uppercase tracking-wider">Approved</div>
          <div className="text-3xl font-bold text-green-900 mt-2">{stats.approved}</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
          <div className="text-sm text-red-700 uppercase tracking-wider">Rejected</div>
          <div className="text-3xl font-bold text-red-900 mt-2">{stats.rejected}</div>
        </div>
      </div>

      {/* Reviews Table (Client Component) */}
      <ReviewsTable initialReviews={reviews} />
    </div>
  );
}