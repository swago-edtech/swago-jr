import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { connectDB, ContactSubmission } from '@swago/database';
import { getAdminSession } from '@/lib/auth';
import UpdateContactStatus from '@/components/UpdateContactStatus';

// Subject label mapping
const subjectLabels: Record<string, string> = {
  product: 'Product Questions',
  order: 'Order Support',
  shipping: 'Shipping & Delivery',
  general: 'General Inquiry',
  other: 'Other',
};

async function getSubmission(id: string) {
  await connectDB();
  
  const submission = await ContactSubmission.findById(id).lean();
  
  if (!submission) {
    return null;
  }

  return JSON.parse(JSON.stringify(submission));
}

async function markAsViewed(id: string) {
  await connectDB();
  
  await ContactSubmission.findByIdAndUpdate(
    id,
    { isViewed: true },
    { new: true }
  );
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Check admin session
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;
  const submission = await getSubmission(id);

  if (!submission) {
    notFound();
  }

  // Mark as viewed when admin opens the page
  await markAsViewed(id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Submission Details</h1>
          <p className="text-gray-600 mt-1">Submission ID: #{submission._id.slice(-8)}</p>
        </div>
        <Link
          href="/contact"
          className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Back to Submissions
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-sm font-medium text-gray-900">
                {submission.firstName} {submission.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{submission.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-900">{submission.phone}</p>
            </div>
          </div>
        </div>

        {/* Submission Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Subject</p>
              <p className="text-sm font-medium text-gray-900">
                {subjectLabels[submission.subject] || submission.subject}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Submitted On</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(submission.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(submission.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <StatusBadge status={submission.status} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          <UpdateContactStatus
          submissionId={submission._id.toString()} 
          currentStatus={submission.status} 
          />
        </div>
      </div>

      {/* Message */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Message</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-900 whitespace-pre-wrap">{submission.message}</p>
        </div>
      </div>
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    resolved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Resolved' },
  };

  const statusConfig = config[status] || config.pending;

  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
      {statusConfig.label}
    </span>
  );
}
